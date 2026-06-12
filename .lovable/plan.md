
# Sharp Liquid Glass — wariant Studio (prop `theme`)

## Cel
Dodać motyw "sharp-glass" obok obecnego "standard" we **wszystkich czterech** overlayach Studio (MatchCard, BracketView, RecentMatchesTable, Postgame). Aktywacja przez Select w Konfiguracji Studio + propagacja przez parametr URL `?theme=glass`. Domyślny wygląd ("standard") bez zmian.

## 1. Tokeny i font
- **Nowy plik** `src/lib/studio-glass-theme.ts` — dokładnie wklejony przez Ciebie kod (typ `StudioTheme`, `glassBar*`, `glassScoreBox`, `glassScoreDigit*`, `glassChip`, `glassSpecularSweep`, `chamfer*`, `glassTitle*`, `GLASS_FONT`, `glassName*`, `glassLabel`, `glassStatCenter*`, `gamePill*`). Wartości bez modyfikacji.
- `src/index.css` — dopisać do istniejącego `@import url(...)` rodzinę **Barlow Condensed** (700/800/900 + italic). Reszta CSS bez zmian.

## 2. Aktywacja motywu (UI + URL)
- `src/pages/Studio.tsx`: w sekcji **Konfiguracja**, **bezpośrednio pod kontrolką "Tryb wyświetlania"**, dodać `Select` z opcjami:
  - `Standard` → `theme = 'standard'`
  - `Sharp Liquid Glass` → `theme = 'sharp-glass'`
  Stan trzymany lokalnie (np. `useState<StudioTheme>('standard')`), pamiętany w `localStorage` (klucz `studio.theme`).
- `renderUrl` budowane w Studio.tsx: dopisać `params.set('theme', theme)` (pomijać gdy `'standard'`, by URL został czysty). Iframe podglądu i przycisk "Kopiuj URL do OBS" muszą wynik tej zmiany przenosić.
- `src/pages/StudioRender.tsx`: odczyt z URL:
  ```ts
  const theme: StudioTheme =
    new URLSearchParams(location.search).get('theme') === 'glass'
      ? 'sharp-glass' : 'standard';
  ```
  Przekazanie `theme` do wszystkich czterech overlayów.

## 3. Komponenty — propagacja propa `theme`
Każdy z poniższych dostaje `theme?: StudioTheme` (default `'standard'`). Gałąź `'standard'` = obecny kod 1:1.

### 3a. MatchCard (`src/components/studio/MatchCard.tsx`)
W trybie glass:
- `HeaderPanel`: lewy/prawy chip — `glassTitleCool` / `glassTitleWarm` + `glassLabel`. Środkowy "WKRÓTCE" pozostaje.
- `TeamBanner`: tło `glassBarBlue`/`glassBarOrange` + `chamferLeft(12)`/`chamferRight(12)`, **bez** `transform: skewX(...)`. Nazwa: `glassName`.
- `PlayerPanel`: tło `glassBarBlue`/`glassBarOrange` + `chamferLeft`/`chamferRight`, **bez** zewnętrznego `skewX` i `clipPath: polygon(...)`. `MmrHeroText` pozostaje. Nazwa: `glassName`.
- `TbdPanel`: `glassBarDead` + chamfer + `glassNameDead`, bez skew.
- `UpcomingQueueRow`: tło `glassBarDead`, separator z `glassChip` + `chamferTag`, nazwy `glassName`, **bez** `skewX`.

### 3b. BracketView (`src/components/studio/BracketView.tsx`)
W trybie glass:
- **`SKEW = 0`** dla kart meczu (w standard pozostaje `-7`). Brak `transform: skewX(...)` na żadnym elemencie wiersza.
- Karta meczu: dwa półpaski stron — `glassBarBlue` / `glassBarOrange` (lub `glassBarDead` dla TBD/przegranej), narożniki `chamferLeft(10)` / `chamferRight(10)`, score box: `glassScoreBox` + `glassScoreDigitWin`/`glassScoreDigitLose`.
- Linie SVG, wysokości, scroll-anchor v2, selektor pooli, RAF generation-guard — **bez zmian**.
- Nagłówek kolumny "RUNDA n": `glassTitleCool` + `glassLabel`.

### 3c. RecentMatchesTable (`src/components/studio/RecentMatchesTable.tsx`)
W trybie glass:
- **`SKEW = 0`** (w standard pozostaje `-15`). Brak `skewX` na wierszach, chipach i score boksach.
- Wiersz: `glassBarBlue` po stronie zwycięskiej A, `glassBarOrange` po B, `glassBarDead` po stronie przegranej; `chamferLeft(12)` / `chamferRight(12)`.
- Wynik: `glassScoreBox` + `glassScoreDigitWin/Lose`.
- Typografia: `glassName` / `glassNameDead`.

### 3d. Postgame — **w zakresie**
- `src/components/studio/PostgameShared.tsx`: **dodać** `PANEL_STYLE_GLASS` obok istniejącego `PANEL_STYLE` (NIE usuwać starego). `PANEL_STYLE_GLASS` korzysta z `glassBarDead` jako bazy panelu sekcji. Wspólne helpery (np. wybór koloru strony) zostają.
- `src/components/studio/PostgameScoreboardHeader.tsx`: dodać prop `theme`. W trybie glass — **przebudowa nagłówka** na układ poziomy:
  ```text
  [chip-A] [pasek glassBarBlue: nazwa A] [glassScoreBox: A] [glassScoreBox: B] [pasek glassBarOrange: nazwa B] [chip-B]
  ```
  - Chipy: `glassChip` + `chamferLeft`/`chamferRight`.
  - Paski nazw: `glassBarBlue`/`glassBarOrange` + chamfer, nazwa `glassName`, bez skew.
  - Score boxy: `glassScoreBox`, cyfry zwycięzcy `glassScoreDigitWin`, przegranego `glassScoreDigitLose`. Wartości i logika wyboru zwycięzcy bez zmian.
- `src/components/studio/PostgameSummary.tsx`: dodać prop `theme`, przekazać do `PostgameScoreboardHeader`. Panele sekcji (stats/players) w trybie glass używają `PANEL_STYLE_GLASS`. Tytuły sekcji: `glassTitleCool`/`glassTitleWarm` + `glassLabel`. Brak zmian danych, kolejności, formuł, `usePostgameRelay`.
- W trybie standard — PathGame renderuje się 1:1 jak dziś (nowy `PANEL_STYLE_GLASS` nigdzie się nie pojawia).

`StudioRender.tsx` przekazuje `theme` także do widoku postgame.

## 4. Specular sweep — warstwowanie treści
Wszędzie, gdzie wstawiamy `<div style={glassSpecularSweep} />` jako **pierwsze dziecko** kontenera (`position: relative; overflow: hidden`), pozostała treść (nazwa, cyfry, ikony) musi mieć:
```ts
style={{ position: 'relative', zIndex: 2 }}
```
inaczej sweep przykryje tekst i zabije kontrast. Zapisać to wprost w każdym z czterech overlayów (TeamBanner, PlayerPanel, BracketView match card, RecentMatchesTable row, Postgame header paski + score boxy, panele postgame).

## 5. Brak zmian (utrzymane jak dziś)
- Dane i hooki: `useStudioData`, `usePostgameRelay`, `mmrivals-api`, `pool-utils`, OCR (`game_state`), Relay, Broadcast, Twitch polls, check-in.
- Bracket: scroll-anchor v2, RAF generation-guard, selektor pooli, okno 3 rund, linie SVG.
- Recent: wysokość zredukowana o 15% pod 10 wierszy.
- /v2, Creator, BroadcastControlsPanel, MmrivalsMatchPicker, Auth — nietknięte.
- Tryb standard — bajt w bajt jak teraz.

## 6. Sekcja techniczna

Aktywacja URL i Select:
```ts
// Studio.tsx
const [theme, setTheme] = useState<StudioTheme>(
  () => (localStorage.getItem('studio.theme') as StudioTheme) || 'standard'
);
useEffect(() => localStorage.setItem('studio.theme', theme), [theme]);

const params = new URLSearchParams();
// ...istniejące paramy...
if (theme === 'sharp-glass') params.set('theme', 'glass');
const renderUrl = `/studio/render?${params.toString()}`;
```

```ts
// StudioRender.tsx
const theme: StudioTheme =
  new URLSearchParams(location.search).get('theme') === 'glass'
    ? 'sharp-glass' : 'standard';
```

Aplikacja tokenów:
```tsx
<div style={{ ...glassBarBlue, ...chamferLeft(12) }}>
  <div style={glassSpecularSweep} />
  <div style={{ position: 'relative', zIndex: 2 }}>
    <span style={glassName}>{teamName}</span>
  </div>
</div>
```

Bracket / Recent — sterowanie skew:
```ts
const SKEW = theme === 'sharp-glass' ? 0 : -7;   // BracketView
const SKEW = theme === 'sharp-glass' ? 0 : -15;  // RecentMatchesTable
```

## 7. Definition of Done
- W Studio.tsx pod "Trybem wyświetlania" jest Select **Standard / Sharp Liquid Glass**, jego wartość trafia do `renderUrl` (`?theme=glass`) oraz do iframe podglądu.
- `/studio/render?...&theme=glass` renderuje wszystkie cztery overlaye (MatchCard, Bracket, Recent, **Postgame**) w stylu sharp-glass.
- W trybie glass: w BracketView i RecentMatchesTable **nie ma** `transform: skewX(...)` na wierszach/kartach. W trybie standard skew pozostaje (`-7` / `-15`).
- Treść wewnątrz paneli z sweepem ma `position: relative; zIndex: 2` — tekst i cyfry są ostre, sweep tylko u góry.
- `PANEL_STYLE_GLASS` istnieje obok `PANEL_STYLE` w PostgameShared.tsx; oba nadal w użyciu zależnie od `theme`.
- `PostgameScoreboardHeader` w trybie glass renderuje układ `[chip][pasek][score][score][pasek][chip]`.
- Bez `?theme` lub `theme=standard` — wygląd identyczny jak obecnie (wszystkie cztery overlaye).
- Lint/TS bez błędów.

## 8. Zakaz
- Modyfikacji wartości w tokenach z `studio-glass-theme.ts`.
- Zmian w danych / Relay / OCR / Broadcast / /v2 / Creator / Auth.
- Usuwania starego `PANEL_STYLE` w PostgameShared.
- Zmiany domyślnego (`'standard'`) wyglądu czegokolwiek.
- Pozostawiania `skewX` na kartach w trybie glass.
