# Pełna kontrola pozycji elementów overlaya V2

## Problem

Aktualnie pozycje są częściowo zaszyte w komponentach:
- **Scoreboard** — twardo wycentrowany (`left-1/2 -translate-x-1/2`), edytowalny tylko `topOffset`.
- **Boost stack L/R** — można ustawić `sideOffset` (od krawędzi) i `verticalAlign` (% wysokości), ale nie ma niezależnego X/Y w pikselach ani osobnych ustawień dla lewego i prawego stacka.
- **Karta gracza** — twardo wycentrowana w poziomie, edytowalny tylko `bottomOffset`.
- **Timer** — nie da się przesunąć niezależnie od scoreboarda.

Cel: każdy element ma jednolity model pozycjonowania (anchor + X/Y w px).

## Model pozycjonowania

Wprowadzamy wspólny typ `PositionV2`:

```ts
type AnchorH = 'left' | 'center' | 'right';
type AnchorV = 'top' | 'middle' | 'bottom';

interface PositionV2 {
  anchorH: AnchorH;   // krawędź ekranu, do której liczymy offsetX
  anchorV: AnchorV;   // krawędź ekranu, do której liczymy offsetY
  offsetX: number;    // px, dodatni = w prawo
  offsetY: number;    // px, dodatni = w dół
}
```

Renderer mapuje `PositionV2` na CSS:
```text
left:   anchorH=left   -> left: offsetX
        anchorH=right  -> right: -offsetX
        anchorH=center -> left: 50% + transform translateX(-50% + offsetX)
top:    analogicznie dla anchorV
```

Domyślne ustawienia odtwarzają obecny układ (scoreboard center/top, lewy stack left/middle itd.), więc istniejące presety w bazie nie zmienią wyglądu po `mergeV2Config`.

## Zmiany w schemacie configu (`src/types/overlayV2.ts`)

Dodajemy `position: PositionV2` do:
- `ScoreboardV2Style` — pozycja całego paska (zastępuje `topOffset`, ale `topOffset` zostawiamy jako legacy fallback w `mergeV2Config`).
- `TimerStyle` — **opcjonalne** odpięcie timera od scoreboarda (`detached: boolean`); gdy `detached=false` (domyślnie), timer renderuje się jak teraz wewnątrz scoreboarda.
- `BoostBarV2Style` — rozbicie na dwa osobne pola pozycji: `positionLeft` i `positionRight`. Stare `sideOffset` i `verticalAlign` zostają jako fallback w `mergeV2Config` (mapowane na nowe pozycje).
- `PlayerCardV2Style` — pozycja karty (zastępuje `bottomOffset`, fallback j.w.).

`mergeV2Config` zostaje rozszerzony, żeby presety zapisane przed zmianą działały dalej (deep-merge + mapowanie legacy pól na nowe `PositionV2`).

## Zmiany w komponentach

- `src/components/v2/ScoreboardV2.tsx` — usuwamy `top-0 left-1/2 -translate-x-1/2`, czytamy z `config.scoreboard.position`. Jeśli `config.timer.detached`, timer renderuje się jako osobny element absolutny z własnym `position`.
- `src/components/v2/BoostStackV2.tsx` — przyjmuje `position` z `boostBar.positionLeft` lub `boostBar.positionRight` w zależności od `side`. Zachowujemy logikę `gap` między barami.
- `src/components/v2/PlayerCardV2.tsx` — czyta `c.position` zamiast `bottom-X left-1/2`.
- Nowy helper `src/lib/position-utils.ts` z funkcją `positionToStyle(pos: PositionV2): CSSProperties` używaną przez wszystkie komponenty (DRY + spójność).

## Zmiany w Kreatorze (`src/components/creator/StyleEditorV2.tsx`)

Dodajemy reusable komponent `PositionEditor` z:
- dwa Select-y (Anchor H: left/center/right, Anchor V: top/middle/bottom),
- dwa `SliderInput` (Offset X od -1920 do 1920 px, Offset Y od -1080 do 1080 px).

Wstawiamy go w sekcjach: `scoreboard`, `timer` (z toggle "Odepnij timer"), `boostBar` (dwa bloki: "Pozycja lewy stack" i "Pozycja prawy stack"), `playerCard`.

Stare suwaki `topOffset`, `bottomOffset`, `sideOffset`, `verticalAlign` zostają usunięte z UI (ich rola przechodzi na `PositionEditor`). `mergeV2Config` migruje istniejące presety w locie przy ładowaniu, więc nic nie tracimy.

## Migracja danych

Brak zmian w bazie. Nie ruszamy tabeli `overlay_presets_v2`. Migracja istniejących configów odbywa się client-side w `mergeV2Config`:
- jeśli `scoreboard.position` brak → `{ anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: scoreboard.topOffset ?? 24 }`,
- jeśli `boostBar.positionLeft` brak → `{ anchorH: 'left', anchorV: 'middle', offsetX: boostBar.sideOffset, offsetY: ((verticalAlign-50)/100)*1080 }`,
- analogicznie `positionRight`,
- `playerCard.position` brak → `{ anchorH: 'center', anchorV: 'bottom', offsetX: 0, offsetY: -(bottomOffset ?? 60) }`,
- `timer.detached` domyślnie `false`, `timer.position` używane tylko gdy `detached=true`.

Przy najbliższym zapisie presetu w Kreatorze nowe pola zostaną utrwalone w JSONB.

## Lista plików do edycji

1. `src/types/overlayV2.ts` — typy `PositionV2`, dodanie pól, rozszerzenie `defaultOverlayV2Config` i `mergeV2Config`.
2. `src/lib/position-utils.ts` — **nowy** helper.
3. `src/components/v2/ScoreboardV2.tsx` — pozycjonowanie + opcjonalny detached timer.
4. `src/components/v2/BoostStackV2.tsx` — czyta `positionLeft` / `positionRight`.
5. `src/components/v2/PlayerCardV2.tsx` — pozycjonowanie z `c.position`.
6. `src/components/creator/StyleEditorV2.tsx` — komponent `PositionEditor`, podpięcie do każdej sekcji, usunięcie starych suwaków pozycji.

## Co zostaje jak było

- DnD w podglądzie: **nie**, zgodnie z wcześniejszą decyzją zostajemy przy numerycznym X/Y.
- Realtime sync z `OverlayV2`: bez zmian (dalej działa przez `useActiveV2Config`).
- Mock/Live toggle, presety, gradient/glow editory: bez zmian.
