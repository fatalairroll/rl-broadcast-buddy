# Fixed Box Model Refactor — Overlay Creator

Cel: rozmiar kontenera nadrzędny wobec zawartości. Zmiana fontu/paddingu nigdy nie zmienia fizycznych wymiarów. Pozycjonowanie ujednolicone do jednego systemu Anchor + Offset. Skew i Font per sub-komponent. Wizualna informacja, kiedy parametr jest sterowany przez bazę.

---

## 1. Fixed Dimensions (Box Model)

Każdy komponent dostaje twarde `width` i `height` w px. Padding/font nigdy nie powiększają boxa — operują wewnątrz, a nadmiar tnie `overflow:hidden` + `text-overflow:ellipsis`.

Zmiany w `src/types/overlayV2.ts` (dodanie/wymuszenie pól):

- `ScoreSideStyle`: + `width`, `height` (np. 140×100 px)
- `TimerStyle`: + `width`, `height` (np. 220×100 px) — obecnie szerokość liczona heurystycznie z `paddingX + fontSize*1.2`, do zlikwidowania
- `TeamNameStyle`: + `width`, `height`; usunięcie `minWidth` jako regulatora rozmiaru
- `PlayerCardV2Style`: `width` przemianowane z „Min. szerokość" → twarda szerokość (label w edytorze już mówi „Min. szerokość", to mylące)
- `BoostBarV2Style`: + `barHeight` (wysokość samego paska boost), + `cardHeight` (stała wysokość kafelka gracza). Koniec sumowania nick + bar + stats + gaps.

Zmiany w komponentach renderujących:

- `ScoreboardV2.tsx` — kafelki Blue/Orange dostają `width/height` z configu zamiast wymiarów liczonych z paddingu; wewnątrz `display:flex; align-items:center; justify-content:center; overflow:hidden`. `inlineTimerHalf` zastąpione przez `timer.width/2`.
- `TeamNameV2.tsx` — `width/height` zamiast `minWidth`. Tekst centrowany/justowany wg `textAlign`. Long names: `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`.
- `BoostBarV2.tsx` — kontener ma stały `cardHeight`; pasek boost ma stały `barHeight` (zamiast obecnego `h-2`). Wewnętrzny layout flex z `min-height:0`, przy braku miejsca starsze elementy ukrywane (najpierw stats, potem nick fontSize bez wpływu na box).
- `PlayerCardV2.tsx` — twarde `width × height`, zawartość pozycjonowana absolutnie wewnątrz.

Edytor (`StyleEditorV2.tsx`): dla każdego komponentu dwa nowe SliderInput-y „Szerokość" / „Wysokość". Padding zostaje, ale label dopisany „(wewnątrz boxa)".

## 2. Unified Positioning (Single Source of Truth)

Likwidujemy podwójne offsety. Każdy element ma jeden `PositionV2 { anchorH, anchorV, offsetX, offsetY }`. Usuwane pola:

- `timer.boxOffsetX/Y`, `timer.textOffsetX/Y` → zostaje wyłącznie `timer.position` (gdy `detached`) albo offset względem Scoreboardu (gdy inline).
- `teamName.offsetX/Y` (fine offset) → kasujemy. Nazwa drużyny używa `position` lub trybu „Attach".
- `playerCard.nickOffsetX/Y`, `statsOffsetX/Y`, `rankOffsetX/Y` — zostawiamy tylko jako pozycje WEWNĄTRZ karty (są legitne, bo to layout subelementów wewnątrz fixed boxa). Zmieniamy label na „Pozycja w karcie".

Nowość: `TeamNameStyle.attachToScoreboard: boolean` + `attachOffsetX/Y` + `attachSide: 'inner' | 'outer'`.

- `attachToScoreboard=false` → niezależna pozycja na ekranie (jak teraz).
- `attachToScoreboard=true` → liczona względem fizycznej krawędzi Scoreboardu. Implementacja: `ScoreboardV2` eksponuje obliczone bounds przez Context (`ScoreboardBoundsContext`), a `TeamNameV2` czyta je i pozycjonuje się relatywnie do `left edge - width` (Blue) / `right edge` (Orange) + `attachOffsetX/Y`.

Zmiany w mergeV2Config dodać klucze z domyślnymi wartościami (kompatybilność wstecz).

## 3. Skew & Font Inheritance (Separation)

Dziś `Scoreboard` narzuca `skewDeg` i `fontFamily` całej rodzinie (Blue/Orange/Timer biorą `skewOuter` z parenta). Zmiany:

- Każdy sub-komponent dostaje własny: `skewDeg: number` + `inheritParentSkew: boolean` (default `true` dla wstecznej kompatybilności).
- Każdy sub-komponent dostaje własny `fontFamily` (Blue, Orange, Timer już mają, ale Timer też). Pole „Font" znika ze Scoreboardu lub zostaje jako fallback dla starych presetów.
- W `ScoreboardV2.tsx`: wyliczamy efektywny `skew = inheritParentSkew ? scoreboard.skew : own.skew` per kafelek; counter-skew na `<span>` zawsze równy `-effectiveSkew`.

W `StyleEditorV2.tsx` dla `scoreBlue/scoreOrange/timer`: dodać sekcję „Skew" (slider + checkbox „Dziedzicz po Scoreboardzie") oraz „Font" jeśli brakuje.

## 4. Visual Feedback — DB Overrides (🔒)

Niektóre pola są nadpisywane runtime przez `players_registry` (kolor, logo, nick, kraj, ranga) lub MMRivals (nazwy drużyn, mmr_match_id). W kreatorze użytkownik zmienia je „na sucho" i nie widzi efektu, co wprowadza w błąd.

Nowy komponent `src/components/creator/OverrideLock.tsx`:
```tsx
<OverrideLock active={isOverridden} reason="Nadpisane przez players_registry">
  <ColorPicker ... disabled={isOverridden} />
</OverrideLock>
```
Renderuje 🔒 + tooltip i `pointer-events:none / opacity-50` na dziecku.

Źródło prawdy o override:

- `useBroadcast()` daje `session.mmr_match_id` → jeśli ≠ null, lockuj: `teamNameBlue.fontFamily`/`textColor`? NIE — lockujemy tylko zawartość (nazwy są stringami przychodzącymi z bazy). Dla nazw: blokujemy edycję samej WARTOŚCI nazwy w panelu Broadcast Controls (nie w StyleEditor — tam są wyłącznie style).
- `players_registry` override: `team_color` per gracz nadpisuje `playerCard.blueGradient/orangeGradient` dla aktywnego gracza, więc lockujemy te pola gdy jakiś gracz w aktywnej sesji ma własny `team_color`. Implementacja: hook `useRegistryOverrides(session)` zwracający set kluczy do zablokowania.

Zakres lockowania (priorytet):
- `playerCard.blueGradient/orangeGradient` — gdy registry ma team_color
- `teamNameBlue/Orange.background/gradient` — gdy MMRivals match aktywny i bracket ma kolor klanu
- `playerCard.nickFontFamily` itp. NIE lockujemy (to czysty styling)

## 5. Per-component Priorities (recap)

- **Team Names**: `width` + `textAlign` + `overflow:hidden ellipsis`, koniec `minWidth`.
- **Boost Bars**: `barHeight` jako oddzielny suwak; `cardHeight` stała; nick/stats nie wpływają na geometrię.
- **Player Card**: twarde `width × height`; subkomponenty pozycjonowane absolutnie wewnątrz przez istniejące offsety (które zmieniamy w label „w karcie").

---

## Technical Details

Pliki do edycji:

```text
src/types/overlayV2.ts          + width/height/barHeight/cardHeight, +inheritParentSkew, +attachToScoreboard, mergeV2Config defaults
src/components/v2/ScoreboardV2.tsx   wymiary z configu, własny skew per tile, expose bounds via context
src/components/v2/TeamNameV2.tsx     fixed width/height, attach mode (read ScoreboardBoundsContext)
src/components/v2/BoostBarV2.tsx     fixed cardHeight + barHeight
src/components/v2/PlayerCardV2.tsx   fixed width/height, label „w karcie"
src/components/creator/StyleEditorV2.tsx   nowe slidery, sekcje Skew/Font per sub-element, OverrideLock wrappers, usuń legacy offsety z UI
src/components/creator/OverrideLock.tsx    NEW
src/hooks/useRegistryOverrides.ts          NEW
src/lib/scoreboard-bounds-context.tsx      NEW (React Context)
```

Backwards compat: `mergeV2Config` wypełnia nowe pola wartościami liczonymi ze starego configu (np. `timer.width = paddingX*2 + fontSize*2.4`), więc istniejące zapisane overlay'e nie pękną. Stare offsety usuwane wyłącznie z UI; w typie zostają jako `@deprecated` jeśli któreś presety je trzymają.

Bez zmian DB / RLS / edge functions.
