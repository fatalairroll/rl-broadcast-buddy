# Autosugestia meczu — Krok 1 (dopięcie)

Większość kroku 1 jest już w repo (`src/lib/match-suggestion.ts`, debounce 500 ms, sekcja „Sugestia meczu" w `MmrivalsMatchPicker`). Brakuje **spójności logiki aplikowania meczu** i kilku detali z DoD.

## Zmiany

### 1. `src/lib/match-suggestion.ts`
- Dodać eksport czystej funkcji `applyMatchFromBracket(m, liveNames, session, updateSession, toast)`:
  - liczy `autoPair(liveNames, flattenMatchPlayers(m))`,
  - woła `updateSession({ mmr_match_id, mmr_team_a_id, mmr_team_b_id, team_a_name, team_b_name, series_type: bestOfToSeriesType(m.best_of), team_a_series_score: m.score_a ?? 0, team_b_series_score: m.score_b ?? 0, player_pairings })`,
  - emituje toast „Wczytano mecz z MMRivals" z liczbą sparowanych graczy.
- Brak importów Reacta. Typy: `BroadcastSession`, `MatchData`, `ToastFn` (sygnatura zgodna z `useToast().toast`).

### 2. `src/components/creator/MmrivalsMatchPicker.tsx`
- Usunąć lokalne `handleSelectMatch` i `applySuggestion` jako osobne implementacje — obie ścieżki wołają nowy `applyMatchFromBracket(m, liveNamesForApply, session, updateSession, toast)`:
  - **ręczny wybór** używa `liveNames` (bieżący stan lobby) i po sukcesie aktualizuje `setSelectedRound(m.round_index ?? null)` (już ustawione przez efekt na `currentRound`, ale zostawiamy explicit dla sugestii).
  - **„Zastosuj sugestię"** używa `debouncedLiveNames`.
- Efekt: ręczny wybór teraz **też** ustawia `series_type` + `team_a/b_series_score` z drabinki (dziś nie ustawia — niespójność z DoD „używa `applyMatchFromBracket`").
- Pod listą sugestii dodać warunkowy hint:
  - jeśli `suggestions[0].matchedPlayers < 2 && suggestions.length > 1` → mały tekst muted: „Niska pewność — sprawdź ręcznie."
- Zostawić istniejący tekst „Nie ten? Wybierz ręcznie poniżej." i kolejność (sekcja nad „Runda").

### 3. Pliki bez zmian
Relay, Studio, `overlay-data`, RankClash, `useSeriesAutoTracker` (Krok 2), `player-matching.ts`, hooki broadcastu.

## Detale techniczne

- `ToastFn` w `match-suggestion.ts`: `type ToastFn = (opts: { title: string; description?: string }) => unknown;` — uniknięcie zależności od `@/hooks/use-toast` w lib.
- `applyMatchFromBracket` nie ustawia `selectedRound` (to stan UI komponentu) — komponent robi to po wywołaniu helpera.
- Brak zmian w `suggestMatches`, rankingu, filtrach `finished/done`, debounce.

## Definition of Done
- [ ] Ręczny wybór meczu i „Zastosuj sugestię" wołają **ten sam** `applyMatchFromBracket`.
- [ ] Ręczny wybór ustawia `series_type` z `best_of` oraz `team_a/b_series_score` z drabinki.
- [ ] Sugestie pojawiają się nad „Runda" ~0,5 s po stabilizacji nicków, max 3, bez `finished`/`done`/TBD.
- [ ] Sesja nigdy nie zmienia się bez klika operatora.
- [ ] Hint „Niska pewność" pokazuje się gdy top sugestia ma <2 dopasowań i jest >1 sugestii.
- [ ] „Odepnij" → sugestie wracają.
- [ ] TS/lint czysto.
