

# Plan: Przebudowa BracketView — symetria, glassmorphism, łączniki

## Plik: `src/components/studio/BracketView.tsx` — pełne przepisanie

### Stałe
```ts
const MATCH_HEIGHT = 72;
const BASE_GAP = 8;
const H_GAP = 60;        // stały odstęp poziomy między kolumnami
const SCROLL_SPEED = 0.15;
const LINE_COLOR = 'rgba(255,255,255,0.2)';
const LINE_WIDTH = 1.5;
const SKEW = -7;
const UNSKEW = 7;
const CARD_WIDTH = 200;
```

### 1. Niezależna matematyka symetrii

Wysokość kontenera obliczana na podstawie **absolutnego** numeru rundy w turnieju (`originalPosition = startIdx + ri`), nie względnego `ri`:

```ts
function getContainerHeight(absoluteRoundIndex: number): number {
  if (absoluteRoundIndex === 0) return MATCH_HEIGHT;
  return 2 * getContainerHeight(absoluteRoundIndex - 1) + BASE_GAP;
}
```

Pierwsza widoczna runda (ri=0) używa `getContainerHeight(startIdx)` — jeśli startIdx=2, kontenery są już duże, zachowując proporcje jakby rundy 0-1 istniały.

Każdy mecz opakowany w:
```tsx
<div style={{ height: containerHeight, display: 'flex', alignItems: 'center' }}>
  <BracketMatchCard ... />
</div>
```

Kolumny rund: `flex-col` bez gap (gap zakodowany w wysokości kontenerów).

### 2. Poziome SVG i stały H_GAP

- Kontener flex z `gap: H_GAP` (60px) między kolumnami rund
- SVG warstwa absolutna z `z-index: 0`
- Łamane linie H→V→H: z prawej krawędzi meczu (środek Y) do lewej krawędzi meczu w rundzie N+1 (środek Y)
- `stroke: rgba(255,255,255,0.2)`, `strokeWidth: 1.5`, `fill: none`
- endY bez offsetu 0.3/0.7 — mecze wyśrodkowane, linia idzie do środka

### 3. Z-Index

- SVG warstwa: `z-index: 0`
- Kafelki meczów: `position: relative; z-index: 1` — blur tła kafelka nie rozmywa linii SVG pod spodem

### 4. Safe Area (padding)

- Kontener drabinki: `padding: 24px 40px` — dodatkowy lewy/prawy padding (40px) zapobiega ucinaniu pochylonych krawędzi skew

### 5. Kreseczki kolorystyczne — poza divem unskew

Przenieść kreseczki **przed** div z `skewX(UNSKEW)`. Kreseczka jest bezpośrednim dzieckiem skewed karty, więc naturalnie dziedziczy pochylenie `-7deg`:

```tsx
<div ref={refCallback} style={{ transform: `skewX(${SKEW}deg)`, ... position: 'relative', zIndex: 1 }}>
  {/* Team A row */}
  <div className="flex items-center">
    <div style={{ width: 4, height: 20, background: '#2563eb', flexShrink: 0 }} />
    <div style={{ transform: `skewX(${UNSKEW}deg)` }} className="flex items-center justify-between flex-1 px-2.5 py-1.5">
      <span className="ml-2 ...">TEAM NAME</span>
      <span>#seed</span>
    </div>
  </div>
  {/* Score bar */}
  ...
  {/* Team B row */}
  <div className="flex items-center">
    <div style={{ width: 4, height: 20, background: '#f97316', flexShrink: 0 }} />
    <div style={{ transform: `skewX(${UNSKEW}deg)` }} className="...">
      ...
    </div>
  </div>
</div>
```

### 6. Glassmorphism

- `background: rgba(0, 0, 0, 0.75)`
- `backdropFilter: blur(10px)`
- `border: 0.5px solid rgba(255,255,255,0.15)`
- Live: czerwona ramka + glow (zachowane)

### 7. Typografia

- `ml-2` (8px) gap między kreseczką a nazwą (wewnątrz unskewed diva)
- Nazwy: `uppercase`, `font-bold` (zachowane)
- Nagłówki rund: `mb-0`, biały, `Runda {roundIdx} BO{n}`

### 8. Autoscroll

`SCROLL_SPEED = 0.15` — cykl ~30-40s. Ping-pong RAF loop z 1s delay.

## Pliki do edycji
- `src/components/studio/BracketView.tsx`

