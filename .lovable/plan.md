## Diagnoza problemu

Obecny `relay.py` (generowany w `src/pages/Relay.tsx`) ma trzy fundamentalne błędy względem oficjalnej specyfikacji RL Stats API:

1. **Zły transport** — używa surowego TCP `socket` z parsowaniem newline-delimited JSON, podczas gdy API to **WebSocket**. Skrypt nigdy nie odbierze poprawnie żadnego eventu, w żadnym trybie gry.
2. **Zły parser pól** — szuka `p.bIsTarget`, `p.Demolishes`, `data.Players` w środku eventu `UpdateState`. Faktyczna struktura to `Data.Players[]`, `Data.Game.Target` i `Data.Game.bHasTarget`.
3. **Niepotrzebny dummy mode** — w replayach z historii i meczach z botami API normalnie wysyła `Players[]` z prawdziwymi danymi (boty mają normalne nazwy). Tryb testowy ukrywa fakt, że relay nie odbiera niczego, i wprowadza w błąd.

To dlatego oglądasz prawdziwy replay, a widzisz BLUE BOT 1/ORANGE BOT 2 z sinusoidalnym boostem.

## Cel

Przepisać `relay.py` tak, by w pełni działał z oficjalnym API RL Stats (WebSocket port 49123), z poprawnym parsowaniem zgodnym z dokumentacją, w trzech scenariuszach:

- mecz competitive online (live)
- mecz z botami / custom offline (jako gracz lub spectator)
- replay z Match History

## Architektura nowego relay.py

### Transport
- Biblioteka: `websocket-client` (synchroniczny klient — prostszy niż `websockets` async).
- URL: `ws://127.0.0.1:49123`.
- `pip install websocket-client supabase requests`.
- Pętla `run_forever` z auto-reconnect co 3s przy zerwaniu.

### Parser eventów (zgodny z oficjalną dokumentacją)

| Event | Akcja w relay |
|---|---|
| `UpdateState` | Główny tick — patrz niżej |
| `ClockUpdatedSeconds` | Snap timera: `time_seconds = Data.TimeSeconds`, `is_overtime = Data.bOvertime` |
| `GoalScored` | Wynik aktualizuje się i tak przez `UpdateState`; logujemy info o golu |
| `GoalReplayStart` | `clock_running = false` (zamrożenie zegara na powtórce gola) |
| `GoalReplayEnd` / `GoalReplayWillEnd` | `clock_running = true` (lokalny tick znów leci do następnego snap) |
| `RoundStarted` | `clock_running = true` |
| `CountdownBegin` | `clock_running = false` (przed kickoffem) |
| `MatchCreated` / `MatchInitialized` | reset state, zapisz `match_guid` |
| `MatchEnded` / `MatchDestroyed` / `PodiumStart` | `clock_running = false` |
| `MatchPaused` | `clock_running = false` |
| `MatchUnpaused` | `clock_running = true` |
| `ReplayCreated` | log "tryb replay z historii meczów" — żadnej specjalnej logiki, dane lecą normalnie przez `UpdateState` |
| `BallHit` / `CrossbarHit` / `StatfeedEvent` | ignorowane na razie (do przyszłych funkcji) |

### `UpdateState` — pełny mapping pól

Z `Data`:
- `Data.MatchGuid` → `current_match_guid`
- `Data.Players[]` → upsert `players_live`
- `Data.Game.Teams[0].Score` → `blue_score`
- `Data.Game.Teams[1].Score` → `orange_score`
- `Data.Game.TimeSeconds` → snap `local_time_seconds` (najwyższy priorytet)
- `Data.Game.bOvertime` → `is_overtime`
- `Data.Game.bReplay` → flaga zamrożenia zegara (dotyczy zarówno goal replay jak history replay)
- `Data.Game.bHasTarget` + `Data.Game.Target.Name` → `active_camera.target_name`

Per gracz w `Players[]`:
```python
{
  "player_name": p["Name"],
  "team_num": p["TeamNum"],            # 0 / 1
  "boost":   int(p.get("Boost", 0)),    # SPECTATOR-only, default 0
  "speed":   float(p.get("Speed", 0)),  # SPECTATOR-only
  "goals":   p.get("Goals", 0),
  "assists": p.get("Assists", 0),
  "saves":   p.get("Saves", 0),
  "shots":   p.get("Shots", 0),
  "demos":   p.get("Demos", 0),
  "is_demolished": bool(p.get("bDemolished", False)),
  "is_supersonic": bool(p.get("bSupersonic", False)),
}
```

### Logika zegara (priorytet źródeł)
1. `UpdateState.Game.TimeSeconds` lub `ClockUpdatedSeconds.TimeSeconds` → twardy snap.
2. Lokalny tick co 100 ms gdy `clock_running == true` i nie jesteśmy w `bReplay`.
   - W trybie normalnym: `local_time -= 0.1`.
   - W OT (`is_overtime == true`): `local_time += 0.1`.
3. **Watchdog**: jeśli przez >0.5 s nie przyszedł żaden update z gry → `clock_running = false` (obsługuje pauzę replaya, alt-tab, minimalizację).

### Co usuwamy
- Cały `dummy_loop` i `DUMMY_PLAYERS` — niepotrzebne, mylące.
- `DUMMY_TIMEOUT_S`, flagę `dummy_mode`.
- Parsowanie `\n` z bufora bajtów.
- Fallback `p.bIsTarget`.

### Co zostaje
- Throttling zapisów (`WRITE_INTERVAL_S = 0.25`).
- Heartbeat co 5 s z licznikami zdarzeń i zapisów do DB.
- Konfiguracja `SUPABASE_URL` / `SUPABASE_ANON_KEY` wstrzykiwana do template stringa.

### Logi diagnostyczne
- Na starcie: jasna informacja o trybie (live / replay / podium) na podstawie pierwszego `MatchInitialized` / `ReplayCreated`.
- Heartbeat pokazuje: `events=+N | players_seen=N | match=+N players=+N camera=+N`.
- Gdy `events == 0` przez >10 s: ostrzeżenie "Brak danych z RL — sprawdź czy DefaultStatsAPI.ini jest ustawiony i restart RL".

## Zmiany w UI strony /relay

`src/pages/Relay.tsx`:
- Sekcja "Wymagania" — bez zmian (Python 3.10+, RL z aktywnym Stats API).
- Sekcja "Wlacz Stats API" — bez zmian (`DefaultStatsAPI.ini`, port 49123).
- Sekcja "3. Uruchomienie" — zaktualizować `pip install` na `websocket-client supabase requests`.
- Usunąć niebieski baner "Tryb testowy dla botów" — zastąpić informacją: "Działa w meczach online, replayach z Match History i meczach z botami. Boost/speed widoczny tylko jako spectator lub na własnej drużynie (ograniczenie API)."

## Pliki do zmiany

- `src/pages/Relay.tsx` — pełna podmiana template stringa `getRelayScript` + jedna sekcja UI.

## Co użytkownik robi po wdrożeniu

1. Wejść na /relay → Pobierz `relay.py`.
2. `pip install websocket-client supabase requests` (jednorazowo).
3. Restart Rocket League (raz, jeśli zmieniał `DefaultStatsAPI.ini`).
4. Odpalić replay → uruchomić `python relay.py` → overlay pokazuje prawdziwych graczy z replaya.

Brak zmian w bazie, brak zmian w `OverlayV2` / `useLiveStatsV2`.
