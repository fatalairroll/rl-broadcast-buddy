
# Panel zarządzania overlayem + integracja MMRivals

## Co dodajemy

Pod podglądem live w `/creator` (widoczne tylko gdy `previewMode === 'live'`) pojawi się panel kontrolny z dwiema sekcjami:

1. **Sterowanie meczem** — szybkie akcje na aktywnej `broadcast_session`
2. **MMRivals** — wybór turnieju → rundy → meczu, automatyczne wczytanie drużyn i parowanie graczy

## 1. Panel sterowania meczem

Pod ramką podglądu w `Creator.tsx` (sekcja `<main>`) renderujemy nowy komponent `BroadcastControlsPanel` (tylko w trybie live). Korzysta z `useBroadcast()`.

Zawartość:

- **Nazwy drużyn** — dwa inputy (Team A / Team B), zapis do `team_a_name` / `team_b_name`
- **Wynik serii** — przyciski `+/-` dla obu stron (już są w `useBroadcast`)
- **Reset wyniku serii** — nowy przycisk: ustawia oba `*_series_score` na 0
- **Format serii (BO)** — Select BO1/BO3/BO5/BO7 (`series_type`)
- **Zamiana stron** — przycisk reużywający logiki `handleSwapTeams` z `MatchControls.tsx` (przeniesiona do `useBroadcast` jako `swapTeams()`)
- **Wyczyść dane ręczne** — przycisk z confirm: zeruje `team_a_name`, `team_b_name`, `team_a_logo`, `team_b_logo`, `team_a_series_score`, `team_b_series_score`, kasuje też powiązanie z MMRivals (patrz niżej)

Wszystkie akcje wysyłają realtime broadcast jak istniejące `MatchControls` żeby overlay od razu widział zmianę.

## 2. Integracja MMRivals

### Schemat DB (migracja)

Dodajemy kolumny do `broadcast_sessions`:

- `mmr_tournament_id text` — wybrany turniej
- `mmr_match_id text` — wybrany mecz
- `mmr_team_a_id text`, `mmr_team_b_id text` — id drużyn z MMRivals (do późniejszego pobrania składów)
- `player_pairings jsonb default '{}'` — mapa `{ "player_name_z_gry": "discord_id_z_mmrivals" }`

Brak FK — to są zewnętrzne ID z innego Supabase.

### UI w panelu (sekcja MMRivals)

Trzy `Select`-y kaskadowo:

1. **Turniej** — lista z `fetchTournaments()` (już istnieje w `lib/mmrivals-api.ts`). Po wyborze zapis do `mmr_tournament_id`.
2. **Runda** — po wybraniu turnieju ładujemy `fetchMatches(tournamentId, 'bracket')` i grupujemy po `round_index`. Etykieta: "Runda 1", "Runda 2", itd.
3. **Mecz** — lista meczów w wybranej rundzie. Etykieta: `${team_a.name} vs ${team_b.name}` z dopiskiem nicków kapitanów (pierwszy gracz każdej drużyny: `nick_in_game ?? nick`).

Po wyborze meczu:

- Zapisujemy `mmr_match_id`, `mmr_team_a_id`, `mmr_team_b_id`
- Auto-wpisujemy `team_a_name` / `team_b_name` na nazwy drużyn z MMRivals (admin może dalej edytować ręcznie — pole inputu pozostaje aktywne)
- Uruchamiamy auto-parowanie graczy (poniżej)

Przycisk **"Odepnij mecz MMRivals"** czyści `mmr_*` kolumny i `player_pairings`.

### Parowanie graczy (`nick_in_game` ↔ `players_live.player_name`)

Nowy hook `useMmrivalsMatchData(matchId)`:
- Pobiera szczegóły wybranego meczu (drużyny + gracze z `nick_in_game`, `mmr_*`, `rank_*`, `discord_id`)
- 30s cache, ręczne odświeżenie

Algorytm autoparowania (po wyborze meczu i przy zmianie `players_live`):

1. Dla każdego `player.player_name` z `players_live` szukamy w drużynach MMRivals:
   - **Exact match** (case-insensitive, trim) na `nick_in_game`
   - Jeśli brak: **fuzzy** — Levenshtein <=2 lub jeden zawiera drugiego (substring), też case-insensitive
2. Wynik zapisujemy do `player_pairings` jako `{ player_name: discord_id }`
3. Brak dopasowania → brak wpisu (gracz pozostaje "niesparowany")

Sekcja UI **"Parowanie graczy"** (rozwijana lista, tylko gdy mecz MMRivals wczytany):

```
[ Player z gry ]   →   [ Select: lista graczy z 2 drużyn MMRivals + "(brak)" ]   ✓ auto / ⚠ ręcznie / ✗ brak
```

Przycisk **"Sparuj automatycznie"** — uruchamia algorytm ponownie (np. po dołączeniu się gracza do gry).

### Wyświetlanie MMR/rangi w karcie aktywnego gracza

Tworzymy nowy hook `useActivePlayerMmrInfo()`:
- Czyta `activeCameraTarget` z `useLiveStatsV2`
- Czyta `player_pairings` + dane MMRivals z aktywnej sesji
- Zwraca `{ mmr, rank }` jeśli gracz jest sparowany; w przeciwnym razie `null`

`PlayerCardV2` dostaje opcjonalny prop `mmrOverride?: { mmr: number; rank: string | null }`. Logika:

- Jeśli `mmrOverride` istnieje → wyświetlamy MMR + rank icon (używając `RankIcon` i `rank-utils`)
- Jeśli nie → fallback na obecne dane z `players_registry` (czyli "tylko dane z gry")

Tryb 3v3 wybieramy na podstawie liczebności drużyn z meczu MMRivals (zawsze 3v3 dla teamów; 2v2 jeśli `players.length === 2` itd.). Domyślnie `mmr_3v3` / `rank_3v3`.

W `OverlayV2.tsx` i `V2Preview.tsx` (tryb live) dokładamy odczyt z hooka i przekazujemy do `PlayerCardV2`.

## Pliki do utworzenia / edycji

**Nowe:**
- `src/components/creator/BroadcastControlsPanel.tsx` — kontener z dwiema sekcjami (Match + MMRivals)
- `src/components/creator/MmrivalsMatchPicker.tsx` — kaskadowe selecty + lista parowań
- `src/hooks/useMmrivalsMatchData.ts` — pobieranie szczegółów meczu z cache
- `src/hooks/useActivePlayerMmrInfo.ts` — łączy `players_live` + parowanie + MMR
- `src/lib/player-matching.ts` — funkcje `pairPlayers()`, `levenshtein()`, normalizacja nicków

**Edycja:**
- `src/pages/Creator.tsx` — wstawić `<BroadcastControlsPanel>` pod `<V2Preview>` gdy `previewMode === 'live'`
- `src/hooks/useBroadcast.tsx` — dodać `swapTeams()`, `resetSeriesScore()`, `clearManualData()`, `setMmrivalsMatch()`, `setPlayerPairings()`
- `src/types/broadcast.ts` — rozszerzenie `BroadcastSession` o `mmr_*` i `player_pairings`
- `src/components/v2/PlayerCardV2.tsx` — prop `mmrOverride` + render MMR/rangi
- `src/pages/OverlayV2.tsx` — przekazanie `mmrOverride` do `PlayerCardV2`
- `src/components/creator/V2Preview.tsx` — to samo dla podglądu live
- `src/lib/mmrivals-api.ts` — bez zmian (używamy istniejącego `fetchMatches`)

**Migracja DB:**
- `ALTER TABLE broadcast_sessions ADD COLUMN mmr_tournament_id text, mmr_match_id text, mmr_team_a_id text, mmr_team_b_id text, player_pairings jsonb DEFAULT '{}'::jsonb`

## Uwagi techniczne

- API MMRivals jest wywoływane z klienta tak samo jak w `/studio` (klucz publiczny w `mmrivals-api.ts`) — bez edge functiona
- Realtime: każda zmiana `broadcast_sessions` już teraz subskrybowana przez `useBroadcast`, więc panel automatycznie się odświeża u innych moderatorów
- Parowanie wykonujemy klientowo — wynik zapisujemy do DB tylko gdy admin zatwierdzi auto albo zmieni ręcznie
- Brak parowania = `PlayerCardV2` używa istniejącej ścieżki (`players_registry`) — nic się nie psuje
