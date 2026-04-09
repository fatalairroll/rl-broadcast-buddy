

## Plan: Naprawienie kolejności meczów w "Next Matches"

### Przyczyna problemu
API zwraca pole `match_index` w kolejności **alfabetycznej** ID meczu, nie w kolejności drabinki:
- M1 → match_index: 1
- M10 → match_index: 2
- M11 → match_index: 3
- M2 → match_index: 9
- M3 → match_index: 10

Dlatego overlay wybiera mecze 10, 11, 12 zamiast 2, 3, 4 — bo mają niższy `match_index`.

### Rozwiązanie
Wyciągnąć **numer meczu** z `match_id` (np. `...-R1-M5` → 5) i sortować po nim zamiast po `match_index`.

### Zmiana w `src/hooks/useStudioData.ts`

Dodać funkcję pomocniczą:
```ts
function extractMatchNumber(matchId: string): number {
  const m = matchId.match(/-M(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}
```

Zmienić sortowanie w trybie `next_3` (i opcjonalnie `recent`) z:
```ts
return (a.match_index ?? 0) - (b.match_index ?? 0);
```
na:
```ts
return extractMatchNumber(a.match_id) - extractMatchNumber(b.match_id);
```

### Plik do edycji
- `src/hooks/useStudioData.ts`

### Efekt
Dla count=5 overlay pokaże mecze M2, M3, M4, M5, M6 (zgodnie z drabinką MMRivals) zamiast M10, M11, M12, M13, M14.

