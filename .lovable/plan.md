

# Plan: Dopasuj szerokość pasków kolejnych meczów do banerów drużyn

## Problem

Paski kolejnych meczów (`UpcomingQueueRow`) rozciągają się na pełną szerokość kontenera, zamiast być wyrównane do krawędzi banerów drużyn w meczu głównym. Lewa krawędź powinna pokrywać się z lewą krawędzią niebieskiego banera, a prawa z prawą krawędzią pomarańczowego banera.

## Rozwiązanie

### `src/components/studio/MatchCard.tsx`

Każdy baner drużyny ma `width: 450px`. Między nimi jest sekcja VS (~48px z mx-3 i tekstem). Łącznie: ~948px.

Zmiany w `UpcomingQueue`:
- Ustawić kontener kolejki na `display: flex, justify-content: center` (wycentrowany jak reszta)
- Nadać wierszom stałą szerokość równą sumie obu banerów + gap VS (~948px)
- Dostosować marginesy tak, aby krawędzie pasków pokrywały się z krawędziami banerów (uwzględniając offset skew i margines banerów: `marginRight: 18px` dla A, `marginLeft: -12px` dla B)

Konkretnie: szerokość wiersza = `450 + 450 + 48 = 948px`, wycentrowana, z przesunięciem `marginLeft: ~3px` (kompensacja asymetrycznych marginesów banerów: 18px vs -12px daje offset ~3px w prawo).

