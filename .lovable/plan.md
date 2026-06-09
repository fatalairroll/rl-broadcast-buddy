# Studio — Unified Layout (Camera Safe Right 325, centered content)

Cel: ujednolicić layout wszystkich trybów Studio (`next_3`, `bracket`, `recent`, `postgame`) w jednym kontenerze `StudioContentFrame`, z centralizacją w pasie UI (lewa krawędź → 1920−325 = 1595 px szerokości użytkowej), z poprawnym offsetem sidebaru w podglądzie, oraz centralnymi stałymi w `studio-layout.ts`.

## 1. Nowy plik `src/lib/studio-layout.ts`

Jedno źródło prawdy dla wszystkich pomiarów (1920×1080, pomiary operatora):

```ts
// Camera safe zone (operator camera on the right)
export const STUDIO_CAMERA_SAFE_RIGHT = 325;

// Vertical padding (measured on 1920x1080)
export const STUDIO_PADDING_TOP = 92;
export const STUDIO_PADDING_BOTTOM = 95;

// Sidebar (visible only without ?obs=1)
export const STUDIO_SIDEBAR_WIDTH = 112;

// Inner content max widths per mode
export const STUDIO_MAX_WIDTH_DEFAULT = 956;   // next_3, recent, bracket
export const STUDIO_MAX_WIDTH_POSTGAME = 1020; // postgame
```

## 2. Nowy plik `src/components/studio/StudioContentFrame.tsx`

Wspólny wrapper dla wszystkich trybów Studio. Wyśrodkowuje content w pasie UI (lewa krawędź → safe right), zachowuje pionowe paddings i offset sidebaru.

```tsx
import type { CSSProperties, ReactNode } from 'react';
import {
  STUDIO_CAMERA_SAFE_RIGHT,
  STUDIO_PADDING_TOP,
  STUDIO_PADDING_BOTTOM,
  STUDIO_SIDEBAR_WIDTH,
  STUDIO_MAX_WIDTH_DEFAULT,
} from '@/lib/studio-layout';

interface Props {
  children: ReactNode;
  obs: boolean;
  maxWidth?: number;
  style?: CSSProperties;
}

export function StudioContentFrame({
  children,
  obs,
  maxWidth = STUDIO_MAX_WIDTH_DEFAULT,
  style,
}: Props) {
  return (
    <div
      className="relative w-full min-h-screen flex flex-col"
      style={{
        background: 'transparent',
        paddingLeft: 0,
        paddingRight: STUDIO_CAMERA_SAFE_RIGHT,
        paddingTop: STUDIO_PADDING_TOP,
        paddingBottom: STUDIO_PADDING_BOTTOM,
        marginLeft: obs ? 0 : STUDIO_SIDEBAR_WIDTH,
        alignItems: 'center',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}
```

Notatka: `marginLeft = STUDIO_SIDEBAR_WIDTH` w podglądzie (bez `?obs=1`) sprawia, że sidebar (112 px) nie nachodzi na content. W OBS (`?obs=1`) sidebar jest ukryty → `marginLeft: 0`. Strefa kamery (325 px po prawej) jest zachowana w obu trybach.

## 3. `src/pages/StudioRender.tsx`

- Importuj `StudioContentFrame` oraz `STUDIO_MAX_WIDTH_POSTGAME`.
- `const obs = !!params.get('obs')`.
- Opakuj wszystkie tryby jednolicie:
  - `postgame` → `<StudioContentFrame obs={obs} maxWidth={STUDIO_MAX_WIDTH_POSTGAME}><PostgameSummary … /></StudioContentFrame>`
  - `bracket` → `<StudioContentFrame obs={obs}><BracketView … /></StudioContentFrame>`
  - `recent` → `<StudioContentFrame obs={obs}><RecentMatchesTable … /></StudioContentFrame>`
  - `next_3` → `<StudioContentFrame obs={obs}>` zawiera obecny `<div className="flex flex-col gap-4">` z `AnimatePresence`/`MatchCard` (usunąć lokalny `p-4`).
- Usunąć zewnętrzny `<div style={{ marginLeft: !params.get('obs') ? 118 : 0 }}>` — offset sidebaru obsługuje teraz `StudioContentFrame`.
- Sidebar (`fixed top-1/2 left-0`, width 112) bez zmian.

## 4. `src/components/studio/PostgameSummary.tsx`

- Usunąć własny outer `<div className="relative w-full min-h-screen flex flex-col items-start" style={{ paddingLeft: 24, paddingRight: 420, paddingTop: 16, paddingBottom: 16, … }}>`.
- Usunąć lokalną `CAMERA_SAFE_ZONE_PX = 420`.
- Komponent zwraca tylko zawartość: `<PostgameScoreboardHeader … />` + `<PostgameGlassPanel … >grid 10 wierszy</PostgameGlassPanel>`.
- `<StatusMessage>` analogicznie — bez własnego `min-h-screen`; zostaw centrowanie wewnątrz frame.
- Reszta (grid, 10 wierszy PL, liquid glass, biały suwak, sortowanie pairs) bez zmian.

## 5. Inne tryby — sanity check

- `BracketView`, `RecentMatchesTable`, `MatchCard` nie ustawiają własnego `paddingRight`/`marginLeft`/safe zone. Wewnętrzne `p-4`/`p-8` zostają (to wewnętrzny rytm zawartości).
- Jeśli `RecentMatchesTable` ma własny `max-w-[1100px]` lub szerszy — usunąć/zmniejszyć: frame i tak ogranicza do 956 px (`maxWidth` prop).

## 6. Bez zmian

- `Relay.tsx`, `usePostgameRelay.ts`, `/v2/overlay`, `ScoreboardV2.tsx`, Supabase, kontrakt JSON.
- Sidebar width (112 px), poll button hover, `?obs=1` hide logic.
- Logika danych, sortowanie, 10 wierszy PL, liquid glass, biały suwak.

## 7. Definition of Done

- Wszystkie tryby używają `StudioContentFrame` — jedno źródło layoutu.
- Pasek UI: lewa krawędź → 1595 px (1920 − 325). Prawe 325 px puste (kamera operatora) w każdym trybie.
- Content wyśrodkowany w pasie UI (`margin: 0 auto`, max‑width 956 px dla next/recent/bracket, 1020 px dla postgame).
- Pionowy padding: 92 px top, 95 px bottom.
- Podgląd bez `?obs=1`: content przesunięty o 112 px (sidebar nie nachodzi).
- `?obs=1`: sidebar ukryty, `marginLeft: 0`, OBS transparent.
- Stałe wyłącznie w `src/lib/studio-layout.ts`.

## 8. Jawny zakaz

- Brak zmian live overlay `/v2/overlay` i `ScoreboardV2`.
- Brak zmian relay / Supabase / kontraktu JSON.
- Brak powrotu do dwóch ekranów postgame.
- Brak rozproszonych stałych layoutu (wszystko z `studio-layout.ts`).
