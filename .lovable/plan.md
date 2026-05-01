## Cel

Dodać do overlay V2 dwa nowe, niezależnie pozycjonowane elementy: **Nazwa drużyny niebieskiej** i **Nazwa drużyny pomarańczowej**, oraz odpowiednie sekcje w Kreatorze do ich pełnej stylizacji (offsety, padding, kolor, gradient, kształt, font, glow).

## Co zobaczy użytkownik

- W lewym pasku Kreatora (lista elementów) pojawiają się dwie nowe pozycje:
  - „Nazwa drużyny niebieskiej”
  - „Nazwa drużyny pomarańczowej”
- Po kliknięciu w którąkolwiek z nich pokazuje się pełny edytor stylu z polami: widoczność, pozycja (anchor + offsetX/Y), szerokość/wysokość (auto/min), padding X, padding Y, font + rozmiar + waga, kolor tekstu, tło (jednolity kolor lub gradient), kształt (sharp / rounded / pill / parallelogram / hexagon — taki sam zestaw jak w innych elementach V2), skew, border (kolor + grubość), glow, opacity, max długość / line-wrap, alignment.
- Tekst jest pobierany z `broadcast_sessions.team_a_name` / `team_b_name` (te same pola, które edytuje BroadcastControlsPanel i które auto-uzupełnia loader MMRivals). W trybie `mock` używa stałych „TEAM BLUE” / „TEAM ORANGE”.
- Nazwy drużyn renderują się jako osobne elementy absolutne (nie wewnątrz scoreboardu), więc ich pozycję można dowolnie przesuwać — niezależnie od scoreboardu.

## Zmiany w kodzie

### 1. `src/types/overlayV2.ts`
- Nowy interfejs `TeamNameStyle`:
  - `visible`, `position: PositionV2`
  - `paddingX`, `paddingY`, `minWidth`
  - `fontFamily`, `fontSize`, `fontWeight`, `textColor`, `letterSpacing`, `textAlign`
  - `background: string` (fallback) + `gradient: GradientConfig`
  - `shape: 'sharp' | 'rounded' | 'pill' | 'parallelogram' | 'hexagon'`
  - `borderRadius`, `borderColor`, `borderWidth`
  - `skewDeg`, `glow: GlowConfig`, `opacity`
  - `maxChars` (0 = brak limitu), `uppercase: boolean`
- Dodać `teamNameBlue` i `teamNameOrange` do `OverlayV2Config`.
- Rozszerzyć `V2EditableElement` o `'teamNameBlue' | 'teamNameOrange'` oraz dodać etykiety w `V2_ELEMENT_LABELS`.
- Dodać sensowne wartości domyślne:
  - blue: anchor `left/top`, offsetX ok. -700, offsetY ok. -540, gradient niebieski (taki sam zestaw HSL co `scoreBlue`), shape `parallelogram`, skew -15°.
  - orange: lustrzane (`right/top`), gradient pomarańczowy.
- Uzupełnić `mergeV2Config`, by tworzył domyślne `teamNameBlue/Orange`, gdy zapisana w DB konfiguracja ich jeszcze nie ma (kompatybilność wsteczna).

### 2. Nowy komponent `src/components/v2/TeamNameV2.tsx`
- Props: `name: string | null`, `style: TeamNameStyle`, `team: 'blue' | 'orange'`.
- Renderuje jeden, niezależnie pozycjonowany kafelek (`positionToStyle`) z:
  - zewnętrznym `transform: skewX(...)` + wewnętrznym kontr-skewem na tekście (analogicznie do `ScoreboardV2`),
  - tłem z `gradientToCss(style.gradient, style.background)`,
  - `boxShadow` z `glowToBoxShadow`,
  - kształt mapowany do CSS: `sharp` → 0, `rounded` → `borderRadius`, `pill` → 9999, `parallelogram` → przez skew (już jest), `hexagon` → `clip-path: polygon(...)`.
- Truncate / uppercase wg konfiguracji.
- Jeśli `!visible` lub `name` puste → nic nie renderuje.

### 3. `src/components/creator/V2Preview.tsx`
- Pobrać `session?.team_a_name` / `team_b_name` z `useBroadcast()` (już jest `session`).
- W trybie `mock` użyć `'TEAM BLUE'` / `'TEAM ORANGE'`.
- Wyrenderować `<TeamNameV2 team="blue" name={...} style={config.teamNameBlue} />` i analogicznie dla orange, jako rodzeństwo `ScoreboardV2` (poza nim).

### 4. `src/pages/OverlayV2.tsx`
- Identycznie zamontować `TeamNameV2` z danymi z sesji broadcastu.

### 5. `src/components/creator/ElementListV2.tsx`
- Dodać `'teamNameBlue'` i `'teamNameOrange'` do `ORDER` (np. zaraz po `scoreOrange`).

### 6. `src/components/creator/StyleEditorV2.tsx`
- Nowa gałąź `element === 'teamNameBlue' || element === 'teamNameOrange'`:
  - `Toggle` widoczność,
  - `PositionEditor`,
  - `SliderInput` paddingX (0–80), paddingY (-30–60, jak inne),
  - `FontInput` + rozmiar (16–96), waga (300–900), `ColorPicker` kolor tekstu,
  - `Select` shape (sharp / rounded / pill / parallelogram / hexagon), slider `borderRadius` (0–48),
  - `ColorPicker` tło (fallback) + pełny `GradientEditor` (jak w `scoreBlue`),
  - `ColorPicker` border + slider `borderWidth` (0–6),
  - `SliderInput` skew (-30..30), `SliderInput` opacity (0–1, krok 0.05),
  - `GlowEditor`,
  - `Toggle` uppercase, `SliderInput` letterSpacing, `SliderInput` maxChars (0 = bez limitu).
- Wykorzystać istniejący `GradientEditor` / `ColorPicker` z pliku (już używany dla `scoreBlue/Orange`).

### 7. Brak zmian w bazie
- Nazwy drużyn już istnieją w `broadcast_sessions` (`team_a_name`, `team_b_name`).
- Stylizacja jest częścią `OverlayV2Config`, który jest już zapisywany do `overlay_v2_configs` jako JSON — nowe pola dojdą automatycznie.

## Co celowo poza zakresem

- Logo drużyn (ikony) — ten task dotyczy wyłącznie nazw tekstowych.
- Animacje wjazdu/zjazdu nazw — używamy istniejącego, statycznego renderu (animacje można dodać później bez zmiany API).
- Edycja nazw z poziomu tego edytora — nazwy nadal edytuje się w `BroadcastControlsPanel` (lub auto-uzupełnia z MMRivals).