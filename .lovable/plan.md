

# Plan: Dynamiczne ukrywanie zakończonych rund w drabince

## Plik: `src/components/studio/BracketView.tsx`

### 1. Filtrowanie zakończonych rund

Po zgrupowaniu i posortowaniu rund, znaleźć indeks pierwszej rundy, w której istnieje co najmniej jeden mecz bez stanu `finished`/`done`:

```ts
const firstVisibleIdx = sortedRounds.findIndex(([, ms]) =>
  ms.some(m => m.state !== 'finished' && m.state !== 'done')
);
const startIdx = firstVisibleIdx === -1 ? sortedRounds.length - 1 : firstVisibleIdx;
const visibleRounds = sortedRounds.slice(startIdx);
```

Zamienić `sortedRounds` na `visibleRounds` w renderze kolumn i w `calcLines`.

### 2. Zachowanie symetrii drzewa

Gap dla widocznych rund musi uwzględniać ich oryginalną pozycję w drzewie, nie pozycję w przefiltrowanej tablicy:

```ts
// ri to indeks w visibleRounds, ale gap bazuje na oryginalnym indeksie rundy
const originalRoundPosition = startIdx + localIdx;
const gap = 16 * Math.pow(2, originalRoundPosition);
```

Dzięki temu mecze zachowują właściwe rozmieszczenie pionowe nawet po ukryciu wcześniejszych rund.

### 3. Łączniki SVG tylko od widocznych rund

W `calcLines` iterować po `visibleRounds` zamiast `sortedRounds` — linie będą rysowane tylko między widocznymi meczami.

### 4. Komunikat "Poprzednie rundy zakończone"

Jeśli `startIdx > 0`, wyrenderować przed pierwszą widoczną kolumną pionowy pasek:
- Obrócony tekst (`writing-mode: vertical-rl`, `transform: rotate(180deg)`)
- Treść: `POPRZEDNIE RUNDY ZAKOŃCZONE`
- Styl: `font-esports`, `text-[9px]`, `uppercase`, `tracking-[0.3em]`, `rgba(255,255,255,0.3)`, lewa krawędź `1px solid rgba(255,255,255,0.08)`

### 5. Płynny autoscroll w pionie

Dodać `useEffect` z logiką autoscrollu:
- Po renderze sprawdzić `scrollHeight > clientHeight` kontenera
- Jeśli tak — uruchomić `requestAnimationFrame` loop scrollujący w dół z prędkością ~0.3px/frame
- Po dotarciu do dołu — odwrócić kierunek (ping-pong)
- Owinąć kontener główny w dodatkowy div z `overflow-y: hidden` (żeby scroll nie był widoczny dla widza) i programowo kontrolować `scrollTop`
- Cleanup na unmount

