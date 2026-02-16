

# Plan: Ksztalty detached boxow jako naturalne przedluzenie scoreboardu

## Problem

Gdy scoreboard i detached boxy maja ksztalt "rownoleglobok", boxy nie sa naturalnym przedluzeniem paska -- obie krawedzie sa skosne, zamiast tylko krawedz zewnetrzna. Wewnetrzna krawedz (stykajaca sie ze scoreboardem) powinna byc prosta/pionowa, a skosna powinna byc tylko krawedz zewnetrzna.

## Rozwiazanie

### 1. Nowy parametr `boxSkewOffset` w `TeamNameConfig`

Plik: `src/types/broadcast.ts`

Dodanie opcjonalnego pola `boxSkewOffset?: number` (w pikselach, domyslnie 10). Kontroluje jak bardzo skosna jest zewnetrzna krawedz boxa dla ksztaltow "parallelogram" i "skewed".

### 2. Nowa funkcja `getDetachedBoxShapeStyle` w `src/components/ui/shape-picker.tsx`

Funkcja przyjmuje: `shape`, `side` ('left' | 'right'), `skewOffset` (px).

Dla ksztaltow z clip-path generuje warianty dostosowane do strony:
- **Team A (left/lewa strona)**: wewnetrzna (prawa) krawedz prosta, zewnetrzna (lewa) skosna
  - parallelogram: `polygon(Xpx 0, 100% 0, 100% 100%, 0 100%)`
  - skewed: analogicznie
- **Team B (right/prawa strona)**: wewnetrzna (lewa) krawedz prosta, zewnetrzna (prawa) skosna
  - parallelogram: `polygon(0 0, 100% 0, calc(100% - Xpx) 100%, 0 100%)`
  - skewed: analogicznie

Dla hexagon -- wariant z jedna plaska strona (od strony scoreboardu).

Dla sharp, rounded, pill -- bez zmian (delegacja do istniejacego `getShapeStyle`).

### 3. Aktualizacja Overlay.tsx i OverlayPreview.tsx

Zamiana `getShapeStyle(config.teamXName.boxShape)` na `getDetachedBoxShapeStyle(config.teamXName.boxShape, 'left'/'right', config.teamXName.boxSkewOffset)` w renderowaniu detached boxow.

### 4. Suwak "Kat nachylenia" w StyleEditor.tsx

Po komponencie `ShapePicker` w sekcji detached box, dodanie warunkowego suwaka `SliderInput` widocznego gdy `boxShape` to `'parallelogram'` lub `'skewed'`:
- Etykieta: "Nachylenie krawedzi"
- Zakres: 0-40 px
- Domyslnie: 10

### 5. Aktualizacja domyslnych wartosci

W `defaultOverlayConfig` (types/broadcast.ts) dodanie `boxSkewOffset: 10` dla teamAName i teamBName.

W `overlayTemplates.ts` dodanie `boxSkewOffset: 10` do szablonow.

## Pliki do modyfikacji

- `src/types/broadcast.ts` -- nowe pole `boxSkewOffset`
- `src/components/ui/shape-picker.tsx` -- nowa funkcja `getDetachedBoxShapeStyle`
- `src/pages/Overlay.tsx` -- uzycie nowej funkcji dla detached boxow
- `src/components/creator/OverlayPreview.tsx` -- j.w.
- `src/components/creator/StyleEditor.tsx` -- suwak nachylenia
- `src/config/overlayTemplates.ts` -- domyslne wartosci

