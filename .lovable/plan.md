

# Plan: Intensywność MMR + poprawka liczby meczów w kolejce

## 1. Zwiększenie intensywności cyfr MMR — `src/components/studio/MatchCard.tsx`

W komponencie `MmrHeroText` (linia 68-103):
- Zmienić `opacity: 0.45` na wartość zależną od `side`:
  - Drużyna niebieska (`side === 'a'`): `0.45 * 1.35 = 0.61`
  - Drużyna pomarańczowa (`side === 'b'`): `0.45 * 1.20 = 0.54`

## 2. Usunięcie malejącej opacity w kolejnych meczach — `src/components/studio/MatchCard.tsx`

W komponencie `UpcomingQueue` (linia 310-336):
- Usunąć tablicę `opacities` i zastosowanie `opacities[i]` w `animate`
- Zmienić `animate={{ opacity: opacities[i] ?? 0.2, y: 0 }}` na `animate={{ opacity: 1, y: 0 }}`

## 3. Poprawka liczby wyświetlanych meczów — `src/components/studio/MatchCard.tsx`

- Usunąć `matches.slice(0, 4)` (linia 318) — renderować wszystkie mecze z tablicy `matches` bez ograniczenia
- Liczba meczów jest już kontrolowana przez parametr `count` w URL i filtrowanie w `useStudioData`

## 4. Poprawka domyślnej wartości count — `src/pages/StudioRender.tsx`

- Parametr `count` na linii 28 domyślnie wynosi `3` — jeśli użytkownik ustawił 5 w URL (`?count=5`), to działa poprawnie. Problem mógł wynikać z kombinacji `slice(0,4)` w UpcomingQueue + count=5 daje max 4 upcoming, ale jeśli API zwraca mniej scheduled meczów, widać mniej. Usunięcie slice rozwiąże problem.

