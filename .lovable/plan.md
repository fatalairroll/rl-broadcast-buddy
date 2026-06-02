## Cel

Wyeliminować skokowe paski boostu na `/v2/overlay`. Przyczyna: relay (v2.2) flushuje **1 gracza na tick db_workera** (round-robin po `dirty_player_names`), więc przy 4 graczach każdy gracz dostaje aktualizację co ~100 ms (≈10/s razem), a w praktyce HB pokazuje ~6 wierszy/s. Bar w UI dostaje dane „skokowo" i ease ich nie ratuje, bo źródło jest rzadkie.

## Zmiany

### 1. `src/pages/Relay.tsx` → `getRelayScript()` (skrypt Python `relay.py`)

Podbić nagłówek do **v2.3** i zrefaktorować flush graczy z round-robin na batch.

**Stan:**
- Usunąć całkowicie `dirty_player_names: List[str]` oraz całą logikę FIFO/gating po nazwie.
- Zostawić `players_snapshot` i `last_pushed_players` (do change-detection per-row).

**`handle_update_state` (gracze, ~linia 307–317):**
- Po przebudowie `new_snap` nie dotykać żadnej kolejki.
- `stats["player_changes_delta"]` liczyć jako liczbę graczy, których `row != last_pushed_players.get(name)` (tylko do HB; sama detekcja i tak idzie w workerze).

**`db_worker_loop` (~linia 440–507):**
- Pod lockiem zrobić shallow-copy snapshotu (`snap_copy = {n: dict(r) for n,r in players_snapshot.items()}`), zwolnić lock.
- Poza lockiem zbudować `rows_to_push = [r for n, r in snap_copy.items() if last_pushed_players.get(n) != r]`.
- Jeden `db_upsert_players(rows_to_push)` per tick (już istnieje, przyjmuje listę).
- Po sukcesie: `for n, r in zip(...): last_pushed_players[n] = r`.
- **Opcjonalny safety cap** (stała `MAX_PLAYER_ROWS_PER_S = 200`): jeżeli liczba wierszy w bieżącej sekundzie przekracza limit, ten tick pominąć (zliczyć w `stats["player_writes_skipped_delta"]`). Liczyć w prostym oknie sekundowym, bez dodatkowych wątków.

**Tempo flushu:**
- `WRITE_INTERVAL_S` zostawić **0.025 s** (40 Hz) — przy 4 graczach to do 160 wierszy/s, mieści się w cap. Komentarz przy stałej zaktualizować: „batch upsert wszystkich zmienionych graczy".

**Heartbeat (`heartbeat_loop`):**
- Dodać metrykę `player_rows/s` (już jest `player_writes_delta / HEARTBEAT_S` — przemianować w logu na `player_rows/s`).
- Dodać `flushes/s = ticks_with_rows_delta / HEARTBEAT_S` (nowa zmienna w `stats`, inkrementowana w workerze gdy `rows_to_push` niepusta).
- Jeżeli cap został użyty, dopisać `skipped/s`.

**Kompatybilność:** żadnych zmian w schemacie bazy, w eventach RL, w kamerze ani w `match_metadata`. Wątek TCP pozostaje DB-free.

### 2. `src/components/v2/BoostBarV2.tsx`

Tylko tuning easingu — bez zmiany logiki źródła danych.

- Zwiększyć tempo zjazdu, zostawić łagodny wzrost. Zamiast obecnych `rate = diff > 0 ? 320 : 260`:
  - `rate = diff > 0 ? 280 : 900` (%/s) → drain 100→0 w ~110 ms, wzrost lekko wygładzony.
- Próg snapowania bez zmian (`Math.abs(diff) > 0.2`).
- Zostawić komentarz wyjaśniający: dane z bota wpadają teraz „gęsto" (~40 Hz dla każdego), więc ease ma tylko maskować jitter sieci.

### 3. (Opcjonalnie) wspólny hook `useSmoothBoost`

Wydzielić raf-easing z `BoostBarV2` do `src/hooks/useSmoothBoost.ts` (input: `target: number, opts?: { upRate?: number; downRate?: number }`, output: `smooth: number`). Podpiąć w `BoostBarV2` oraz w `PlayerCardV2` (`BoostStat` używa surowego `player.boost` — przepuścić przez hook). Bez zmian wizualnych poza płynnością.

## Czego NIE zmieniamy

- Nie ruszamy rang / `useActivePlayerMmrInfo` / `PlayerCardV2` poza wartością boost przekazywaną do `BoostStat`.
- Bez zmian w `useLiveStatsV2`, RLS, edge functions, OBS layoutu.
- Bez zmian w `WRITE_INTERVAL_S` jako parametrze konfiguracyjnym przez UI.

## Kryteria akceptacji

- `[HB]` w terminalu pokazuje `player_rows/s` znacznie powyżej 10 przy 4 graczach trzymających boost (oczekiwane ~30–120/s zależnie od aktywności).
- Na `/v2/overlay` zjazd boosta 100→0 w ciągu ~2 s wygląda płynnie, bez schodków.
- `UpdateState/s` w HB pozostaje na ~100–120 (bez regresji upstreamu).
- Brak zmian w wyświetlaniu rang.

## Plik po pliku

- `src/pages/Relay.tsx` — refaktor `getRelayScript()` (v2.3) + opis w UI sekcji „Wazna aktualizacja".
- `src/components/v2/BoostBarV2.tsx` — tuning `rate`.
- *(opcjonalnie)* `src/hooks/useSmoothBoost.ts` — nowy hook + użycie w `BoostBarV2.tsx` i `PlayerCardV2.tsx`.
