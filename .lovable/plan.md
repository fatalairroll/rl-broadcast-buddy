# Autosugestia meczu turniejowego

## Cel

Gdy operator otwiera lobby w RL, Broadcast Buddy proponuje do 3 najbardziej prawdopodobnych meczów z drabinki turnieju MMRivals na bazie nicków obecnych w lobby. Operator zatwierdza jednym kliknięciem; ręczny wybór (Runda → Mecz) działa jak dotąd.

## Nowy plik — `src/lib/match-suggestion.ts`

API:

```ts
export interface MatchSuggestion {
  match: MatchData;
  matchedPlayers: number;   // liczba nicków z lobby trafionych w roster
  totalLiveNames: number;
  totalRosterSlots: number; // tournamentMode * 2
  liveState: 'live' | 'in_progress' | 'scheduled' | 'other';
}

export function suggestMatches(args: {
  livePlayerNames: string[];
  matches: MatchData[];
  tournamentMode?: string; // '1v1' | '2v2' | '3v3' (info do scoringu, opcjonalnie)
  limit?: number;          // default 3
}): MatchSuggestion[];
```

### Algorytm

1. **Filtr kandydatów** — `matches` przefiltrowane przez:
   - `team_a` i `team_b` przypisane (oba `!= null`, mają `team_id`),
   - `state` nie należy do `{ finished, done }`,
   - na rosterze jest ≥ 1 gracz (suma `players` po obu teamach > 0).
2. **Liczba dopasowań** — dla każdego kandydata:
   - `candidates = flattenMatchPlayers(match)` (istniejąca funkcja),
   - dla każdego `name ∈ livePlayerNames` wywołać `findBestMatch(name, candidates)` (istniejąca),
   - liczyć graczy z `findBestMatch` ≠ null **bez podwójnego liczenia tego samego `discord_id`** (jak w `autoPair`: greedy po `score` rosnąco, każdy `discord_id` użyty raz),
   - `matchedPlayers = liczba zaakceptowanych par`.
3. **Pomiń** mecze z `matchedPlayers === 0` — bez sygnału nie sugerujemy.
4. **Ranking** (sort malejący):
   - `matchedPlayers` ↓,
   - `liveBoost` ↓ (`live` lub `in_progress` = 1, reszta = 0),
   - `round_index` ↑ (wcześniejsza runda wyżej),
   - tie-break: `match_index ?? 0` ↑, potem `match_id` lex.
5. Zwróć `slice(0, limit ?? 3)`.

Brak importów Reacta; czysta logika. Reużycie `findBestMatch`, `flattenMatchPlayers` z `@/lib/player-matching`.

## Zmiany — `src/components/creator/MmrivalsMatchPicker.tsx`

### 1. Debounce nicków z lobby (500 ms)

Nowy `useState<string[]> debouncedLiveNames` + `useEffect` resetujący timer przy zmianie `liveNames`. `setTimeout(500)` → ustawia `debouncedLiveNames`. Cleanup `clearTimeout`. Porównanie po stringified sorted, żeby kolejność/identyczne tablice nie odpalały timera.

### 2. Sugestie

`const suggestions = useMemo(() => suggestMatches({ livePlayerNames: debouncedLiveNames, matches, tournamentMode: ... , limit: 3 }), [debouncedLiveNames, matches])`.

`tournamentMode` pobieramy z aktualnego turnieju (`tournaments.find(t => t.tournament_id === tournamentId)?.mode`).

### 3. Sekcja UI „Sugestia meczu" — nad polem `Runda`

Renderowana wyłącznie gdy `tournamentId && suggestions.length > 0 && !matchId` (nie pokazuj gdy już jest wybrany mecz; po `Odepnij` wraca).

Dla każdej sugestii (max 3):

- Wiersz: `{teamA} vs {teamB}` + meta `R{round_index+1} · M{match_index+1} · BO{best_of} · {state}` + badge `{matchedPlayers}/{totalLiveNames}`.
- Przycisk „Zastosuj sugestię" (variant `default`/`secondary` dla #1, ghost dla pozostałych).
- Klik → `applySuggestion(match)`.

Pod listą drobny tekst pomocy: „Nie ten? Wybierz ręcznie poniżej.".

### 4. `applySuggestion(m: MatchData)`

```ts
const newPairings = autoPair(debouncedLiveNames, flattenMatchPlayers(m));
const seriesType = bestOfToSeriesType(m.best_of); // 1->bo1, 3->bo3, 5->bo5, 7->bo7; fallback bo3
updateSession({
  mmr_match_id: m.match_id,
  mmr_team_a_id: m.team_a?.team_id ?? null,
  mmr_team_b_id: m.team_b?.team_id ?? null,
  team_a_name: m.team_a?.name ?? session?.team_a_name,
  team_b_name: m.team_b?.name ?? session?.team_b_name,
  series_type: seriesType,
  team_a_series_score: m.score_a ?? 0,
  team_b_series_score: m.score_b ?? 0,
  player_pairings: newPairings,
});
toast({ title: 'Zastosowano sugestię', description: `${m.team_a?.name} vs ${m.team_b?.name} — ${Object.keys(newPairings).length}/${debouncedLiveNames.length} sparowano` });
```

`bestOfToSeriesType` — lokalny helper w tym pliku (lub w `match-suggestion.ts` obok algorytmu — preferuję `match-suggestion.ts`, eksportowane).

### 5. Brak auto-stosowania

Sugestia nigdy nie wywołuje `updateSession` bez kliku admina. „Wybierz ręcznie" (istniejące selecty Runda/Mecz) bez zmian.

## Pliki

| Plik | Akcja |
|------|-------|
| `src/lib/match-suggestion.ts` | **nowy** — `suggestMatches`, `bestOfToSeriesType`, typ `MatchSuggestion` |
| `src/components/creator/MmrivalsMatchPicker.tsx` | debounce `liveNames` (500 ms), sekcja „Sugestia meczu" nad rundą, `applySuggestion` |

Nietknięte: `Relay`, `Studio`, `useStudioData`, `useLiveStatsV2`, `mmrivals-api`, RankClash, edge functions.

## Definition of Done

- [ ] Po wejściu w lobby RL i wyborze turnieju, w ciągu ~0.5 s nad polem „Runda" pojawiają się maks. 3 propozycje meczów posortowane wg liczby trafionych nicków → live/in_progress → niższa runda.
- [ ] Mecze `finished`/`done` nie pojawiają się; TBD też nie.
- [ ] Klik „Zastosuj sugestię" ustawia `mmr_match_id`, nazwy drużyn, `series_type` z `best_of`, `team_*_series_score` z drabinki i odpala `autoPair`.
- [ ] Bez klika nic się nie zmienia w sesji.
- [ ] Po `Odepnij` sugestie znowu widoczne.
- [ ] Ręczny flow (Runda → Mecz) działa identycznie jak wcześniej.
- [ ] TS/lint czysto.
