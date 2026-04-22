

## Plan: Pokazuj świeżo „check-inowane" mecze w overlayu Next Matches

### Problem
Filter w `useStudioData` dla trybu `next_3` przepuszcza tylko mecze ze stanem `scheduled`. Gdy obie drużyny zrobią check-in, mecz zwykle przechodzi do `in_progress`/`live` i znika z overlaya — chociaż nadal jest „następnym meczem", który właśnie się zaczyna.

### Rozwiązanie
Rozszerzyć filtr w `useStudioData.ts` (tryb `next_3`) tak, aby zawierał:
- mecze ze stanem `scheduled` (jak teraz), **oraz**
- mecze w dowolnym stanie ≠ `done`/`finished`, w których **co najmniej jedna drużyna** ma `checked_in_at` w ciągu ostatnich **3 minut** (180 s) od `Date.now()`.

Dzięki temu mecze, które właśnie dostały check-in (jeden lub oba), nie znikają natychmiast z overlaya „Następne mecze" — pozostają widoczne maks. 3 min od ostatniego check-inu.

### Zmiany w kodzie

**Plik: `src/hooks/useStudioData.ts`** (jedyny edytowany plik)

W bloku `if (mode === 'next_3')` zastąpić obecny `.filter((m) => m.state === 'scheduled')` rozszerzonym predykatem:

```ts
const RECENT_CHECKIN_MS = 3 * 60 * 1000;
const now = Date.now();

const isRecentCheckIn = (iso?: string | null) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !isNaN(t) && now - t <= RECENT_CHECKIN_MS && now - t >= 0;
};

resultMatches = resultMatches
  .filter((m) => {
    if (m.state === 'done' || m.state === 'finished') return false;
    if (m.state === 'scheduled') return true;
    // mecze w innych stanach (in_progress/live) — pokaż jeśli świeży check-in
    return (
      isRecentCheckIn(m.team_a?.checked_in_at) ||
      isRecentCheckIn(m.team_b?.checked_in_at)
    );
  })
  .sort(/* bez zmian: round_index, potem extractMatchNumber */)
  .slice(0, count);
```

### Efekt
- Mecz ze statusem `scheduled` → widoczny jak dotychczas.
- Mecz, który właśnie wszedł w `in_progress`/`live` po check-inie → pozostaje na overlayu jeszcze do 3 min od ostatniego check-inu obu drużyn, po czym wypada.
- Nic się nie zmienia w trybach `bracket` i `recent`.

### Zakres
1 plik: `src/hooks/useStudioData.ts`

