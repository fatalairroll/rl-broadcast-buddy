

# Plan: Filtruj next_3 tylko do meczów scheduled

## Zmiana

W `src/hooks/useStudioData.ts`, w bloku `if (mode === 'next_3')` (linia 69), dodać filtrowanie `resultMatches = resultMatches.filter(m => m.state === 'scheduled')` przed `.slice(0, count)`.

| Plik | Zmiana |
|------|--------|
| `src/hooks/useStudioData.ts` | Dodać `.filter(m => m.state === 'scheduled')` przed `.slice(0, count)` w trybie `next_3` |

