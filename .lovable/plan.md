## Cel

Przepisać `getRelayScript()` w `src/pages/Relay.tsx` z v2.4 do v3 zgodnie z Architecture v3:

1. **WebSocket 49300** wysyła pełne ramki v3 (match + players + camera + series + teams).
2. **`SUPABASE_LIVE_WRITES = False`** (domyślnie) — relay nie spamuje Supabase w trakcie meczu. Zapisy do `match_metadata` / `players_live` / `active_camera` wyłączone; WS staje się jedynym kanałem live dla overlayu lokalnego.
3. **HTTP serwer na 127.0.0.1:49301** z `POST /series` i `POST /teams` — przyjmuje nadpisy z Dashboardu (przez istniejący `src/lib/relay-http.ts`) i wpina je do każdej kolejnej ramki WS.

Zmiany ograniczone do `src/pages/Relay.tsx` (string `getRelayScript()` + drobny update wersji w UI). `relay-http.ts` i hydratacja w `useBroadcast` są już na produkcji — bez zmian.

---

## Szczegóły techniczne (treść skryptu `relay.py` v3)

### Nagłówek
- Baner: `RL Broadcast Relay V3 (Python)`.
- Krótki opis: TCP→stan w pamięci, WS=primary live channel, HTTP=control plane, Supabase opcjonalnie (writes off domyślnie).

### Nowe flagi konfiguracyjne
```python
SUPABASE_LIVE_WRITES = False   # v3: domyslnie OFF. Overlay zywi sie WS-em.
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 49301
WS_FULL_FRAME_HZ = 30
WS_FULL_FRAME_MIN_INTERVAL_S = 1.0 / WS_FULL_FRAME_HZ
```

### Nowy stan overrides (z HTTP)
```python
override_lock = threading.Lock()
override_teams = {"blue_name": "", "orange_name": ""}
override_series = {"type": "bo3", "blue": 0, "orange": 0,
                   "blue_name": "", "orange_name": ""}
```

### WS broadcast — pełna ramka v3
`_maybe_broadcast_ws` buduje:
```json
{"v":3,"t":...,
 "match":{id,match_guid,timer,time_seconds,blue_score,orange_score,
          is_overtime,is_active,updated_at},
 "players":[{player_name,team_num,boost,speed,goals,assists,saves,shots,
             demos,is_demolished,is_supersonic,mmr:null,updated_at}],
 "camera":{"target_name":...},
 "series":{type,blue,orange,blue_name,orange_name},
 "teams":{blue_name,orange_name}}
```

Throttle: min 1/30 s, max 1/60 s (boost). Dodatkowo `ws_keepalive_loop` (osobny daemon) wysyła ramkę co `WS_FULL_FRAME_MIN_INTERVAL_S` nawet gdy RL nie pchnął `UpdateState` (menu/między rundami) — overlay musi widzieć aktualny `series/teams/match_active`.

### HTTP control server
Stdlib `http.server.ThreadingHTTPServer` (bez nowych zależności).

```python
def do_POST(self):
    body = self._read_json() or {}
    with override_lock:
        if self.path == "/series":
            override_series.update({
                "type": str(body.get("type", "bo3")),
                "blue": int(body.get("blue", 0)),
                "orange": int(body.get("orange", 0)),
                "blue_name": str(body.get("blue_name") or override_series["blue_name"]),
                "orange_name": str(body.get("orange_name") or override_series["orange_name"]),
            })
        elif self.path == "/teams":
            override_teams.update({
                "blue_name": str(body.get("blue_name", "")),
                "orange_name": str(body.get("orange_name", "")),
            })
            if not override_series["blue_name"]:
                override_series["blue_name"] = override_teams["blue_name"]
            if not override_series["orange_name"]:
                override_series["orange_name"] = override_teams["orange_name"]
        else:
            self.send_error(404); return
    self._ok()
def do_OPTIONS(self): self._ok()  # CORS preflight
```

CORS `Access-Control-Allow-Origin: *` — OK, bind tylko na 127.0.0.1.
Port zajęty → log warning, brak crashu.

### Wyłączenie zapisów Supabase live
W `db_worker_loop` przy `SUPABASE_LIVE_WRITES = False`:
- Pomiń `db_upsert_match` / `db_upsert_players` / `db_upsert_camera` / `db_prune_players` / `db_clear_all_players`.
- Czyść tylko flagi (`dirty_match`, `dirty_camera`, `clear_requested`), żeby się nie kumulowały.

**`clock_loop`**: przy `SUPABASE_LIVE_WRITES = False` **NIE ustawiaj `dirty_match = True`** po dekrementacji zegara — i tak nic z tego nie poleci do Supabase, a zbędne flippowanie flagi tylko obciąża lock co 0.1 s. Zegar w WS jest budowany ad-hoc z aktualnego `local_time_seconds`, więc kompletnie niezależnie od `dirty_match`. Pozostałe ścieżki (`handle_update_state`, `handle_clock_updated`, `handle_event`) zostawiamy bez zmian — `dirty_match` ma znaczenie wyłącznie dla DB workera.

`_shutdown_flush()` również gated przez `SUPABASE_LIVE_WRITES` (off → no-op).

Gdy ktoś ręcznie ustawi `SUPABASE_LIVE_WRITES = True`, zachowanie wraca do v2.4 (z WS w nowym formacie v3).

### Heartbeat
Nowe pola: `live_writes=on|off`, `http_clients=ok|err`, `ws_full_frames/s`.

### Wątki w `main()`
Dorzucamy:
- `threading.Thread(target=http_server_loop, daemon=True).start()`
- `threading.Thread(target=ws_keepalive_loop, daemon=True).start()`

---

## UI strony /relay

- Tytuł: `Relay Script (Overlay V3)`.
- Dopisać że relay v3 domyślnie nie pisze do bazy (overlay lokalny korzysta z WS), oraz że Dashboard wysyła nadpisy serii/drużyn na `http://127.0.0.1:49301`.
- `pip install supabase requests websockets` zostaje (Supabase wciąż używany przy `SUPABASE_LIVE_WRITES=True`).

---

## Kompatybilność / fallback

- Overlay v3 (po hotfixie) parsuje obie formy: stary `{t, players}` i nowy `{v:3, ...}` — upgrade v2.4 → v3 bez koordynacji.
- WS padnie + `SUPABASE_LIVE_WRITES=False` → overlay ukryje się przez `useOverlayVisibility` (1500 ms WS staleness). To celowe.
- Użytkownik chcący „belt-and-suspenders" ustawia `SUPABASE_LIVE_WRITES = True` ręcznie.

---

## Poza zakresem (już na produkcji)

- `src/lib/relay-http.ts` — `postSeries` / `postTeams` / `syncSessionToRelay` → `http://127.0.0.1:49301`, AbortSignal 1.5 s, silent errors. **Bez zmian.**
- `src/hooks/useBroadcast.tsx` — `useEffect` z `hydratedForIdRef` woła `syncSessionToRelay` raz na załadowaną aktywną sesję; każdy `updateSession` re-syncuje. **Bez zmian.**
- `useLocalRelayFeed`, `useLiveStatsV2`, `useOverlayVisibility` — zaktualizowane w poprzednim PR.
- Brak migracji Supabase.

## Akceptacja

- `python relay.py` startuje, nasłuchuje na `tcp://127.0.0.1:49123`, `ws://127.0.0.1:49300`, `http://127.0.0.1:49301`.
- HB: `live_writes=off`, `ws_full_frames/s ~ 30`, zero requestów Supabase podczas meczu.
- `curl -X POST http://127.0.0.1:49301/teams -d '{"blue_name":"A","orange_name":"B"}' -H 'Content-Type: application/json'` → 200; następna ramka WS ma te nazwy w `teams`.
- `/v2/overlay` (ta sama maszyna) działa bez wpisów w `match_metadata` / `players_live` w Supabase.
- Dashboard `+/-` serii natychmiast widoczny w overlayu (HTTP → WS → `useLiveStatsV2`).
- `clock_loop` przy live_writes=off nie generuje ruchu w state_lock z tytułu `dirty_match`.
