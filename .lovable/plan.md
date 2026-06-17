# PLAN: preset "NEO-BRUTALISM" — overlay v2

Trzeci, niezależny motyw obok GLASS i Y2K. Płaskie bloki, grube czarne obrysy, twarde przesunięte cienie. Zero gradientów/blura/glow. GLASS i Y2K nietknięte.

## 1. Typy i tokeny

**`src/types/overlayV2.ts`** — `theme: 'standard' | 'glass' | 'y2k'` → `... | 'neobrutal'`. `mergeV2Config` bez zmian. Etykietę boostGauge zostawić ogólną.

**`src/lib/neobrutal-theme.ts`** (nowy) — paleta (`NB_BLUE='#2547FF'`, `NB_ORANGE='#FF5A1F'`, `NB_ACID='#D4FF3F'`, `NB_INK='#111'`, `NB_PAPER='#E8E4DA'`, `NB_WHITE='#fff'`), `NB_BORDER='3px solid #111'`, `NB_BORDER_THIN='2px solid #111'`, `nbShadow='6px 6px 0 #111'`, `nbShadowSmall='4px 4px 0 #111'`, fonty `NB_FONT='Archivo'` (700–900), `NB_MONO='JetBrains Mono'`, bloki `nbBlockPaper/Acid/Blue/Orange` (background + border + boxShadow). **Żadnych gradientów, blura, backdrop-filter, glow.**

**Fonty** — Archivo i JetBrains Mono już są w `index.html` od Y2K; brak zmian.

## 2. Komponenty (`src/components/v2/neobrutal/`)

Reużycie hooków/utili: `useGoalEventDetector`, `positionToStyle`, `RankIcon`, `activeCameraTarget`, `useActivePlayerMmrInfo`.

- **`NbScorebar.tsx`** — pozycjonowany przez `positionToStyle(config.scoreboard.position)`, domyślnie 760×78 (z `coverWidth`/`coverHeight`). Układ: `[blok NB_BLUE: nazwa A][blok NB_ACID: wynik A | biały blok zegara | wynik B][blok NB_ORANGE: nazwa B]`. Bloki nakładają się obrysami (`margin: 0 -3px` na środkowym, `zIndex:2`). Nazwy: NB_FONT 900, biały tekst, 28 px, UPPERCASE, `letter-spacing:-.02em`. Schodkowy font dla nazwy: `≤14→28, ≤20→23, ≤25→18`, `overflow:hidden`, `text-overflow:ellipsis`, `white-space:nowrap`, bloki nazw ≥250 px. Wynik: NB_FONT 900, 40 px, czarny prowadzącego, `#888` przegrywającego. Zegar: biały podblok z obrysem, czarne cyfry; pod zegarem `GM{n} · BO{x}` w NB_MONO 8 px. Górna krawędź belki na `y=0`. **Brak pigułek serii, brak "BO5//", brak "MATCH POINT".**
- **`NbBoostStack.tsx`** — wiersz = `nbBlockPaper` (jasny + obrys), nazwa NB_FONT 800 czarna + liczba boostu czarna 900. Pasek wypełnienia: płaski blok koloru drużyny (NB_BLUE/NB_ORANGE) z czarnym obrysem, rośnie od wewnętrznej krawędzi. Stany: `<10` → pasek NB_ORANGE + mała etykieta "LOW"; `=100` → pasek NB_ACID. Lustrzaność stron.
- **`NbPlayerCard.tsx`** — lewy dół, `nbBlockPaper`. Box rangi: kwadrat NB_ACID + obrys, `RankIcon` w środku, rozmiar/offset przez `rankIconSize`/`rankOffsetX/Y` przez margines/wrapper (NIE transform na elemencie motion). Nazwa NB_FONT 900 czarna 24 px UPPERCASE. Pod: `{ranga} · {mmr} MMR` w NB_MONO kolor NB_ORANGE. Swap ranga↔"GOL!" (blok NB_ACID, tekst czarny 900) przez `useGoalEventDetector`. Brak rangi → bez kwadratu.
- **`NbBoostGauge.tsx`** — koło `NB_PAPER` + `NB_BORDER` + `nbShadow`. SVG `rotate(-90deg)`: tor `stroke:rgba(17,17,17,.15)`, `strokeWidth:10`, `r=size/2-16`; wypełnienie **płaski kolor** drużyny (NB_BLUE/NB_ORANGE), `strokeLinecap:'butt'`, `transition:stroke-dashoffset .12s linear`. Środek: cyfra NB_FONT 900 czarna `size*0.32`; `BOOST` w NB_MONO czarne `size*0.05`. Stany: `<10` → pierścień NB_ORANGE; `=100` → pierścień NB_ACID. Bez glow.
- **`V2NeobrutalStage.tsx`** — kompozytor o tych samych propsach co `V2GlassStage`/`V2Y2kStage`. Stage bez własnego tła. Każdy blok niesie własne wypełnienie. `{config.boostGauge.visible && <NbBoostGauge ... />}`.

## 3. Wybór motywu w renderze

**`src/pages/OverlayV2.tsx`** i **`src/components/creator/V2Preview.tsx`** — dodać `isNeobrutal = config.general.theme === 'neobrutal'`. Czterodrożny render: `isGlass→Glass`, `isY2k→Y2k`, `isNeobrutal→Neobrutal`, else standard. Reszta bez zmian.

## 4. Ruchome elementy (istniejące pola configu)

Neobrutal czyta: `scoreboard.position` + `coverWidth/coverHeight`, `boostBar.positionLeft/positionRight`, `playerCard.rankIconSize/rankOffsetX/Y`, `boostGauge.visible/size/position`.

**`src/components/creator/StyleEditorV2.tsx`** — rozszerzyć istniejące warunki `isGlass || isY2k` o `|| isNeobrutal` w sekcjach `scoreboard`/`boostBar`/`playerCard`/`boostGauge`. Dla neobrutal pokazywać TYLKO pozycje/rozmiary; ukryć kolory/skew/opacity/font/gradient. `seriesScore`, `teamNameBlue/Orange` ukryte.

## 5. Preset

**`src/lib/v2-neobrutal-preset.ts`** (nowy) — `NEOBRUTAL_PRESET_NAME='NEO-BRUTALISM'`, `NEOBRUTAL_PRESET_VERSION=1`. `NEOBRUTAL_OVERLAY_CONFIG` na bazie `defaultOverlayV2Config`:
- `general.theme='neobrutal'`, `general.presetVersion=1`.
- `scoreboard`: `{anchorH:'center', anchorV:'top', offsetX:0, offsetY:-540}`, `coverWidth:760`, `coverHeight:78`. **Zweryfikować pomiarem `getBoundingClientRect().top===0` w DevTools 1920×1080; korekta w offsetY presetu, NIE w resolverze.**
- `boostBar`: pozycje boczne dostrojone (mierzone w preview, nie placeholdery). Punkt wyjścia: jak glass/y2k (±928/-936, ~middle/top).
- `playerCard.position`: anchor left/bottom, offset 24/64.
- `boostGauge: {visible:true, size:230, position:{anchorH:'right', anchorV:'bottom', offsetX:-936, offsetY:424}}` — dostroić, by zakrywał natywny wskaźnik.
- `seriesScore.visible:false`, `teamNameBlue/Orange.visible:false`, `boostBar.visible:true`, `playerCard.visible:true`.
- `ensureNeobrutalPreset(presets, createPreset, updatePreset)` — analog `ensureGlassPreset`/`ensureY2kPreset`. Bump wersji wymagany przy każdej zmianie configu.

**`src/pages/Creator.tsx`** — w bootstrap useEffect dorzucić `ensureNeobrutalPreset(...)` obok `ensureGlassPreset` i `ensureY2kPreset`.

## 6. Czego NIE ruszać

GLASS (`v2/glass/*`, `v2-glass-preset.ts`, `studio-glass-theme.ts`); Y2K (`v2/y2k/*`, `v2-y2k-preset.ts`, `y2k-theme.ts`); studio i jego overlaye; dane (`game_state`/relay, `BroadcastSession`, `useBroadcast`, `useGoalEventDetector`, `activeCameraTarget`, MMRIVALS, `useActivePlayerMmrInfo`, `useLiveStatsV2`); standard v2; `/studio/render`; transparentność OBS; `ScoreboardBoundsProvider`; resolver `positionToStyle`.

## 7. DoD

- Typ `'neobrutal'`, preset "NEO-BRUTALISM" na liście kreatora (ensure + bump działa).
- `/v2/overlay` z `theme:'neobrutal'` renderuje NeobrutalStage; glass/y2k/standard bez regresji (przełączyć tam i z powrotem).
- **Scorebar top:0 — twardy pomiar geometrii** w DevTools 1920×1080: `getBoundingClientRect().top` ≈ 0 (<1 px). Korekta w `offsetY` presetu, nie w resolverze.
- Nazwa do 25 znaków mieści się (schodkowy font + ellipsis); brak pigułek serii / "BO5//" / "MATCH POINT".
- Bloki: grube czarne obrysy + `6px 6px 0` cienie, ZERO gradientów/blura/glow.
- **TRANSPARENTNOŚĆ OBS**: scena przezroczysta poza blokami (test `/v2/overlay` na czarnym tle — żadnego pełnoekranowego jasnego tła).
- Karta zawodnika: swap ranga↔"GOL!" (limonkowy blok); offset rangi działa PRZED i PO swapie; brak rangi → bez kwadratu.
- Boost stack: paski płaskie; stany `<10` (pomarańcz + "LOW") i `=100` (limonka).
- Boost gauge: okrągły, płaski pierścień (linecap `butt`), obrys + twardy cień; domyślnie prawy dół 230 px zakrywa natywny wskaźnik; stany przez kolor.
- Pozycje boost/gauge dostrojone w preview (sensowny default).
- Edytowalne dla neobrutal: scoreboard (pozycja+cover), boost (pozycje), gauge (pozycja+rozmiar), ranga (rozmiar+offset). Kolory/font/skew/opacity/gradient ukryte.
- `NEOBRUTAL_PRESET_VERSION=1` ustawiony; glass i y2k nietknięte; TS/lint czysto.
