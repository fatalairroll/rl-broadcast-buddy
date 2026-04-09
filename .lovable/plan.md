

## Plan: Poprawka wyświetlania prawidłowej liczby meczy w trybie "Next Matches"

### Problem
Gdy tryb to `next_3`, hook wysyła do API `mode=next_3`, które prawdopodobnie zwraca z góry ograniczoną liczbę meczów (3). Parametr `count=5` z URL jest poprawnie odczytywany i przekazywany, ale API nie zwraca wystarczająco dużo danych do przycięcia.

### Rozwiązanie
**Plik: `src/hooks/useStudioData.ts`** — zmiana mapowania trybu API

Dla trybu `next_3` wysyłać do API `mode=bracket` (tak jak już robi to tryb `recent`), dzięki czemu API zwróci **wszystkie** mecze turnieju. Filtrowanie po `state === 'scheduled'` i `.slice(0, count)` już działa poprawnie po stronie klienta.

Zmiana w liniach 47-51:
```ts
let apiMode: string = mode;
if (mode === 'recent' || mode === 'next_3') {
  apiMode = 'bracket';
}
```

Jedna linia warunku — reszta logiki bez zmian.

