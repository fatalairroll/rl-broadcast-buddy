

# Plan: Zmiana offsetX na rozsuwanie symetryczne

## Problem
Obecnie offsetX przesuwa wszystkie elementy (wynik, nazwy drużyn, serie) w tym samym kierunku. Użytkownik chce, żeby offsetX działał jako **rozsuwanie** - zwiększenie wartości oddala elementy od siebie (od środka scoreboardu), zmniejszenie zbliża.

## Rozwiązanie

Zmiana znaku offsetX dla elementów drużyny A (lewa strona) - użycie `-offsetX` zamiast `+offsetX`. Elementy drużyny B (prawa strona) zachowują `+offsetX`. Dzięki temu zwiększanie wartości rozsuwa elementy symetrycznie.

## Szczegóły techniczne

### Plik: `src/pages/Overlay.tsx`

Zmiana transformów dla elementów po lewej stronie (Team A):

- **Team A Name** (linia 163): `translate(${config.teamAName.offsetX}px,...)` na `translate(${-config.teamAName.offsetX}px,...)`
- **Team A Series** (linia 182): `translate(${config.seriesDisplay.offsetX}px,...)` na `translate(${-config.seriesDisplay.offsetX}px,...)`
- **Team A Score** (linia 207): `translate(${config.scoreDisplay.offsetX}px,...)` na `translate(${-config.scoreDisplay.offsetX}px,...)`

Team B elementy (prawe) zostają bez zmian - już mają `+offsetX`.

### Plik: `src/components/creator/OverlayPreview.tsx`

Ta sama logika w podglądzie:

- **Team A Name** (linia 159): zmiana na `-offsetX`
- **Team A Series** (linia 178): zmiana na `-offsetX`
- **Team A Score** (linia 213): zmiana na `-offsetX`

Team B elementy zostają bez zmian.

### Zmiana etykiety w StyleEditor

Zmiana labela suwaka z "Przesunięcie X" na "Rozsuwanie X" dla score, series i team names, aby jasno komunikować, że wartość rozsuwa elementy symetrycznie od środka.

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/pages/Overlay.tsx` | Negacja offsetX dla Team A (name, series, score) |
| `src/components/creator/OverlayPreview.tsx` | Negacja offsetX dla Team A (name, series, score) |
| `src/components/creator/StyleEditor.tsx` | Zmiana etykiety "Przesunięcie X" na "Rozsuwanie X" |

