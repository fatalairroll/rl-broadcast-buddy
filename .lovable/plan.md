
# Plan: naprawa zawieszeń gry powodowanych przez `relay.py`

## Diagnoza — dlaczego gra się zawiesza

W obecnym skrypcie (`src/pages/Relay.tsx`, treść `relay.py`) **wątek czytający z gniazda RL Stats API jest tym samym wątkiem, który wykonuje synchroniczne zapisy HTTP do Supabase**. Konkretnie w `tcp_loop` → `_drain_buffer` → `_process_payload` → `handle_event` → `handle_update_state` wywołujemy bezpośrednio:

- `upsert_match()` → `sb.table("match_metadata").upsert(...).execute()` (blokujący HTTP)
- `upsert_camera()` → blokujący HTTP
- `upsert_players(rows)` → blokujący HTTP
- `prune_stale_players(...)` → **`SELECT` + osobny `DELETE` per gracz, na każdy `UpdateState`** (czyli ~30×/s przy `PacketSendRate=30`)
- `clear_all_players()` na `MatchCreated/Initialized` — też SELECT + N×DELETE

RL Stats API to lokalny strumień TCP. Gra zapisuje do tego gniazda **synchronicznie z głównej pętli renderowania** — jeśli klient (nasz relay) nie odczytuje wystarczająco szybko, kernelowy bufor TCP się zapełnia, `send()` w grze blokuje, a Rocket League **dosłownie zamarza** do czasu, aż relay znów coś wczyta. Każdy zapis do Supabase trwający 100–500 ms (lub timeout kilku sekund) → tyle samo zawieszenia gry.

Drugi problem: `prune_stale_players` jest O(graczy_w_db) i wykonuje round-trip do bazy oraz oddzielny DELETE per gracz przy **każdym** snapshocie. To gwarantowane lagi.

Throttle (`WRITE_INTERVAL_S=0.25`) tylko zmniejsza częstotliwość, ale gdy zapis się odpali, nadal blokuje recv.

## Rozwiązanie (architektura)

Producent/konsument: **wątek TCP tylko parsuje i aktualizuje stan w pamięci**. Osobny **worker DB** czyta najnowszy stan i flushuje go z własnym tempem. Recv nigdy nie czeka na sieć Supabase.

```
[RL TCP recv] → parse → update in-memory snapshot (lock)
                                  │
                                  ▼
                       [DB worker thread, ~4 Hz]
                       reads snapshot → upsert
```

Kluczowe zasady:
- recv loop **nigdy** nie wywołuje `sb.*.execute()`
- worker DB **koalescjuje** — pisze tylko aktualny stan, nie kolejkę zdarzeń
- prune/clear graczy: nie per snapshot. `clear_all_players` zostaje przy `MatchCreated`, ale wykonywany asynchronicznie w workerze. `prune_stale_players` zastąpiony przez `is_active=false` na wpisach, których nie ma w aktualnym snapie (jedna operacja batch), uruchamiany rzadko (np. raz na 2 s).
- socket: ustawić `SO_RCVBUF` większy + `TCP_NODELAY`; recv w pętli bez blokowania na niczym innym.
- `requests`/`supabase-py` synchroniczne — zostawiamy, ale tylko w workerze. Dodatkowo **timeout** krótki, żeby jedno zacięcie sieci nie zatrzymało workera na minutę (recv i tak działa niezależnie, ale chcemy świeże dane).

## Zmiany w `relay.py` (osadzony w `src/pages/Relay.tsx`)

1. **Globalny snapshot w pamięci** (już prawie jest — `local_time_seconds`, `blue_score`, itd.). Dodać `players_snapshot: dict[name → row]` aktualizowane w `handle_update_state` zamiast bezpośredniego `upsert_players`.

2. **Usunąć z `handle_*` wszystkie wywołania `sb.*`**:
   - `upsert_match()` w `handle_update_state` / `handle_clock_updated` / `clock_loop` / `MatchCreated` → tylko ustawiają `dirty_match=True`.
   - `upsert_camera()` → ustawia `pending_camera = target` + `dirty_camera`.
   - `upsert_players()` / `prune_stale_players()` → znikają z hot path. Zamiast tego w snapshot trafia pełna lista nicków z bieżącego pakietu i `dirty_players=True`.
   - `clear_all_players()` na `MatchCreated` → `clear_requested=True`.

3. **Nowy wątek `db_worker_loop`**:
   - tick co `WRITE_INTERVAL_S` (0.25 s).
   - pod lockiem robi shallow copy flag + danych, czyści flagi, **zwalnia lock**, potem wykonuje HTTP poza lockiem.
   - kolejność: jeśli `clear_requested` → `clear_all_players()`; potem match, camera, players (jeden upsert z tablicą), na koniec ewentualny soft-prune (raz na ~2 s) wykonywany jednym zapytaniem typu `delete().not_.in_("player_name", current_names)` — jeśli klient supabase-py tej wersji nie wspiera, robimy SELECT + jeden DELETE z `in_(stale_list)` zamiast pętli.
   - każde wywołanie HTTP w `try/except` z `timeout` (np. 3 s) i logiem; błąd nie zatrzymuje workera.

4. **Lokalna pętla zegara** (`clock_loop`) — zostawić, ale również nie wywoływać DB; tylko `dirty_match=True`. Worker i tak puszcza match z 4 Hz, co dla zegara w overlay wystarczy.

5. **Socket hardening** w `tcp_loop`:
   - `sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)`
   - `sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 1 << 20)` (1 MiB)
   - `RECV_CHUNK` zostaje 65 536.
   - usunąć jakiekolwiek logi/`print` wywoływane per pakiet (już jest tylko `_dbg_printed<3`, ok).

6. **Heartbeat** — bez zmian, ale dodać `db_queue_depth` flagi (informacyjnie: czy worker zdąża).

7. **Bezpieczeństwo wątkowe**: jeden `state_lock` chroni snapshot + flagi. Lock trzymany tylko na czas mutacji pamięci, nigdy podczas I/O.

## Pliki do edycji

- `src/pages/Relay.tsx` — zaktualizowana zawartość `getRelayScript()` (cały Python). To jedyny plik do zmiany; overlay i baza pozostają jak są.
- (opcjonalnie) krótka notka w sekcji „Aktualizacja” na stronie `/relay` informująca, że stara wersja powodowała mikro-zawieszenia gry i trzeba pobrać nową.

## Efekt

- Recv z RL drenowany w pętli bez blokady → bufor TCP gry nigdy się nie zapełnia → koniec zawieszeń.
- Liczba zapisów do Supabase ograniczona do ~4/s na typ, zamiast skoków do 30/s + N delete'ów.
- Awaria sieci do Supabase nie wpływa już na FPS gry — najwyżej overlay przestaje się odświeżać (i tak włączy się fail-safe z `useOverlayVisibility`).

Po zatwierdzeniu wdrażam.
