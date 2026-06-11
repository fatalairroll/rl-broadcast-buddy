## Bracket: re-baseline pierwszej widocznej rundy do góry

### Cel
Pierwsza widoczna kolumna (`visualRoundOffset === 0`) startuje od góry contentu drabinki — nawet gdy okno przesunęło się na R2–R4. Kolumny 2 i 3 zachowują centrowanie w slocie, żeby linie SVG drzewka łączyły pary poprawnie.

### Zmiany — wyłącznie `src/components/studio/BracketView.tsx`

1. **Re-baseline przez `visualRoundOffset`**
   - `visibleRounds.map(([roundIdx, roundMatches], visualRoundOffset) => ...)` w body kolumn.
   - `const containerHeight = getContainerHeight(visualRoundOffset);` (już tak — bez zmian wzoru).
   - Zakaz offsetów od absolutnego `roundIdx` lub `startIdx`.

2. **Warunkowe wyrównanie slotu meczu**
   - Wrapper slotu:
     ```
     alignItems: visualRoundOffset === 0 ? 'flex-start' : 'center'
     ```
   - Offset 0 → karta od góry slotu (slot = MATCH_HEIGHT, więc i tak prawie bez różnicy, ale jawnie).
   - Offset 1, 2 → `center` (jak dotąd) — zachowuje wyrównanie par dla linii SVG.

3. **Wyrównanie do góry kontenerów**
   - Body row: `className="relative flex items-start"` (już jest).
   - Każda kolumna: dodać `self-start` → `flex flex-col items-center shrink-0 self-start`.
   - Brak `justifyContent: 'center'` / `alignItems: 'center'` na osi pionowej całego bracketu.

4. **Reset scrolla na zmianę okna / poola**
   - `useEffect(() => { if (outerRef.current) outerRef.current.scrollTop = 0; }, [startIdx, selectedPoolId]);`
   - Używamy `startIdx` — tej samej zmiennej, którą zwraca obecny `useMemo` w pliku (konsekwentnie z kodem po wdrożeniu pooli).

5. **Bez zmian:** `computeRoundWindow` (okno 3 rund), `calcLines` (linie SVG), auto-scroll (warunek >12 meczów), pool selector, 956px frame, header rund.

### Definition of Done
- Pierwszy mecz pierwszej widocznej rundy startuje tuż pod headerem rund — niezależnie czy to R1, czy R2.
- Brak pustej „poduszki" ~50% wysokości nad pierwszą widoczną kolumną.
- Linie R2→R3→R4 nadal poprawne (centrowanie zachowane dla offset > 0).
- Po przesunięciu okna lub zmianie poola scroll wraca do góry.
- Brak regresji: turnieje bez pooli, okno od R1, pool selector, 956px frame.

### Zakaz
- ❌ `getContainerHeight(roundIdx - 1)` lub offset od absolutnej rundy
- ❌ `flex-start` we wszystkich slotach (zepsułoby drzewko w kol. 2/3)
- ❌ Pionowe centrowanie całego bracketu w viewport
- ❌ Zmiany poza `BracketView.tsx`
