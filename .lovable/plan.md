
# Naprawa: overlay chowa się wyłącznie po evencie końca meczu

## Założenia (zaktualizowane)

- Brak watchdoga / timeoutu bezczynności. Cisza w pakietach ≠ koniec meczu.
- Źródłem prawdy są **wyłącznie** eventy z RL Stats API.
- Fail-safe staleness w overlayu (30 s) zostaje jako zabezpieczenie na utratę bota, ale relay nie używa żadnego timeoutu do flagowania `is_active`.

## Zmiany w `relay.py` (osadzony w `src/pages/Relay.tsx`)

1. **Stan**: dodaję flagę `match_active: bool` (start: `False`).

2. **Mapowanie eventów → `match_active`** (jedyne miejsca, które ją zmieniają):
   - `MatchCreated` / `MatchInitialized` → `match_active = True`, `dirty_match = True`
   - `MatchEnded` / `MatchDestroyed` → `match_active = False`, `dirty_match = True`
   - `PodiumStart`, pauzy, replaye, gole — **nie ruszają** `match_active` (tylko ewentualnie `clock_running`).

3. **`db_upsert_match`** zawsze dokleja `"is_active": match_active` do payloadu, więc każdy zapis workera DB odzwierciedla bieżący stan.

4. **Usuwam watchdoga**:
   - kasuję stałą `WATCHDOG_TIMEOUT_S` i wszystkie odwołania,
   - w `clock_loop` znika gałąź zatrzymująca zegar po braku `UpdateState`,
   - `last_state_update_at` zostaje tylko jeśli jest używany do czegoś innego (np. heartbeat info); w przeciwnym razie usuwam też jego.

5. **Graceful shutdown** (jedyne dodatkowe źródło `is_active=false` poza eventami):
   - rejestracja `signal.SIGINT` i `signal.SIGTERM` + `atexit`,
   - handler ustawia globalny `shutting_down = True`, wymusza ostatni synchroniczny upsert `match_metadata` z `is_active=false` (timeout 2 s, best-effort, błąd logowany ale ignorowany), po czym proces kończy się normalnie,
   - jeśli zapis się nie powiedzie, fail-safe staleness 30 s w overlayu i tak go schowa.

6. **UI `/relay`**: jedno zdanie w sekcji „Aktualizacja", że overlay znika dokładnie w momencie `MatchEnded`/`MatchDestroyed` lub po czystym zamknięciu bota.

## Czego nie zmieniam

- `useOverlayVisibility` — działa poprawnie (5 s debounce hide + 30 s staleness fail-safe).
- Schemat bazy.
- Architektura producent/konsument z poprzedniego kroku.

## Efekt

- `MatchEnded` / `MatchDestroyed` w grze → worker w ≤250 ms pisze `is_active=false` → overlay znika po 5 s debounce.
- Cisza pakietów w trakcie meczu (lag, krótka pauza renderowania) → `is_active` zostaje `true`, overlay stoi.
- `Ctrl+C` / kill bota → shutdown hook wysyła `is_active=false`; w razie awarii zapisu zadziała staleness 30 s.

Po zatwierdzeniu wdrażam.
