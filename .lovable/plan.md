

# Plan: Dodanie cienia do ikony i % wyników ankiety

## Zmiana

**Plik:** `src/components/studio/MatchCard.tsx`

Dodać `textShadow` i `filter: drop-shadow` do dwóch elementów zawierających ikonę `BarChart3` i procent:

1. **TeamBanner** (linia 241-242) — dodać do stylu:
   - `textShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)'`
   - `filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))'`

2. **UpcomingQueueRow** (linia 296-297) — identyczny styl jak wyżej.

Cień obejmie zarówno ikonę SVG (przez `drop-shadow`), jak i tekst procentowy (przez `textShadow`).

