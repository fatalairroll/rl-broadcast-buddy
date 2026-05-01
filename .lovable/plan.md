## Cel

1. **Skew dotyczy całego boxa nazwy drużyny** (tła + obramowania + glow) niezależnie od wybranego kształtu, a tekst pozostaje pionowy (counter-skew).
2. **Dodać jawne suwaki Offset X / Offset Y** w sekcji Nazwa drużyny, niezależnie od istniejącego `PositionEditor` (który ustawia anchor + bazową pozycję). Pozwoli to przesuwać element bez ruszania anchorów.

## Zmiany

### 1. `src/components/v2/TeamNameV2.tsx`

- Usunąć warunek `useSkew = style.shape === 'parallelogram'`. Skew **zawsze** aplikujemy na zewnętrznym `motion.div` (box: tło, border, glow, clip-path), counter-skew na wewnętrznym `<span>` z tekstem.
- Dla `shape === 'hexagon'` nadal działa `clip-path` — clip-path jest aplikowany przed transformacją, więc pochylony hex też wygląda poprawnie.
- Dla `shape === 'parallelogram'` `skewDeg` po prostu nadaje pochylenie (zachowanie identyczne jak dziś), ale teraz `sharp`/`rounded`/`pill`/`hexagon` też dają się pochylić.

### 2. `src/types/overlayV2.ts`

- Dodać do `TeamNameStyle` dwa pola: `offsetX: number`, `offsetY: number` (domyślnie `0`). To są **dodatkowe** offsety nakładane na pozycję wyliczoną z `PositionEditor` — fine-tuning bez zmiany anchora.
- Zaktualizować `defaultOverlayV2Config.teamNameBlue` i `teamNameOrange` o `offsetX: 0, offsetY: 0`.
- W loaderze presetów (linie 460–471) zachować backward-compat (spread defaultu obsłuży brakujące pola).

### 3. `src/components/v2/TeamNameV2.tsx` — zastosowanie offsetX/Y

Owinąć element w dodatkowy `<div>` z `transform: translate(${offsetX}px, ${offsetY}px)` **na zewnątrz** kontenera pozycjonującego, żeby nie kolidował ze skewem boxa. Schemat:

```
positionToStyle wrapper
 └─ translate(offsetX, offsetY) wrapper   ← NOWE
     └─ motion.div [skew + bg + border + clip-path]
         └─ span [counter-skew, tekst]
```

### 4. `src/components/creator/StyleEditorV2.tsx`

W `TeamNameEditor`, tuż pod `PositionEditor` (linia 240), dodać dwa suwaki:

```tsx
<SliderInput label="Offset X (fine)" value={value.offsetX} onValueChange={(v) => onChange({ offsetX: v })} min={-960} max={960} unit="px" />
<SliderInput label="Offset Y (fine)" value={value.offsetY} onValueChange={(v) => onChange({ offsetY: v })} min={-540} max={540} unit="px" />
```

Etykieta przy istniejącym suwaku **Skew** pozostaje, ale opisowo zaktualizujemy ją na `"Skew (box)"` żeby było jasne, że pochyla cały kontener.

## Akceptacja

- Ustawienie `shape = rounded` + `skewDeg = -15°` pochyla cały zaokrąglony box, tekst w środku jest pionowy.
- Suwaki Offset X/Y przesuwają nazwę drużyny w obu osiach o zadaną liczbę pikseli, niezależnie od ustawień anchorów.
- Istniejące presety z `parallelogram` wyglądają identycznie jak przed zmianą.
