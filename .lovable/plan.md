## Bracket v2 — fix „wisi w powietrzu"

Audit obecnego `src/components/studio/BracketView.tsx` po v1:

- ✅ Root **nie** ma `height: 100vh` (jest `width: 100%`, flex col)
- ✅ `outerRef` **nie** ma `flex: 1` (ma `maxHeight: 960` przy auto-scrollu)
- ✅ Body używa `roundOffset` (visual), nie `roundIdx`, w `getContainerHeight` i `alignItems`
- ✅ Reset `scrollTop = 0` na `[startIdx, selectedPoolId]`
- ❌ Kolumna „Poprzednie rundy zakończone" w body ma `self-stretch` (spec: `self-start`)
- ❌ Brak generation-guard w pętli RAF — przy resecie scrolla w trakcie `scrolling-down`/`pause-bottom` RAF nadpisuje `scrollTop` na środek/dół
- ❌ Brak osobnego helpera `getSlotLayout` (kosmetyka, ułatwia audyt)

### Zmiany — wyłącznie `src/components/studio/BracketView.tsx`

1. **Helper `getSlotLayout(visualRoundOffset)`** zwracający `{ height, alignItems }`:
   - offset 0 → `{ height: MATCH_HEIGHT, alignItems: 'flex-start' }`
   - offset > 0 → `{ height: getContainerHeight(offset), alignItems: 'center' }`
   - Użyj w mapie kolumn body zamiast inline'owanego `getContainerHeight(roundOffset)` + ternary.

2. **Kolumna „Poprzednie rundy zakończone" w body** (spacer z border-left):
   - `self-stretch` → `self-start`
   - dodaj `minHeight: MATCH_HEIGHT` (żeby border-left był widoczny, ale nie rozpychał wiersza)

3. **Generation-guard auto-scroll RAF**:
   - Dodaj `const scrollGenerationRef = useRef(0)`.
   - W effekcie reset scrolla (`[startIdx, selectedPoolId]`) inkrementuj `scrollGenerationRef.current += 1` przed `scrollTop = 0`.
   - W effekcie auto-scroll: na starcie effectu zapisz `const myGen = scrollGenerationRef.current`. W każdym frame `step()` sprawdź `if (scrollGenerationRef.current !== myGen) { running = false; return; }` — efekt re-runuje się przy zmianie deps, więc dodaj `startIdx`, `selectedPoolId` do deps `useEffect`, żeby restart wystartował od `pause-top` z `scrollTop = 0`.

4. **Audit (bez zmian, tylko weryfikacja)**:
   - Zero wystąpień `getContainerHeight(roundIdx`, `getContainerHeight(round_index`, `roundIdx - 1`.
   - Root: brak `100vh`. `outerRef`: brak `flex: 1`.
   - Header row `padding: '0 0 12px'` zachowany (spec: brak `marginBottom > 8px` — 12px paddingu w header rowie jest OK, to nagłówek nie margin).

### Czego NIE zmieniam
- `computeRoundWindow` / okno 3 rund (już działa via `useMemo` `startIdx`/`visibleRounds`).
- `calcLines` / SVG.
- Pool selector, 956px frame, `StudioContentFrame`.
- `BracketMatchCard`.
- Brak nowej zmiennej `maxHeight` poza istniejącą (`960` przy auto-scrollu).

### Definition of Done
- Okno R2+R3+R4: pierwszy mecz tuż pod nagłówkiem „RUNDA 2", brak pustki.
- Linie R2→R3→R4 OK (offset 1,2 nadal `center`).
- Zmiana okna/poola w trakcie animacji scrolla → RAF się zatrzymuje, scroll na górze, restart od `pause-top`.
- Brak regresji: pool selector, frame 956px, turnieje bez pooli.

### Zakaz
- ❌ `getContainerHeight(roundIdx)` lub od absolutnej rundy
- ❌ `height: 100vh` / `flex: 1` rozciągające obszar do viewportu
- ❌ Zmiany poza `BracketView.tsx`
