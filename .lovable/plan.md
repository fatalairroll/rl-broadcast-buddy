## Cel
Dodać DRUGI motyw overlay v2 — **"Y2K CHROME"** — jako niezależny preset obok GLASS OVERLAY. Hardcodowany styl, ruchome tylko pozycje/rozmiary scoreboardu, boosta i rangi. GLASS i standard nietknięte.

## 1. Typy i tokeny

**`src/types/overlayV2.ts`**
- Linia 200: `theme: 'standard' | 'glass'` → `'standard' | 'glass' | 'y2k'`. `mergeV2Config` bez zmian (defaults pozostają `'standard'`).

**`src/lib/y2k-theme.ts`** (nowy) — paleta (`Y2K_BLUE`, `Y2K_ORANGE`, `Y2K_CHROME` fioletowy, `Y2K_TXT`, `Y2K_DIM`, `Y2K_LINE`), gradienty chrome (`chromeBlue`/`chromeOrange`/`chromeSilver` — jasny szczyt → nasycony środek → ciemny → jasny dół), tła `y2kCoreBg`/`y2kPanelBg`, `y2kBorder`, `y2kGlow`/`y2kGlowSoft`, fonty `Y2K_FONT='Archivo'`/`Y2K_MONO='JetBrains Mono'`, cienie tekstu (`y2kNameShadow`, `y2kChromeTextShadow`, `y2kScoreShadow`), `y2kScanlines` (CSSProperties; aplikowane WEWNĄTRZ paneli, nie pełnoekranowo).

**Fonty** — `index.html`: dodać Google Fonts `Archivo` (600–900) i `JetBrains Mono` (500,700) jeśli brak.

## 2. Komponenty (`src/components/v2/y2k/`)

Wszystkie reużywają tych samych danych/hooków co GLASS (`useGoalEventDetector`, `positionToStyle`, `RankIcon`, `mmrOverride`, `activeCameraTarget`).

- **`Y2kScorebar.tsx`** — pozycjonowany przez `positionToStyle(config.scoreboard.position)`, wymiary z `coverWidth`/`coverHeight`. Układ poziomy `[chrome-blue: nazwa A][core: wynik A | zegar + GM/BO mono | wynik B][chrome-orange: nazwa B]`. Schodkowy font nazwy: `len≤14→27px, ≤20→23px, ≤25→19px`, ellipsis dla >25. Wynik prowadzącego biały + `y2kScoreShadow`, przegrywającego `rgba(255,255,255,.35)`; remis → oba z glow. Zegar w `Y2K_CHROME` z `y2kChromeTextShadow`. Rogi `0 0 8px 8px` (górne proste). **Brak pigułek serii, brak "BO5//", brak "MATCH POINT".**
- **`Y2kBoostStack.tsx`** — wzór `GlassBoostPanel`, paski `chromeBlue`/`chromeOrange`, liczba boostu biała + `y2kScoreShadow`. Lustrzaność stron jak w istniejących.
- **`Y2kPlayerCard.tsx`** — lewy dół, `y2kPanelBg`, box rangi w `chromeSilver` z `<RankIcon>`. **Offset rangi (`rankOffsetX/Y`) aplikowany przez margines/wrapper, NIE przez `transform` na elemencie animowanym framer-motion** (lekcja z fixu glass — swap GOL nadpisuje transform). Pod nazwą `{ranga} · {mmr} MMR`. Swap ranga↔GOL (`useGoalEventDetector`, translateY/opacity 180 ms). Brak rangi → panel bez boxa.
- **`V2Y2kStage.tsx`** — kompozytor o tych samych propsach co `V2GlassStage`. Boost przez `positionToStyle(config.boostBar.positionLeft/Right)`. Bez boost gauge w tej iteracji. **Scanlines aplikowane tylko WEWNĄTRZ paneli (overflow:hidden)** — scena OBS pozostaje transparentna poza panelami.

## 3. Wybór motywu w renderze

**`src/pages/OverlayV2.tsx`** i **`src/components/creator/V2Preview.tsx`** — obok `isGlass` dodać `isY2k = config.general.theme === 'y2k'`. Trójdrożny render: `isGlass → V2GlassStage`, `isY2k → V2Y2kStage`, else → standard. Reszta (skala, mock/live, mmrOverride, `ScoreboardBoundsProvider`) bez zmian.

## 4. Ruchome elementy (przez ISTNIEJĄCE pola configu)

Y2K czyta i honoruje:
- `scoreboard.position` + `coverWidth/coverHeight` — pozycja i rozmiar belki.
- `boostBar.positionLeft/positionRight` — pozycja boosta (lewa/prawa strona).
- `playerCard.rankIconSize/rankOffsetX/rankOffsetY` — rozmiar i offset rangi.

**`src/components/creator/StyleEditorV2.tsx`** — gdy `config.general.theme === 'y2k'`, w sekcjach `scoreboard`/`boostBar`/`playerCard` pokazywać TYLKO kontrolki pozycji/rozmiaru wymienione wyżej; ukryć kolory, skew, opacity, font, gradient. Sekcje `seriesScore`, `teamNameBlue/Orange` ukryte dla y2k.

## 5. Preset

**`src/lib/v2-y2k-preset.ts`** (nowy) — `Y2K_PRESET_NAME = 'Y2K CHROME'`, `Y2K_PRESET_VERSION = 1`. `Y2K_OVERLAY_CONFIG` na bazie `defaultOverlayV2Config`:
- `general.theme = 'y2k'`, `general.presetVersion = 1`.
- `scoreboard`: domyślnie top:0/center, `coverWidth:740`, `coverHeight:76` — **wartości offsetów wyliczone tak, by pierwszy rząd pikseli belki był w y=0 (patrz §7 DoD pkt walidacji)**.
- `boostBar`: domyślnie boczne, **dostrojone** tak, by przy pierwszym otwarciu boost siedział przy lewej/prawej krawędzi obszaru gry (a nie wisiał w środku ani nie wystawał poza 1920×1080). Punkt wyjścia: pozycje glass (±942, -340); jeśli geometria paneli Y2K się różni, skorygować offsety w finalnym presecie.
- `playerCard.position`: anchor left/bottom, offset 24/64.
- `seriesScore.visible:false`, `teamNameBlue.visible:false`, `teamNameOrange.visible:false`, `boostGauge.visible:false`. (Per-preset, nie globalne — nie wpływa na standard/glass; zweryfikować po wdrożeniu przełączaniem motywów w kreatorze.)
- `ensureY2kPreset(presets, createPreset, updatePreset)` — analog `ensureGlassPreset`: tworzy jeśli brak, nadpisuje gdy `presetVersion < Y2K_PRESET_VERSION`. Bump wersji wymagany przy każdej zmianie configu.

**`src/pages/Creator.tsx`** — w istniejącym `useEffect` bootstrapu dorzucić `ensureY2kPreset(...)` obok `ensureGlassPreset(...)` (jeden flag `presetsEnsured`).

## 6. Czego NIE ruszać
GLASS OVERLAY (`v2/glass/*`, `v2-glass-preset.ts`, `studio-glass-theme.ts`); studio i jego overlaye; dane (`game_state`/relay, `BroadcastSession`, `useBroadcast`, `useGoalEventDetector`, `activeCameraTarget`, MMRIVALS, `useActivePlayerMmrInfo`); standard v2; `/studio/render`; transparentność OBS; `ScoreboardBoundsProvider`/skalowanie sceny; resolver `positionToStyle` (semantyka anchor pozostaje bez zmian).

## 7. DoD
- Typ `'y2k'`, preset "Y2K CHROME" dostępny na liście kreatora (ensure + bump działa).
- `/v2/overlay` z `theme:'y2k'` renderuje Y2kStage; glass i standard bez regresji.
- **Scorebar Y2K — twardy pomiar geometrii**: po włączeniu presetu Y2K w preview 1920×1080 (lub `/v2/overlay` rozciągniętym na 1920×1080) zmierzyć w DevTools `getBoundingClientRect().top` korzenia scorebara. Wartość MUSI być `0` (z dokładnością do <1 px po zaokrągleniu transformu). Jeśli `positionToStyle` przy anchorV:'top' daje top edge = `540+offsetY`, to dla offsetY=-540 wychodzi 0 niezależnie od `coverHeight` — ale to ZWERYFIKOWAĆ pomiarem, nie założyć. Jeśli pomiar wskaże inną wartość, skorygować offsetY w preset configu (NIE łatać resolvera ani komponentu).
- **Boost — sensowny default**: po pierwszym wczytaniu presetu Y2K boost lewy i prawy siedzą przy krawędziach obszaru gry, symetrycznie, nie zachodzą na scorebar i nie wystają poza 1920×1080. Wartości w preset configu mają być dostrojone (mierzone w preview), nie placeholdery „do uzupełnienia".
- Nazwa drużyny do 25 znaków mieści się w pasku (schodkowy font + ellipsis dla >25); brak pigułek serii, brak "BO5//", brak "MATCH POINT".
- Karta zawodnika: ranga z `RankIcon`, swap ranga↔GOL działa, brak rangi → panel bez boxa. Offset rangi (X/Y) i rozmiar działają zarówno PRZED jak i PO swapie GOL (offset poza transformem motion — zweryfikować, że po triggerze gola ranga nie wraca do (0,0)).
- Boost: pozycja przesuwalna w kreatorze; scorebar: pozycja + cover edytowalne; pola koloru/skew/opacity/fontu dla y2k ukryte w `StyleEditorV2`.
- `teamNameBlue/Orange.visible:false` w presecie Y2K nie wpływa na inne presety (standard/glass) — przełączyć motyw tam i z powrotem; nazwy drużyn w standardzie nadal renderowane.
- Scanlines tylko wewnątrz paneli; scena OBS transparentna poza elementami (sprawdzić `/v2/overlay` na czarnym tle OBS — żadnego pełnoekranowego wzoru).
- TS/lint czysto.
