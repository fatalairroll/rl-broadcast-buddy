# Postgame — FAZA 1 (tylko relay)

Implementuję wyłącznie zmiany w `getRelayScript()` w `src/pages/Relay.tsx`. Bez nowych plików TypeScript, bez hooków, bez komponentów Studio, bez zmian w `/v2/overlay`.

## Cel

Po `MatchEnded` (lub `PodiumStart` jako fallback) relay trzyma w pamięci jeden blok `last_postgame`: wynik meczu, pary 1↔1 graczy posortowane po `Player.Score`, twarde statystyki API (G/A/SV/SH/D) oraz sumy drużynowe saves/demos. Pola Fazy 2 są obecne w JSON, ale wypełnione `null`/`0`. Dane wystawione przez:

- `GET http://127.0.0.1:49301/postgame`
- pole `postgame` w ramce WS v3

## Zmiany w `getRelayScript()` (jeden plik)

### 1. Snapshot gracza (`handle_update_state`, ~linia 357)

Do `new_snap[name]` dopisać:

```python
"score": int(p.get("Score", 0) or 0),
```

Live ramka WS w `_build_frame_v3()` nie wystawia `score` — pole wykorzystywane tylko przez accumulator (Faza 2 zdecyduje o eksponowaniu live).

### 2. Globalny stan (obok `players_snapshot`, `override_teams`)

```python
current_accum: Optional["MatchStatsAccumulator"] = None
last_postgame: Optional[Dict[str, Any]] = None
postgame_finalized: bool = False
```

### 3. Klasa `MatchStatsAccumulator` (minimal)

- Pole `players: Dict[str, Dict[str, Any]]` (klucz = `player_name`), wartości: `team_num, score, goals, assists, saves, shots, demos`.
- `reset()` — czyści `players`.
- `on_player_row(row)` — kopiuje pola API (ostatnia wartość wygrywa).
- `finalize(blue_score, orange_score, team_names, match_guid) -> dict`:
  - Sortowanie per `team_num` kluczem `(-score, -goals, -assists, -saves, -shots, -demos, player_name)`, przypisanie `rank=1..N`.
  - Pary do `min(n_blue, n_orange)`; nadmiarowi gracze pomijani z `print("[POSTGAME] WARN: asymetria składów ...")`.
  - Buduje `PostgamePlayer` z polami Fazy 2 zawsze `null`: `pad_pickups`, `supersonic_seconds`, `avg_boost`, `time_at_100_seconds`.
  - `team.{side}.saves/demos` = sumy z `pairs[*].{side}`; `kickoff_goals_10s=0`, `pad_pickups=0`, `avg_boost=null`.
  - Zwraca dokładnie strukturę z sekcji 5 dokumentu Fazy 1: `phase=1`, `match_guid`, `finalized_at` (ISO UTC z `_now_iso()`), `blue_score`, `orange_score`, `team_names`, `team`, `pairs`.

Klasa bez I/O; wywoływana wyłącznie pod `state_lock` z handlerów.

### 4. Cykl życia accumulatora

- `handle_update_state` (po `players_snapshot.update`): jeśli `current_accum is None` → utwórz; dla każdego wiersza wołaj `current_accum.on_player_row(row)`.
- `MatchCreated` / `MatchInitialized` (linia ~511): `current_accum = MatchStatsAccumulator()`, `postgame_finalized = False`. **Nie czyść `last_postgame`** — operator widzi poprzedni mecz aż do nowej finalizacji.
- `MatchEnded` / `PodiumStart` (linia ~532): jeśli `not postgame_finalized and current_accum is not None`:
  1. Pod `override_lock` zbuduj `team_names = {"blue": override_teams.get("blue_name") or "Blue", "orange": override_teams.get("orange_name") or "Orange"}`.
  2. `last_postgame = current_accum.finalize(blue_score, orange_score, team_names, current_match_guid)`.
  3. `postgame_finalized = True`.
  4. `_maybe_broadcast_ws(force=True)`.
- `MatchDestroyed` — bez finalize (zostaw poprzedni `last_postgame`).

### 5. WS v3 (`_build_frame_v3`, linia ~418)

Przekształcić zwracanie dict → zmienna `frame`:

```python
frame = { "v": 3, "t": ..., "match": ..., "players": ..., "camera": ..., "series": ..., "teams": ... }
if last_postgame is not None:
    frame["postgame"] = last_postgame
return json.dumps(frame)
```

Live `match`/`players`/`camera` bez zmian zachowania.

### 6. HTTP `GET /postgame` (`_OverrideHandler`)

Dodać `do_GET`:

- `/postgame` → `200`, `Content-Type: application/json`, body = `json.dumps(last_postgame)` jeśli istnieje, inaczej `{"available": false, "phase": 1}`.
- CORS przez istniejące `_set_cors()` (`Access-Control-Allow-Origin: *`).
- Inne ścieżki → `404`.
- `stats["http_requests_delta"] += 1`, `http_clients_ok = True` przy sukcesie.

`do_OPTIONS` już obsługuje preflight uniwersalnie — bez zmian.

Komunikat startu HTTP zaktualizować do: `[HTTP] ... POST /series, /teams, GET /postgame`.

### 7. Heartbeat

W linii `[HB]` dopisać: `postgame=on|off`, `postgame_phase=1`, `last_match_guid=<8-char skrót lub '-'>`.

### 8. UI strony `/relay`

W bannerze / opisie HTTP w JSX dodać wzmiankę o `GET /postgame` (jedna linia). Tytuł i wersja bez zmian.

## Czego NIE robię

- ❌ `src/types/postgame.ts`, `src/hooks/usePostgameRelay.ts`, komponenty `src/components/studio/Postgame*`.
- ❌ Zmiany w `Studio.tsx`, `StudioRender.tsx`, `OverlayV2.tsx`.
- ❌ `on_goal_scored`, logika padów / boost / supersonic / kickoff 10 s (Faza 2).
- ❌ Zapis postgame do Supabase.
- ❌ Zmiany istniejących ścieżek live (`match`, `players`, `camera`, `series`, `teams`).

## Test akceptacji (operator)

1. `curl http://127.0.0.1:49301/postgame` przed pierwszym meczem → `{"available": false, "phase": 1}`.
2. Po `MatchEnded` (2v2 / 3v3) → JSON z `"phase": 1`; `pairs` posortowane malejąco po `score`; `pairs[k].blue` i `pairs[k].orange` symetryczne.
3. `team.blue.saves` == suma `pairs[*].blue.saves`; analogicznie `demos` i strona orange.
4. Po `MatchCreated` kolejnego meczu `/postgame` nadal zwraca **poprzedni** mecz aż do nowego `MatchEnded`.
5. Ramka WS zawiera klucz `postgame` po finalizacji.
6. `[HB]` pokazuje `postgame=on` po finalizacji.
7. Skrypt pobrany z `/relay` zawiera te same zmiany co repo.
