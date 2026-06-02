## Cel

Zniwelować opóźnienie boost barów na `/v2/overlay` z ~25 ms relay tick + latencji Supabase Realtime (~100–400 ms) do ~50–150 ms, przez dorzucenie lokalnego strumienia WebSocket prosto z `relay.py` do przeglądarki. Supabase pozostaje pełnoprawnym źródłem prawdy dla wszystkiego (score, timer, kamera, statystyki, registry); WS to **tylko nakładka na boost/speed/supersonic**, używana automatycznie gdy dostępna.

## Zmiany

### 1. `src/pages/Relay.tsx` → `getRelayScript()` (skrypt `relay.py` v2.4)

Dodać lokalny serwer WebSocket równolegle do istniejących zapisów do Supabase (nic nie usuwamy).

**Konfiguracja:**
- `WS_HOST = "127.0.0.1"`, `WS_PORT = 49300`.
- `WS_MAX_BROADCASTS_PER_S = 60` (throttle).
- `WS_BROADCAST_MIN_INTERVAL_S = 1 / WS_MAX_BROADCASTS_PER_S`.

**Zależności:**
- `try: import websockets, asyncio` z czytelnym komunikatem `pip install websockets` w razie braku. Import opóźniony do funkcji startującej wątek, żeby brak pakietu nie ubił całego relaya (ostrzeżenie w logu, dalsza praca w trybie Supabase-only).

**Wątek `ws_server_loop` (daemon):**
- Tworzy własną `asyncio` event loop, `loop.run_until_complete(websockets.serve(handler, WS_HOST, WS_PORT))`.
- `handler(ws)`: dodaje `ws` do `ws_clients: set`, czeka na rozłączenie, usuwa z setu. Loguje connect/disconnect (1 linia).
- Wystawia globalne `ws_loop` (asyncio loop) do thread-safe schedulingu.

**Broadcast (w `handle_update_state`, po zbudowaniu `new_snap` pod lockiem):**
- Pod lockiem zbudować minimalny snapshot do WS:  
  `ws_payload_players = [{"player_name": n, "boost": r["boost"], "speed": r["speed"], "is_supersonic": r["is_supersonic"]} for n,r in players_snapshot.items()]`.
- Poza lockiem, throttle:
  - `now = time.time()`; jeżeli `now - last_ws_send_ts < WS_BROADCAST_MIN_INTERVAL_S` → pomiń.
  - Skip-if-no-change: porównać `(player_name, boost, speed, is_supersonic)` z `last_ws_players` (dict). Jeśli identyczne → pomiń.
- Jeżeli są klienci i loop działa:
  - `msg = json.dumps({"t": now, "players": ws_payload_players})`.
  - Dla każdego `ws` w kopii `ws_clients`: `asyncio.run_coroutine_threadsafe(ws.send(msg), ws_loop)` w try/except (usuwać martwych klientów).
- Zaktualizować `last_ws_send_ts`, `last_ws_players`, `stats["ws_sends_delta"] += 1`.

**Heartbeat:**
- Dorzucić `ws_clients=<N> ws_sends/s=<X>` do linii `[HB]`.

**Co zostaje bez zmian:**
- TCP recv loop, parsowanie, batch upsert graczy do Supabase, `match_metadata`, `active_camera`, prune. `WRITE_INTERVAL_S = 0.025` bez zmian. `MAX_PLAYER_ROWS_PER_S` bez zmian.

**Tekst w UI `/relay`:**
- Dopisać do sekcji z instalacją: `pip install supabase requests websockets`.
- Krótka nota: „Skrypt udostępnia lokalny WebSocket `ws://127.0.0.1:49300` dla overlaya na tej samej maszynie (boost w czasie rzeczywistym). Tylko localhost — żadnych zmian w firewallu nie potrzeba. Overlay na innym PC działa nadal, tylko bez przyspieszenia (Supabase fallback)."

### 2. `src/hooks/useLocalBoostFeed.ts` (nowy)

Mały hook z auto-reconnect.

- Wejście: brak parametrów. Stałe wewnątrz: `WS_URL = "ws://127.0.0.1:49300"`, `STALE_MS = 500`, backoff `1s → 2s → 5s → 10s → 10s…`.
- Stan zewnętrzny: zwraca obiekt z **stabilną referencją**:
  - `getBoost(name: string): { boost: number; speed: number; is_supersonic: boolean; ageMs: number } | null` — czyta z `ref` (Map), bez re-renderów.
  - `connected: boolean` (state, do debug).
  - `lastMessageAt: number | null` (ref-backed, eksponowane przez `getLastMessageAge()`).
- Logika:
  - `useEffect` jednorazowy; trzyma `wsRef`, `mapRef = useRef(new Map<string, {boost,speed,is_supersonic,t:number}>())`, `lastMsgRef`.
  - On `message`: parse, dla każdego gracza wpis do mapy `{...fields, t: performance.now()}`, ustaw `lastMsgRef.current = performance.now()`.
  - On `close`/`error`: czyść mapę po `STALE_MS`, schedule reconnect z backoffem.
  - Cleanup zamyka socket i czyści timer.
- **Brak setState na każdą wiadomość** — overlay sam re-renderuje się na sygnałach Supabase Realtime (postgres_changes na `players_live` 30-40 Hz), a `getBoost()` jest czytane synchronnie w trakcie renderu z aktualnego refa. Dzięki temu na overlayu nie tworzymy 60 Hz re-renderów Reacta.
  - Uwaga: re-render z Realtime jest częsty (40 Hz przy aktywnym boost), więc wartość WS i tak będzie pobierana świeżo. Boost bar już ma własny RAF easing, więc jitter między renderami się wygładzi.

### 3. `src/hooks/useLiveStatsV2.ts` — merge WS w boost/speed/is_supersonic

- Wywołać `useLocalBoostFeed()`.
- Tuż przed zwróceniem (`fresh`/`blue`/`orange`/`activePlayer`) dorobić warstwę:
  ```ts
  const enrichWs = (p: PlayerLive): PlayerLive => {
    const wsRow = ws.getBoost(p.player_name);
    if (!wsRow) return p;
    if (wsRow.ageMs > 500) return p;
    return { ...p, boost: wsRow.boost, speed: wsRow.speed, is_supersonic: wsRow.is_supersonic };
  };
  ```
- Zastosować do `fresh` przed pochodnymi `blue`/`orange` (`useMemo` zostaje, dependency dodać `ws` — stabilna ref).
- `activePlayer` policzyć z `players` po enrichu (zmienić źródło `find` z surowego `players` na zenrichowane).
- **NIE** merge'ujemy nigdzie indziej: bramki/asysty/save/shots/demos/is_demolished/mmr/updated_at zostają z Supabase. Score/timer/camera bez zmian.

### 4. Debug (opt-in, `?debug=1`)

W `useLiveStatsV2`, w istniejącym bloku debug intervalu (`live-stats`), dodać log: `ws connected=<bool> lastMsgAge=<ms>` co 2 s.

### 5. Bez zmian

- `BoostBarV2`, `PlayerCardV2`, layout, RLS, edge functions, route, query params, `useBroadcast`, `useMmrivalsBracket`, rangi, OBS scaling.
- Żadnego przełącznika trybu w UI. Wszystko hybrydowe „samo się włącza".

## Kompatybilność i tryby pracy

- **Overlay na tym samym PC co RL/relay:** WS łączy się, boost = WS (świeżość < 500 ms), reszta = Supabase.
- **Overlay na innej maszynie (OBS remote):** WS pada (`ECONNREFUSED`), hook trzyma się w `connected=false`, `getBoost` zwraca `null`, overlay leci na Supabase — czyli identycznie jak dziś.
- **Stara wersja `relay.py` (brak WS):** to samo co wyżej — fallback Supabase, zero błędów w UI.
- **`websockets` niezainstalowane:** relay loguje ostrzeżenie i jedzie dalej w trybie Supabase-only.

## Kryteria akceptacji

- Ten sam `relay.py` (jedna instalacja, jeden proces). Po `pip install websockets` overlay na tej samej maszynie pokazuje zmiany boosta z opóźnieniem ~50–150 ms (od zmiany w grze do zmiany w pasku).
- Score, timer, kamera i statystyki nadal aktualizują się przez Supabase, bez regresji.
- Overlay na zdalnej maszynie OBS działa bez błędów konsoli, używa wyłącznie Supabase (degradacja zgodnie z założeniem).
- `[HB]` w terminalu pokazuje `ws_clients` i `ws_sends/s` gdy overlay jest podłączony.

## Plik po pliku

- `src/pages/Relay.tsx` — rozszerzenie `getRelayScript()` do v2.4 (WS server + broadcast + throttle) + nota o `pip install websockets` i localhost.
- `src/hooks/useLocalBoostFeed.ts` — **nowy** hook (WS client z reconnect + ref-based map).
- `src/hooks/useLiveStatsV2.ts` — merge WS w `fresh`/`activePlayer`, debug log.
