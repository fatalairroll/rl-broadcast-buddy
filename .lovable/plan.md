# Postgame — Faza 2 (relay + Studio UI)

Wymaga ukończonej Fazy 1 (potwierdzone). Implementacja w dwóch częściach: rozbudowa generatora `getRelayScript()` w `src/pages/Relay.tsx` oraz nowe komponenty Studio.

**Krytyczne ustalenia operatora:**
- Eventy postgame podpinamy **wyłącznie** w `handle_event` (już istniejący dispatcher RL Stats API). **Nie** używamy nazw SOS typu `game:round_started`.
- Drużyna strzelca: `data["Scorer"]["TeamNum"]` (pod `GoalScored`).

---

## Część A — Relay (`src/pages/Relay.tsx` → `getRelayScript()`)

### A.1 Stan globalny (dodać obok istniejących)
- `last_kickoff_at: float = 0.0`
- `last_goal_at: float = 0.0`
- `prev_overtime: bool = False`
- `ot_started_at: float = 0.0`
- `last_tick_at: float = 0.0`

W `MatchStatsAccumulator.players[name]` dodatkowe pola robocze:
`pad_pickups:int=0`, `supersonic_seconds:float=0.0`,
`boost_sum:float=0.0`, `boost_samples:int=0`,
`time_at_100_seconds:float=0.0`, `prev_boost:Optional[int]=None`.

W `MatchStatsAccumulator`: `team_kickoff_goals: Dict[int,int] = {0:0, 1:0}`. Resetowane wraz z obiektem (już tworzony świeży w `MatchCreated`/`MatchInitialized`).

### A.2 `handle_update_state` — metryki per tick
1. W budowie `new_snap[name]` dopisać `"_has_boost": ("Boost" in p)` (flaga lokalna, nie zapisywana do `accum`).
2. Po `players_snapshot.update(new_snap)`:
   - `now = time.time()`; `dt = min(max(now - last_tick_at, 0.0), 0.5) if last_tick_at > 0 else (1/120)`.
   - Wykrycie OT false→true: jeśli `is_overtime and not prev_overtime` → `ot_started_at = now`. Następnie `prev_overtime = is_overtime`.
   - Dla każdego `row` z `new_snap.values()`: `current_accum.on_player_row(row, dt=dt, now=now, match_active=match_active, in_replay=in_replay, last_goal_at=last_goal_at, last_kickoff_at=last_kickoff_at, ot_started_at=ot_started_at)`.
   - `last_tick_at = now`.
3. Dla graczy zniknięcia (w `accum.players` ale nie w `new_snap`): wyzeruj `prev_boost = None`, aby uniknąć fałszywego `delta` po powrocie.

### A.3 `MatchStatsAccumulator.on_player_row(...)` — rozszerzenie
Zachowaj logikę Fazy 1 (kopiowanie G/A/SV/SH/D/score/team_num). Dodatkowo, gdy `match_active and not in_replay`:

- **Boost samples** (gdy `row["_has_boost"]`):
  - `boost = int(row["boost"])`
  - `p["boost_sum"] += boost`; `p["boost_samples"] += 1`
  - jeśli `boost == 100`: `p["time_at_100_seconds"] += dt`
- **Supersonic**: jeśli `row["is_supersonic"]`: `p["supersonic_seconds"] += dt`
- **Pad pickups** (tylko gdy `row["_has_boost"]`):
  - `prev = p["prev_boost"]`
  - jeśli `prev is not None`:
    - `delta = boost - prev`
    - **granty (nie liczyć)**: `32 <= delta <= 34` (respawn), `now - last_goal_at <= 3.0` (post-goal), `now - last_kickoff_at <= 2.0` (kickoff), `now - ot_started_at <= 2.0` (start OT).
    - inaczej jeśli `delta > 0`: `p["pad_pickups"] += 1`.
  - `p["prev_boost"] = boost`

Gdy `not match_active or in_replay`: tylko zaktualizuj `p["prev_boost"] = boost` (jeśli `_has_boost`), bez liczenia metryk.

`_has_boost` nie trafia do `accum.players` (używamy go tylko lokalnie).

### A.4 Nowe handlery zdarzeń w `handle_event` (RL Stats API, **nie** SOS)
W istniejących blokach:

- `RoundStarted` (po `clock_running = True`): `last_kickoff_at = time.time()`.
- `GoalReplayEnd` / `GoalReplayWillEnd` (po `in_replay = False`): `last_kickoff_at = time.time()`.
- `GoalScored` (rozszerzyć istniejący blok):
  ```python
  now = time.time()
  last_goal_at = now
  scorer_team = -1
  try:
      scorer_team = int(_coerce_dict(data.get("Scorer")).get("TeamNum", -1))
  except Exception:
      pass
  if current_accum is not None and scorer_team in (0, 1) \
     and (now - last_kickoff_at) <= 10.0:
      current_accum.team_kickoff_goals[scorer_team] = \
          current_accum.team_kickoff_goals.get(scorer_team, 0) + 1
      print(f"[POSTGAME] kickoff goal team={scorer_team} dt={now-last_kickoff_at:.2f}s")
  ```
- `MatchCreated`/`MatchInitialized`: po istniejącym kodzie ustaw `last_kickoff_at = time.time()`, `last_goal_at = 0.0`, `prev_overtime = False`, `ot_started_at = 0.0`. (`team_kickoff_goals` resetuje się wraz z nowym `MatchStatsAccumulator()`.)

Dodać `last_kickoff_at`, `last_goal_at`, `prev_overtime`, `ot_started_at` do listy `global` w `handle_event`.

### A.5 `MatchStatsAccumulator.finalize()` — wynik `phase: 2`
Per gracz (pole `boost_seen = p["boost_samples"] > 0`):
- `pad_pickups = p["pad_pickups"] if boost_seen else None`
- `supersonic_seconds = round(p["supersonic_seconds"], 1) if boost_seen else None`
- `avg_boost = round(p["boost_sum"]/p["boost_samples"], 1) if boost_seen else None`
- `time_at_100_seconds = round(p["time_at_100_seconds"], 1) if boost_seen else None`

Sumy drużynowe (po stronie `blue`/`orange` mapującej do `team_num` 0/1):
- `kickoff_goals_10s = team_kickoff_goals[side_num]`
- `saves` = suma `pairs[*][side].saves`
- `demos` = suma `pairs[*][side].demos`
- `pad_pickups` = suma `pad_pickups` z pairs (null → 0)
- `avg_boost` = średnia z nie-null `avg_boost` graczy strony; brak → `null`

Sortowanie par bez zmian (po `Player.Score`). `phase = 2`.

### A.6 WS v3 / HTTP / heartbeat
- Bez zmian struktury: `postgame` w ramce + `GET /postgame`.
- Heartbeat: `postgame_phase=2`.

---

## Część B — Frontend Studio

### B.1 `src/types/postgame.ts` (nowy)
```ts
export interface PostgamePlayer {
  player_name: string; team_num: 0 | 1; rank: number;
  score: number; goals: number; assists: number;
  saves: number; shots: number; demos: number;
  pad_pickups: number | null;
  supersonic_seconds: number | null;
  avg_boost: number | null;
  time_at_100_seconds: number | null;
}
export interface PostgameTeamStats {
  kickoff_goals_10s: number; saves: number; demos: number;
  avg_boost: number | null; pad_pickups: number;
}
export interface PostgamePayload {
  phase: 1 | 2; match_guid: string | null; finalized_at: string;
  blue_score: number; orange_score: number;
  team_names: { blue: string; orange: string };
  team: { blue: PostgameTeamStats; orange: PostgameTeamStats };
  pairs: Array<{ rank: number; blue: PostgamePlayer; orange: PostgamePlayer }>;
}
```

### B.2 `src/types/studio.ts`
```ts
export type StudioMode =
  | 'next_3' | 'bracket' | 'recent'
  | 'postgame_players' | 'postgame_summary';
```

### B.3 `src/hooks/usePostgameRelay.ts` (nowy)
- Stan: `{ postgame: PostgamePayload | null, connected: boolean, error: string | null }`.
- `WebSocket('ws://127.0.0.1:49300')`, auto-reconnect co 5 s. Na `message`: parse JSON, jeśli `msg.v === 3 && msg.postgame` → setState. **Nie zerować** na `onclose`.
- Fallback polling `setInterval(2000)` → `fetch('http://127.0.0.1:49301/postgame')`. Gdy odpowiedź zawiera `phase` → setState; `available === false` → ignoruj. `error` ustawiany tylko gdy WS odłączony i fetch też failuje.
- Hydratacja z `sessionStorage['studio_last_postgame']` przy mount; zapis po update z `phase === 2`.

### B.4 `src/pages/Studio.tsx`
Dwie nowe opcje w `Select` trybu:
- `postgame_players` — „Postgame: porównanie graczy”
- `postgame_summary` — „Postgame: podsumowanie meczu”

Helper text gdy wybrany postgame_*: „Wymaga relay na tym samym PC; dane = ostatni zakończony mecz RL.” Ukryć selector `count`.

### B.5 `src/pages/StudioRender.tsx`
- Dodać dwa wpisy do `MODES` (sidebar).
- Wywołać `usePostgameRelay()` (cały czas; tani WS).
- Routing:
  ```tsx
  mode === 'postgame_players' ? <PostgamePlayerCompare data={postgame} state={pgState}/> :
  mode === 'postgame_summary' ? <PostgameTeamSummary data={postgame} state={pgState}/> :
  ```
- Twitch poll button pozostaje ograniczony do `next_3` (już tak jest). Rotacja `queue` nieaktywna dla postgame.

### B.6 `src/components/studio/PostgamePlayerCompare.tsx` (Scena 1)
- Brak danych → „Brak danych — zagraj mecz z relay”.
- Brak WS i brak fetcha → „Relay niedostępny (127.0.0.1:49300)”.
- Dla każdej pary nagłówek `nick blue | Score | Score | nick orange` (Score duży, kolor strony).
- 9 wierszy 3-kolumnowych (`blue | label | orange`); pogrubienie wyższej liczbowej; `—` gdy null.
  Wiersze: Bramki, Asysty, Obrony, Strzały, Demolki, Zebrane pady, Supersonic (`mm:ss`), Średni boost, Czas na 100 boost (`mm:ss`).
- Helper `fmtSeconds(s|null)` → `mm:ss` lub `—`.
- Styl: tło `bg-zinc-900/90`, blue `#2563eb`, orange `#f97316`; spójny z `MatchCard`.

### B.7 `src/components/studio/PostgameTeamSummary.tsx` (Scena 2)
Layout RLCS:
- Lewy/prawy slup z pionową nazwą drużyny + dużym wynikiem (`blue_score` / `orange_score`).
- 5 pasków proporcjonalnych: label + dwie wartości + segment blue width `b/(b+o)` (suma 0 → 50/50; oba null → `—`):
  Gole ≤10 s od kickoffa, Obrony, Demolki, Średni boost, Zebrane pady.
- Brak danych / błąd jak Scena 1.

### B.8 Zakaz
Bez zmian w `OverlayV2`, `/v2/overlay`, Supabase postgame, MMRivals zapis. Nie modyfikujemy istniejących ścieżek live.

---

## Część C — Definition of Done
1. `GET /postgame` po meczu (spectator + 120 Hz) → `phase: 2`, wypełnione `pad_pickups`/`avg_boost`/`supersonic_seconds`/`time_at_100_seconds`.
2. Bez spectator (brak pola `Boost`): w/w pola `null`; Score i G/A/SV/SH/D poprawne.
3. Gol ≤10 s po `RoundStarted`/`GoalReplayEnd` zwiększa `team.{side}.kickoff_goals_10s` po stronie `Scorer.TeamNum`.
4. Ranking par w `pairs` zgodny z tablicą RL (`Player.Score`).
5. `/studio/render?mode=postgame_players&key=...` pokazuje N par (1 w 2v2, 3 w 3v3).
6. `/studio/render?mode=postgame_summary&key=...` pokazuje 5 pasków + wyniki.
7. Po `MatchCreated` nowego meczu poprzedni postgame nadal widoczny do nowego `MatchEnded`.
8. `team.blue.saves` = suma obron graczy blue ze Sceny 1.
9. OBS: tło transparentne, sidebar ukryty przez `?obs=1`.

---

## Poza scope
GoalSpeed, najszybszy strzał, mały vs duży pad, jednostki zebranego/zużytego boosta, historia meczów, zapis do Supabase/Rankclash, auto-switch scen OBS.
