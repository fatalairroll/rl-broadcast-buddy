

## Plan: Drabinka zawsze zaczyna od góry

### Problem
Funkcja `getContainerHeight` używa `absoluteRoundIndex` (np. runda 3 w turnieju), więc gdy faza 1 jest ukryta, pierwsza widoczna runda ma już dużą wysokość kontenera — mecze zaczynają się niżej.

### Rozwiązanie
Zmienić obliczanie wysokości z `absoluteRoundIndex` na `roundOffset` (0-bazowy indeks względem widocznych rund). Dzięki temu pierwsza widoczna runda zawsze ma wysokość `MATCH_HEIGHT` (72px), a kolejne rosną proporcjonalnie.

### Zmiana w `src/components/studio/BracketView.tsx`

**Linia 319-320** — zamiana:
```ts
// Było:
const absoluteRoundIndex = startIdx + roundOffset;
const containerHeight = getContainerHeight(absoluteRoundIndex);

// Będzie:
const containerHeight = getContainerHeight(roundOffset);
```

To jedyna zmiana — 1 linia w 1 pliku.

