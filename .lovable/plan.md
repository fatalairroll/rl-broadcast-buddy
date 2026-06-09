# Postgame — Poprawka 4

Cel: zmieścić tabelę po lewej (kamera operatora po prawej ~420 px), zmniejszyć sidebar Studio, zacieśnić odstępy wierszy, zamienić tekstowy nagłówek na scoreboard‑style (skewowane kafle wyniku + „PODSUMOWANIE” w środku).

## 1. Nowy plik `src/components/studio/PostgameScoreboardHeader.tsx`

Inline scoreboard (bez `position: absolute`, bez kontekstu bounds — tylko skopiowane style z `ScoreboardV2`).

- Props: `teamNames {blue, orange}`, `blueScore`, `orangeScore`.
- Layout: flex row, `align-items: stretch`, gap 0. Trzy kafle skewowane `-15deg`:
  - Blue: 140×100, gradient `linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)`, fontSize 60, font-black, white, glow `0 0 18px rgba(37,99,235,0.55)`.
  - Środek: 260×100, `background: rgba(0,0,0,0.85)`, border-y `2px rgba(255,255,255,0.1)`, treść „PODSUMOWANIE” (font‑esports/Rajdhani, uppercase, fontSize 24, letter-spacing 0.22em, color #fff).
  - Orange: lustro blue z gradientem `linear-gradient(135deg,#9a3412,#f97316,#fb923c)`, glow pomarańczowy.
- Każdy tekst ma counter‑skew `skewX(15deg)` żeby pozostał prosty.
- Pod scoreboardem wiersz nazw drużyn: flex z `justify-content: space-between`, `width = sumOfTiles`, uppercase, font‑esports, fontSize 16, color `rgba(255,255,255,0.85)`, blue po lewej, orange po prawej, margin‑top 6.

## 2. `src/components/studio/PostgameSummary.tsx`

- Usunąć użycie `PostgameSummaryHeader`, zaimportować nowy `PostgameScoreboardHeader`.
- Kontener główny:
  ```tsx
  const CAMERA_SAFE_ZONE_PX = 420;
  <div className="relative w-full min-h-screen flex flex-col items-start"
       style={{ paddingLeft: 24, paddingRight: CAMERA_SAFE_ZONE_PX,
                paddingTop: 16, paddingBottom: 16, boxSizing: 'border-box',
                background: 'transparent' }}>
  ```
  Usunąć `items-center justify-center`, `min-h-screen … gap-8 p-8`, `max-w-[1600px]`.
- Panel: szerokość `w-full` (wypełnia strefę bezpieczną), padding `16px 20px`, margin-top 12.
- Grid wewnątrz panelu:
  - `columnGap: 16`, `rowGap: 4`, `alignItems: 'center'`.
  - Wiersz nicków: `paddingBottom: 4`, margin-bottom 4 (gap nicki → pierwsza stat = ~8 px łącznie).
- `PlayerValuesRow`: usuwamy `text-xl`, zostawiamy `text-base` zawsze (lub `text-sm` gdy `small`), `lineHeight: 1.2`, brak padding pionowego.
- Margines pod nagłówkiem do panelu: 12 px (`marginTop: 12` na panelu).

## 3. `src/components/studio/PostgameShared.tsx`

- **Usunąć** `PostgameSummaryHeader` (nieużywany po zmianie).
- `PostgameTeamBarRow`:
  - Wrapper: `flex flex-col gap-[2px] px-2 py-0` (zamiast `gap-2 px-3 py-1`).
  - Pasek wysokość `10px` (z 12).
  - Etykieta `text-[10px]` (z `text-xs`), tracking `0.2em`.
  - Wartości po bokach `text-base` (z `text-xl`).

## 4. `src/pages/StudioRender.tsx` — mniejszy sidebar

- Sidebar `width: 112`.
- Content `marginLeft: !obs ? 118 : 0`.
- Każdy przycisk: `padding: '10px 6px'`, `fontSize: 10`, `letterSpacing: '0.06em'`.
- Reszta logiki (poll, hover, `?obs=1` ukrywanie) bez zmian.

## 5. Bez zmian

- `Relay.tsx`, `usePostgameRelay.ts`, `/v2/overlay`, `ScoreboardV2.tsx`, Supabase.
- Tryby URL, aliasy, 10 wierszy PL, brak padów, liquid glass, biały suwak.

## 6. Definition of Done

- 3v3: orange w pełni widoczny, prawe ~420 px puste.
- Sidebar ~112 px w podglądzie; `?obs=1` w pełni ukrywa.
- Wiersze wyraźnie ciaśniejsze (rowGap 4 px, brak py).
- Nagłówek: blue tile [wynik] | „PODSUMOWANIE” | orange tile [wynik], skew −15°, pod spodem nazwy drużyn.
- OBS transparent, brak regresji danych.
