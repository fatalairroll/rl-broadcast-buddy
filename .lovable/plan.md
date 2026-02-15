
# Plan: Ksztalt boxa nazw druzyn (ShapePicker)

## Opis

Dodanie pola `boxShape` do konfiguracji nazw druzyn, analogicznie do `shape` w scoreboardzie i boostBars. Uzytkownik bedzie mogl wybierac ksztalt detached boxa (ostre, zaokraglone, skosne, kapulka, szescioakat, rownoleglbok).

## Zmiany

### 1. `src/types/broadcast.ts`

Dodanie pola `boxShape?: ElementShape` do interfejsu `TeamNameConfig`. Aktualizacja `defaultOverlayConfig` z wartoscia domyslna `'rounded'` dla obu druzyn.

### 2. `src/components/creator/StyleEditor.tsx`

W sekcji detached box (linia ~437-486), zamiana suwaka "Zaokraglenie boxa" na komponent `ShapePicker` z etykieta "Ksztalt boxa". Usunuecie suwaka `boxBorderRadius` -- zaokraglenie bedzie kontrolowane przez ksztalt (tak jak w scoreboardzie).

### 3. `src/pages/Overlay.tsx`

W renderowaniu detached boxow (Team A ~141-171, Team B ~175-205), zamiana `borderRadius: config.teamXName.boxBorderRadius` na wywolanie `getShapeStyle(config.teamXName.boxShape ?? 'rounded')` -- ta sama funkcja, ktora jest uzywana dla scoreboardu.

### 4. `src/components/creator/OverlayPreview.tsx`

Analogiczna zmiana jak w Overlay.tsx -- uzycie `getShapeStyle` dla detached boxow w podgladzie.

### 5. `src/config/overlayTemplates.ts`

Dodanie `boxShape: 'rounded'` do szablonow teamAName i teamBName.

## Szczegoly techniczne

- Import `getShapeStyle` z `@/components/ui/shape-picker` w Overlay.tsx i OverlayPreview.tsx (jezeli jeszcze nie jest zaimportowany)
- `ShapePicker` jest juz zaimportowany w StyleEditor.tsx
- Pole `boxBorderRadius` pozostaje w typie dla kompatybilnosci wstecznej, ale nie bedzie juz edytowalne -- ksztalt przejmuje kontrole
