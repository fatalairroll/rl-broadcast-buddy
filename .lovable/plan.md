

# Plan: Kolorowe kreseczki w drabince + poprawki numeracji i kolejności meczów

## Problemy zidentyfikowane

1. **Numeracja rund zawyżona o 1** — linia 202: `Runda {roundIdx + 1}`, ale `roundIdx` pochodzi z API jako wartość 1-based, więc +1 daje błędny wynik. Poprawka: `Runda {roundIdx}`.

2. **Next matches — brak sortowania** — kod filtruje mecze `scheduled` i bierze pierwsze N, ale nie sortuje ich po `round_index` → `match_index`. Mecze mogą trafiać w losowej kolejności z API. Poprawka: dodać `.sort()` przed `.slice(0, count)`.

3. **Next matches — count=3 domyślnie** — w `StudioRender.tsx` linia 25: `Number(params.get('count') ?? '3')`. Jeśli w konfiguracji ustawisz 5, to URL powinien mieć `count=5` i to zadziała. Ale warto sprawdzić czy URL jest generowany poprawnie (wygląda OK w `Studio.tsx`). Jeśli problem nadal występuje, to prawdopodobnie API zwraca za mało meczów ze statusem `scheduled`.

4. **Kolorowe kreseczki** — dodanie niebieskiej/pomarańczowej pionowej kreseczki przy nazwach drużyn.

## Zmiany

### Plik: `src/components/studio/BracketView.tsx`

**A. Numeracja rund (linia 202)**
- Zmienić `Runda {roundIdx + 1}` na `Runda {roundIdx}`

**B. Kolorowe kreseczki w `BracketMatchCard`**
- W pasku Team A (linia 248-262): dodać `<div>` o szerokości 4px, wysokości 20px, tle `#2563eb`, z `transform: skewX(-7deg)` i `flex-shrink: 0`, umieszczony przed nazwą drużyny (wewnątrz unskewed diva, jako pierwszy element flex)
- W pasku Team B (linia 277-291): identyczna kreseczka z kolorem `#f97316`
- Kreseczki nie potrzebują osobnego skew bo są wewnątrz diva z `skewX(7deg)` (unskew) — cały kontener już ma skew, więc kreseczki będą naturalnie pochylone

### Plik: `src/hooks/useStudioData.ts`

**C. Sortowanie meczów w trybie next_3 (linia 69-72)**
- Dodać sortowanie przed slice:
```ts
resultMatches = resultMatches
  .filter((m) => m.state === 'scheduled')
  .sort((a, b) => {
    if (a.round_index !== b.round_index) return a.round_index - b.round_index;
    return (a.match_index ?? 0) - (b.match_index ?? 0);
  })
  .slice(0, count);
```

## Pliki do edycji
- `src/components/studio/BracketView.tsx`
- `src/hooks/useStudioData.ts`

