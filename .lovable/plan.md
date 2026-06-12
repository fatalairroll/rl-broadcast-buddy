# Plan naprawczy v2 — Sharp Liquid Glass (rev. 2)

Zakres: wyłącznie tryb `theme === 'sharp-glass'`. Tryb `standard` bez zmian. Dane, hooki, OCR, Relay, /v2, Creator, scroll-anchor v2 i okno 3 rund — nietykane.

## 1. POSTGAME

Pliki: `PostgameScoreboardHeader.tsx`, `PostgameShared.tsx`, `PostgameSummary.tsx`.

### 1a. Nagłówek — usunięcie chipów A/B
- Dodać stałą `const SHOW_TEAM_LOGOS = false;` w `PostgameScoreboardHeader.tsx`.
- W `GlassHeader` chipy A i B owinąć `{SHOW_TEAM_LOGOS && ...}` — kod zachowany.
- Pierwszy widoczny element (`glassBarBlue` z nazwą A) dostaje `chamferLeft(10)`; ostatni (`glassBarOrange` z nazwą B) — `chamferRight(10)`.
- Struktura: `[name A][score A][score B][name B]`, gap 4 px.

### 1b. Statystyki — wiersz [panel][etykieta][panel]
Nowy komponent `PostgameTeamBarRowGlass` w `PostgameShared.tsx`:

```text
┌──────────────────┬────────┬──────────────────┐
│ panel L (val A)  │ LABEL  │ panel R (val B)  │   height 38, gap 4
└──────────────────┴────────┴──────────────────┘
       [pasek proporcji 3px — opcjonalnie]
```

- `blueWins/orangeWins/tie` z porównania wartości.
- Panel L: zwycięski → `glassBarBlue`; inaczej `glassBarDead`. Wartość `glassName`, `fontSize: 19`, `justify: flex-end`, `paddingRight: 16`. Przegrana: `color: rgba(255,255,255,.4)`. Remis: oba `glassBarDead`, oba białe.
- Panel R: analogicznie z `glassBarOrange`, `justify: flex-start`, `paddingLeft: 16`.
- Etykieta: width 108, `glassStatCenter` + górny accent `glassStatCenterAccent`, tekst `glassLabel` 10.5, center.
- Sweep + `glassContentLayer` w każdym panelu.
- Pasek proporcji pod wierszem: 3 px, segmenty `#00B2FF`/`#F95F02`, bez thumba, bez radius. Gdy `total === 0` — ukryty.
- `isFirst`/`isLast` (z indeksu): chamferLeft(8) / chamferRight(8) na L/R; środkowe wiersze proste.

W `PostgameSummary.tsx`: dla glass zamiast `PostgameTeamBarRow` używać `PostgameTeamBarRowGlass` z `isFirst`/`isLast`. Kolumny graczy bez zmian.

## 2. RECENT

Plik: `RecentMatchesTable.tsx` (tylko `isGlass`).
- `GLASS_ROW_H = 43` (−10% z 48), `style={{ height: GLASS_ROW_H }}` na każdym wierszu w glass.
- Font nazwy: 17. Cyfry score: 22.
- Gap między wierszami: 4 px.
- Twarde N: `ResizeObserver` na kontenerze + nagłówku → `N = Math.max(0, Math.floor((availableH - headerH) / (GLASS_ROW_H + 4)))`. `matches.slice(0, isGlass ? N : matches.length)`. Stan początkowy `N = matches.length` przed pomiarem.

## 3. BRACKET

Plik: `BracketView.tsx`. W `studio-glass-theme.ts` DODAĆ (bez zmiany istniejących wartości): `BRACKET_TOP_OFFSET`, `PAN_SPEED_PX_S = 35`.

### 3a. Karta meczu (glass) — `BracketMatchCardGlass`
```text
[chip 28×TEAM_ROW_H][pasek nazwa flex-1][score 36]
[chip 28×TEAM_ROW_H][pasek nazwa flex-1][score 36]   gap 2
```
- Chip: `glassChip`, skrót drużyny, `glassLabel` ~10.
- Pasek: `glassBarBlue` (góra) / `glassBarOrange` (dół); TBD/przegrany → `glassBarDead` + `glassNameDead`.
- Score: `glassScoreBox`, cyfra `glassScoreDigitWin/Lose`, fontSize 18.
- Pierwszy element wiersza: `chamferLeft(8)`; ostatni: `chamferRight(8)`. Sweep + `glassContentLayer`.
- `CARD_WIDTH = 200`, `H_GAP = 60` (bez zmian).

Etykieta rundy w glass: `glassBarDead + chamferTag` + `glassLabel` 11.5 (zamiast `glassTitleCool`, który rezerwujemy dla tytułów sekcji).

Linie w glass: `LINE_COLOR = 'rgba(255,255,255,.35)'`, `LINE_WIDTH = 1.5`.

### 3b. Kotwiczenie faz
- Pierwsza widoczna kolumna zawsze `slotHeight = MATCH_HEIGHT, alignItems: 'flex-start'` (już tak działa dla `visualRoundOffset === 0`).
- Górny offset kontenera kolumn — `paddingTop: BRACKET_TOP_OFFSET`.
- Brak wywołań `getContainerHeight(roundIdx)` / `getContainerHeight(round_index - 1)` (zakaz z dokumentu vertical-anchor).

### 3c. Auto-pan pionowy (transform, nie scroll)
- W trybie glass wyłączyć `scrollTop`-anim; użyć `transform: translateY(...)` na `containerRef.current`.
- `overhang = containerH - outerH`. Gdy ≤ 0 → `translateY = 0`, brak pętli.
- Pętla rAF: pause-top 3000 ms → zjazd `PAN_SPEED_PX_S = 35` (ease-in-out po 400 ms na końcach, środek liniowy) → pause-bottom 3000 ms → powrót → ...
- Reset do 0 + pauza 2000 ms przy zmianie `startIdx`/`selectedPoolId` (bump `scrollGenerationRef`).
- Outer w glass: `overflow: hidden`, bez `maxHeight: 960`.
- Standard: bez zmian (istniejący `scrollTop`-anim zostaje).

## 4. MATCHCARD

Plik: `MatchCard.tsx` (tylko glass).

### 4a. TeamBanner — szerokość
**Sztywne `width: 360` px** (deterministyczne, nie 80% rodzica — uniezależnia od ewentualnych zmian kontenera). Wycentrować względem kolumny drużyny (`marginLeft/Right: 'auto'`). Panele graczy 160×320 bez zmian.

### 4b. Górna belka — `chamferTag` × 3
W `HeaderPanel` (glass):
- Lewy (`Runda X Mecz Y`): `glassBarDead + chamferTag`, `glassLabel` 10.5, h=28.
- Środkowy ("WKRÓTCE"): `glassScoreBox + chamferTag`, tekst `glassScoreDigitWin` fontSize 13 (wyróżnienie materiałem + glow, nie kształtem), h=28.
- Prawy (`Format BOx`): `glassBarOrange + chamferTag`, `glassLabel` 10.5, h=28.
- Wszystkie: gap 8 px, sweep + `glassContentLayer`.

`glassTitleCool/Warm` (chamferTitle) zarezerwowane dla tytułów sekcji — nie używać w belkach.

## Definition of Done

- [ ] Postgame: brak chipów A/B (flaga `SHOW_TEAM_LOGOS = false`); statystyki w układzie [panel][etykieta][panel]; pasek proporcji 3 px bez thumba.
- [ ] Recent: wysokość wiersza 43 px, gap 4 px; `slice(0, N)` z pomiarem; żaden wiersz nie jest przycięty.
- [ ] Bracket: karty [chip][pasek][score] w kolumnach; pool 2 startuje na identycznej wysokości px co pool 1 (test zrzutu); auto-pan na `translateY` 35 px/s z pauzą 3 s; wyłączony gdy treść mieści się.
- [ ] **Bracket interakcja osi**: przełączenie okna rund (poziome, scroll-anchor v2) działa poprawnie przy aktywnym pionowym `translateY` — przy zmianie `startIdx` pan resetuje się do góry, pauzuje 2 s i wznawia pętlę. Brak desyncu, brak utraty kotwicy poziomej, brak akumulacji `translateY` między fazami.
- [ ] MatchCard: TeamBanner **sztywne `width: 360 px`** w glass; górna belka — trzy elementy `chamferTag`, h=28, gap 8 px, identyczna geometria.
- [ ] Tryb standard: bez regresji.
- [ ] TS/lint bez błędów.

## Czego nie ruszamy
- Wartości istniejących tokenów w `studio-glass-theme.ts` (dozwolone tylko DODANIE: `BRACKET_TOP_OFFSET`, `PAN_SPEED_PX_S`).
- Dane / hooki / Relay / OCR / /v2 / Creator / scroll-anchor v2 (poziome okno 3 rund — logika doboru `startIdx` bez zmian).
- Tryb standard w żadnym z 4 plików.
