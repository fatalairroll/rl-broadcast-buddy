# Naprawy i ulepszenia Overlay V2

## 1. Spójne pozycjonowanie (preview = OBS)

**Problem:** W kreatorze element wygląda inaczej niż w OBS, bo `V2Preview` aplikuje `globalScale` jako transform na wrapperze, a `OverlayV2.tsx` (renderowany w OBS) w ogóle go nie używa. Dodatkowo "0 px" przy kotwicy `top` oznacza obecnie "0 od krawędzi", a użytkownik oczekuje, że `0,0` to ZAWSZE środek ekranu.

**Rozwiązanie:**
- W `src/pages/OverlayV2.tsx` dodać ten sam `transform: scale(globalScale)` z `transform-origin: top left` na wewnętrznym wrapperze 1920x1080, żeby OBS i preview wyglądały identycznie.
- W `src/lib/position-utils.ts` zmienić semantykę: niezależnie od kotwicy, `offsetX/offsetY` traktujemy zawsze jako przesunięcie względem **środka ekranu** (1920/2, 1080/2). Kotwica decyduje tylko o tym, którym punktem elementu (jego lewa/środek/prawa krawędź × góra/środek/dół) "przyklejamy" do tego punktu na ekranie. Dzięki temu `(0,0)` daje element wyśrodkowany na środku planszy bez względu na wybraną kotwicę elementu.
- Zaktualizować defaulty (np. scoreboard `offsetY: -516` zamiast `top:24` żeby trzymać dotychczasowy wygląd) i mapowanie legacy w `mergeV2Config` w `src/types/overlayV2.ts`.

## 2. Wynik serii w kreatorze i overlayu

Dodać nowy element edycji `seriesScore` (BO3/BO5/BO7 kropki) widoczny pod scoreboardem.
- Nowy interfejs `SeriesScoreStyle` w `src/types/overlayV2.ts` (visible, position, dotSize, gap, blueColor, orangeColor, dimColor, skewDeg).
- Nowy komponent `src/components/v2/SeriesScoreV2.tsx` renderujący kropki (wypełnione = wygrane gry, puste = pozostałe). Czyta dane z aktywnej `broadcast_sessions`: `series_type`, `team_a_series_score`, `team_b_series_score`.
- Nowy hook `useBroadcastSeries()` (lub rozszerzenie istniejącego `useBroadcast`) do subskrypcji aktywnej sesji.
- Mock w `src/lib/v2-mock-data.ts` (np. `MOCK_SERIES = { type: 'bo5', a: 2, b: 1 }`).
- Dodać opcję w `ElementListV2`, edytor w `StyleEditorV2`, render w `V2Preview` i `OverlayV2`.

## 3. Usunięcie zbędnych `minWidth`

W `src/types/overlayV2.ts`:
- Usunąć pola `minWidth` z `ScoreSideStyle` (wynik niebieskich i pomarańczowych) i z `TimerStyle`.
- W `src/components/v2/ScoreboardV2.tsx` usunąć `minWidth` ze styli — szerokość będzie wynikać z `paddingX` + treści.
- W `src/components/creator/StyleEditorV2.tsx` usunąć trzy slidery "Min. szerokość" (scoreBlue, scoreOrange, timer).
- `mergeV2Config` zignoruje stare pole `minWidth` (po prostu nie kopiuje go).

## 4. Konfigurowalne statystyki w paskach boosta

Każdy gracz w pasku boosta — przełącznik które statystyki pokazywać.

- W `BoostBarV2Style` zamiast jednego `showStats: boolean` wprowadzić: `stats: { goals: boolean; assists: boolean; saves: boolean; demos: boolean; shots: boolean }` (uwaga: w danych nie ma "bumpów" — mamy `shots`, `demos`. Dodam `shots` jako odpowiednik; jeśli rozumiesz "bumpy" jako coś innego, daj znać przy implementacji).
- Domyślnie: G/A/SV włączone, demos/shots wyłączone.
- W `src/components/v2/BoostBarV2.tsx` renderować tylko zaznaczone statystyki.
- W `StyleEditorV2.tsx` zamiast jednego switcha — pięć switchów (Gole, Asysty, Obrony, Demo, Strzały).
- `mergeV2Config` — migracja: stary `showStats: true` → wszystkie domyślne włączone, `false` → wszystkie wyłączone.

## 5. Konfigurowalne dane w karcie aktywnego gracza

Analogicznie dla `PlayerCardV2`:
- W `PlayerCardV2Style` dodać:
  - `fields: { country: boolean; rank: boolean; mmrWatermark: boolean; photo: boolean }`
  - `stats: { goals: boolean; assists: boolean; saves: boolean; shots: boolean; demos: boolean; boost: boolean }`
- W `src/components/v2/PlayerCardV2.tsx` renderować warunkowo każdą sekcję wg flag.
- W `StyleEditorV2.tsx` dodać sekcje "Pokaż pola" i "Pokaż statystyki" z togglami.
- Zachować backward compatibility w `mergeV2Config` (brak pola → wszystko widoczne).

## Pliki do edycji / utworzenia

Edycja:
- `src/types/overlayV2.ts` — typy, defaulty, migracja
- `src/lib/position-utils.ts` — nowa semantyka offsetów względem środka
- `src/components/v2/ScoreboardV2.tsx` — usunąć minWidth
- `src/components/v2/BoostBarV2.tsx` — konfigurowalne statystyki
- `src/components/v2/PlayerCardV2.tsx` — konfigurowalne pola i statystyki
- `src/components/creator/StyleEditorV2.tsx` — toggle stats, usunąć minWidth, edytor seriesScore
- `src/components/creator/ElementListV2.tsx` — pozycja "Wynik serii"
- `src/components/creator/V2Preview.tsx` — render `SeriesScoreV2`, użyć danych mock series
- `src/pages/OverlayV2.tsx` — globalScale wrapper, render `SeriesScoreV2`
- `src/lib/v2-mock-data.ts` — `MOCK_SERIES`

Nowe:
- `src/components/v2/SeriesScoreV2.tsx`
- `src/hooks/useBroadcastSeries.ts` (lub rozszerzenie `useBroadcast`)

Brak zmian w bazie danych — wszystko mieści się w `overlay_presets_v2.config` (jsonb).
