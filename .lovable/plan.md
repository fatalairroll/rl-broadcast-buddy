## Cel

Wsparcie turniejów pool-based w Studio:
- `next_3` / `recent` — bez podziału na poole (jedna kolejka).
- `bracket` — selektor pooli (POOL 1..N + FINAŁ) gdy `use_pools`; max 3 kolumny rund w oknie 956px; bez mieszania pooli w kolumnie.

API `overlay-data` jest wdrożone w osobnym projekcie RankClash — w tym repo **nie** ruszamy edge functions.

## Zmiany

### 1. `src/types/studio.ts`
- Dodać `PoolData { pool_id; index; size; winners_pool_id? }`.
- Dodać `pool_id?: string | null` do `MatchData`.
- Rozszerzyć `MatchResponse` o `pools?: PoolData[]` i `use_pools?: boolean`.

### 2. `src/lib/pool-utils.ts` (nowy)
- `poolIdFromMatchId(matchId)` — regex `^(.+-POOL-\d+|.+-WINNERS)-R\d+-M\d+`.
- `isPoolTournament(pools)` — `true` gdy istnieje pool o `index > 0`.
- `selectablePools(pools)` — fazowe `index>0` sortowane + WINNERS (`index===0`) na końcu.
- `poolTabLabel(pool)` — `FINAŁ` dla WINNERS, inaczej `POOL N`.
- `poolBadge(poolId)` — `P{n}` lub `F`.

### 3. `src/lib/mmrivals-api.ts`
- `fetchMatches(tournamentId, mode, options?: { poolId?: string })` — dokleja `pool_id` do query gdy podany.

### 4. `src/hooks/useStudioData.ts`
- Nowe opcje: `bracketPoolId?: string`.
- Zwracać też `pools: PoolData[]` i `usePools: boolean`.
- **Refetch przy zmianie poola**: `bracketPoolId` w deps `fetchData` useCallback **i** w deps useEffect uruchamiającym fetch + interval; zmiana poola → natychmiastowy fetch z nowym `pool_id` w query (nie tylko client-side filtr).
- Po fetch: `setPools(res.pools ?? [])`, `setUsePools(res.use_pools ?? isPoolTournament(res.pools))`.
- Mapować mecze: `pool_id ?? poolIdFromMatchId(match_id)`.
- `next_3` — bez `poolId`, bez filtra per pool. **Zachować** istniejący `filterNext3VisibleMatches` (TBD-filter z poprzedniego zadania) bez zmian.
- `recent` — bez `poolId`, bez filtra per pool.
- `bracket` — przekazać `bracketPoolId` do `fetchMatches` (gdy ustawiony).

### 5. `src/pages/StudioRender.tsx`
- Czytać `pool_id` z URL: `const urlPool = params.get('pool_id') ?? ''` — pusty string traktować jak brak.
- Lokalny stan `bracketPoolId` (init z `urlPool`).
- Przekazać do `useStudioData` tylko w trybie `bracket` (`bracketPoolId || undefined`).
- Effect domyślnego poola: gdy `mode==='bracket' && usePools && !bracketPoolId && pools.length` → ustaw `selectablePools(pools)[0].pool_id` (czyli POOL 1).
- **Renderować `<BracketView ... />` wewnątrz `<StudioContentFrame obs={obs}>`** (jak inne tryby — explicit, żeby nie wypadała poza ramkę 956px).
- Props: `<BracketView matches={...} pools={pools} usePools={usePools} selectedPoolId={bracketPoolId} onPoolChange={setBracketPoolId} obs={obs} />`.

### 6. `src/pages/Studio.tsx`
- W builderze URL: gdy wybrany turniej ma `use_pools`, pokazać `<select>` poola obok pól mode/count.
- Lista pooli pochodzi z hooka `useStudioData({ tournamentId, mode: 'bracket', enabled: !!tournamentId, pollInterval: 0 })` (lub jednorazowy `fetchMatches(tid, 'bracket')` po wyborze turnieju) — bez `pool_id`, żeby dostać pełną listę.
- Wybór poola → dokleja `&pool_id=...` do linku OBS.

### 7. `src/components/studio/BracketView.tsx` — przebudowa
- Props: `matches, pools?, usePools?, selectedPoolId?, onPoolChange?, obs?`.
- **Usuwane:** `height: 100vh`, `SAFE_AREA_X` poziomy padding (poleganie na `StudioContentFrame`).
- Root: `width: 100%`, `display: flex column`, brak narzuconej wysokości.
- Stałe pozostają: `CARD_WIDTH=200, H_GAP=60, MATCH_HEIGHT=72, BASE_GAP=12`. Dodać `ROUND_WINDOW=3`.
- **Selektor pooli** (gdy `usePools && selectablePools(pools).length > 1 && !obs`): pasek pigułek `POOL 1..N | FINAŁ`, aktywny `#00A3FF`. W OBS ukryty.
- **Filtr meczów** (belt & suspenders, gdyby API mimo `pool_id=` zwróciło więcej):
  `poolMatches = usePools && selectedPoolId ? matches.filter(m => (m.pool_id ?? poolIdFromMatchId(m.match_id)) === selectedPoolId) : matches`.
  Grupowanie rund liczone z `poolMatches`.
- **Okno 3 rund — uniwersalne, nie tylko przy poolach**: `computeRoundWindow(sortedRounds)`:
  - jeśli `sortedRounds.length <= 3` → wszystkie;
  - inaczej anchor = pierwsza runda z `scheduled|live|in_progress`, fallback ostatnia `done`;
  - `startIdx = clamp(anchor-1, 0, len-3)`;
  - `visible = slice(startIdx, startIdx+3)`.
  Stosowane zawsze (turnieje 5-rundowe ≤32 też dostają okno).
- `hasPreviousRounds = startIdx > 0` (pionowy label „Poprzednie rundy" jak teraz).
- **Auto-scroll pionowy**: zachować, ale uruchamiać tylko gdy najwyższa kolumna w oknie ma >12 meczów (~960px).
- Linie SVG łączą tylko `visibleRounds`.

### 8. `MatchCard.tsx` (opcjonalnie, low risk)
- W `UpcomingQueueRow` mały tag `poolBadge(match.pool_id)` obok numeru rundy.

## Pliki

| Plik | Akcja |
|------|-------|
| `src/types/studio.ts` | edycja |
| `src/lib/pool-utils.ts` | nowy |
| `src/lib/mmrivals-api.ts` | edycja `fetchMatches` |
| `src/hooks/useStudioData.ts` | edycja (deps + zwracane pola) |
| `src/pages/StudioRender.tsx` | edycja (URL, stan, ramka) |
| `src/pages/Studio.tsx` | edycja URL buildera + select poola |
| `src/components/studio/BracketView.tsx` | przebudowa |
| `src/components/studio/MatchCard.tsx` | opcjonalny badge poola |

## Bez zmian

`supabase/functions/overlay-data` (inny projekt), `Relay.tsx`, postgame, live `/v2/overlay`, `StudioContentFrame`, layout next_3/recent (poza opcjonalnym badge), `filterNext3VisibleMatches` (TBD-filter zachowany).

## Definition of Done

- next_3 — wszystkie poole w jednej kolejce, TBD-filter dalej aktywny.
- recent — 10 ostatnich `done` ze wszystkich pooli.
- bracket — selektor `POOL 1..N + FINAŁ` gdy `use_pools`; zmiana poola wywołuje refetch z `pool_id=`.
- bracket renderowany w `StudioContentFrame` (956px).
- Okno 3 kolumn rund stosowane gdy rund > 3 (także w turniejach bez pooli, np. 5-rundowych ≤32).
- W jednej kolumnie tylko mecze wybranego poola.
- OBS: `&pool_id=...` wybiera pool, selektor ukryty; pusty `pool_id` w URL traktowany jak brak → effect ustawia POOL 1.
- Turniej bez pooli i ≤3 rund — bez regresji.
