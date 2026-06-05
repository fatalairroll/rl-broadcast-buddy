## Zakres
Tylko `src/pages/Relay.tsx` → `getRelayScript()`. Bez zmian UI, Studio, `/v2/overlay`, Supabase.

## Zmiany w `MatchStatsAccumulator`
- Wydzielić `on_boost_tick(player_name, team_num, boost, is_supersonic, dt)`:
  - boost/supersonic/time_at_100 liczone tylko tu,
  - heurystyka padów (respawn 32–34, post-goal ≤3 s, kickoff ≤2 s, OT ≤2 s, inaczej delta>0 → +1) tylko tu,
  - `prev_boost` aktualizowane tylko tu.
- `on_player_row(row)` zostawia wyłącznie kopię Fazy 1 (team_num, score, G/A/SV/SH/D) — **usunięta** cała logika padów/boost/supersonic.
- `reset_prev_boost(name)` zachowane; wołane dla graczy, którzy zniknęli ze snapu.
- Nowe timery globalne dostępne dla `on_boost_tick`: `last_kickoff_at`, `last_goal_at`, `ot_started_at` (jako argumenty wywołania, jak dotąd).

## Integracja w `handle_update_state`
- `dt = min(max(now - last_tick_at, 0.0), 0.5)` jeśli `last_tick_at > 0`, inaczej `1/120` (bez zmian).
- Dla każdego gracza w snapie:
  1. `current_accum.on_player_row(row)` (Faza 1, zawsze).
  2. Jeśli `row["_has_boost"] and match_active and not in_replay` → `on_boost_tick(...)` z `dt`, `now`, `last_goal_at`, `last_kickoff_at`, `ot_started_at`.
  3. Jeśli `_has_boost`, ale poza aktywnym meczem / w replayu → tylko ustawić baseline `prev_boost = boost` (żeby pierwszy delta po wznowieniu nie eksplodował).
- Po pętli: dla graczy znikłych ze snapu — `reset_prev_boost`.
- `last_tick_at = now_ts`.
- Bez `Boost` w packecie: nic nie liczymy (brak spectatora → `null` w finalize).

## Event hooki (RL Stats API, nie SOS)
- `RoundStarted`: `last_kickoff_at = time.time()` (bez zmian).
- `GoalReplayEnd` / `GoalReplayWillEnd`: `in_replay=False`, `last_kickoff_at = time.time()` (bez zmian).
- `GoalScored`: `last_goal_at = now`; scorer z `data["Scorer"]["TeamNum"]`; jeśli `now - last_kickoff_at <= 10` → `team_kickoff_goals[scorer_team] += 1` (bez zmian).
- `MatchCreated` / `MatchInitialized`: nowy `MatchStatsAccumulator`, reset timerów, **`last_postgame` nietknięty** (bez zmian).
- `MatchEnded` / `PodiumStart`: finalizacja raz (`postgame_finalized`) — **bez regresji**, broadcast WS po finalizacji.
- `MatchDestroyed`: nie finalizuje, zostawia poprzedni `last_postgame` (bez zmian).

## `finalize()`
- `"phase": 2` zawsze.
- Per gracz: `boost_seen = boost_samples > 0`; gdy brak → `pad_pickups/avg_boost/supersonic_seconds/time_at_100_seconds = null`.
- Per drużyna: `kickoff_goals_10s`, `saves`, `demos` (sumy z par), `pad_pickups` (suma, null traktowane jako 0), `avg_boost` (średnia z nie-null lub `null`).
- Ranking par: `(-score, -goals, -assists, -saves, -shots, -demos, player_name)` — bez zmian.

## Heartbeat
- `[HB] ... | postgame_available=True|False postgame_phase=<n|->` — czytane z faktycznego `last_postgame`, nie hardcoded.

## Strona `/relay`
- Komunikat „GET /postgame — Faza 1” zaktualizować na „Faza 2 (kickoff goals + boost / supersonic / pady)”.
- Przycisk „Pobierz relay.py” już bierze świeży `getRelayScript()` — bez zmian.

## Weryfikacja po wdrożeniu
1. Statyczna: `rg '"phase"' src/pages/Relay.tsx` → tylko `phase: 2`.
2. Build sandbox: kompilacja przechodzi.
3. Runtime (operator):
   - `curl http://127.0.0.1:49301/postgame` przed meczem → `{available:false, phase:2}`.
   - Po meczu ze spectatorem → `phase:2`, `pairs[*].blue/orange.pad_pickups` ≥ 0, `avg_boost`/`supersonic_seconds`/`time_at_100_seconds` liczbowe, `team.{side}.avg_boost` liczbowe.
   - Bez spectatora → te same pola `null`, Score / G/A/SV/SH/D nadal poprawne.
4. Operator musi pobrać świeży `relay.py` z `/relay` i zrestartować skrypt; stary lokalny plik nadal zwróci `phase:1`.