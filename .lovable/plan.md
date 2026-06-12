# Plan naprawczy v3 — Sharp Liquid Glass

Zakres: wyłącznie tryb `sharp-glass`. Standard, dane/hooki/relay/OCR/v2/Creator i logika doboru `startIdx` — bez zmian.

## 1. Bracket (`BracketView.tsx`)

### 1a. Usunięcie chipa skrótu
- Z `BracketMatchCard` (gałąź glass) usuwam chip 3-literowy (`GLASS_CHIP_W`) z obu wierszy.
- Nowy wiersz: `[pasek nazwy — flex:1, chamferLeft(8)][score box 36px, chamferRight(8)]`. Nic więcej w wierszu.

### 1b. Kotwiczenie pierwszej widocznej rundy
Diagnoza: `getSlotLayout(roundOffset)` używa już indeksu w oknie, ale cała geometria liczy się z `MATCH_HEIGHT = 72` (wysokość karty standard), podczas gdy karta glass ma `2×28 + 2 = 58 px`. Slot windowIdx 0 ma 72 px z `flex-start` (14 px luzu pod kartą), a kolumny windowIdx 1–2 centrują pary względem wysokości liczonej z 72 px — stąd przesunięcia pionowe i „obniżona" kolumna.

Naprawa:
- Wprowadzam `cardHeight = isGlass ? 58 : MATCH_HEIGHT` i parametryzuję `getContainerHeight`/`getSlotLayout` tą wysokością.
- Audyt wszystkich miejsc liczących wysokości/offsety: `getContainerHeight`, `getSlotLayout`, `minHeight` placeholdera „Poprzednie rundy", sloty w pętli renderującej — wszystkie liczą wyłącznie z `windowIdx` (offset w `visibleRounds`) i właściwej wysokości karty. Żadne wyliczenie nie używa absolutnego `round_index`.
- `calcLines` działa na `getBoundingClientRect` kart, więc po naprawie slotów łączniki liczą się z tych samych windowIdx-owych pozycji co karty.
- Test akceptacyjny: 3 zrzuty (pool 1/okno r1, pool 1/okno r2, pool 2/okno r1) — etykieta rundy i górna krawędź pierwszej karty na identycznym Y (tolerancja 0 px), weryfikacja w preview.

### 1c. Auto-pan pionowy
Diagnoza (potwierdzona przez użytkownika w DevTools na renderze 1920×1080: `outer.clientHeight` ≈ wysokość viewportu overlaya, nie treści): pętla pan istnieje, ale `overhang = container.offsetHeight − outer.clientHeight` wychodzi ≤ 0, bo treść mieści się w viewporcie lub kontener treści nie przekracza outer — pan słusznie się nie uruchamia, ale gdy treść jest dłuższa, `container.offsetHeight` musi to odzwierciedlać. Naprawa obejmuje:
- W glass `outer` dostaje jawny viewport: `flex: 1; minHeight: 0; overflow: hidden` w pionowym flexie zajmującym pełną wysokość ramki overlaya, tak by `clientHeight` zawsze odpowiadał dostępnej przestrzeni, a `container.offsetHeight` — pełnej wysokości treści (weryfikacja w DevTools po zmianie).
- Pętla pan zostaje na `requestAnimationFrame` + `translateY` zgodnie z przepisem: pauza 3 s góra → zjazd 35 px/s z ease-in-out 400 ms na krańcach → pauza 3 s dół → powrót. `overhang` czytany na bieżąco w każdej klatce — polling co 5 s podąża za zmianami treści bez resetu animacji.
- Z deps usuwam `visibleRounds` (nowa referencja przy każdym pollingu = niechciany restart); zostają `isGlass, startIdx, selectedPoolId`. Reset do `translateY(0)` przy zmianie okna/poola przez generation ref — zostaje.
- Test DoD: przełączenie okna rund (poziome) przy aktywnym pionowym `translateY` — pan resetuje się do góry i wznawia pętlę; brak desyncu, brak akumulacji translateY.

## 2. Recent (`RecentMatchesTable.tsx`)

- Usuwam chip „R{n} M{m}" z kolumny score w trybie glass (zostaje w standard) — to on spychał cyfry poza górną krawędź 43 px wiersza.
- Score box glass: pojedyncza linia cyfr, `display:flex; alignItems:center; justifyContent:center; height:100%` — cyfry idealnie wycentrowane w 43 px.
- Audyt wiersza glass: nazwa/seed/MMR jednoliniowe (`truncate`, `whiteSpace: nowrap`) — nic nie generuje drugiej linii.

## 3. Postgame — przeprojektowanie sekcji statystyk

### 3a. Nowy komponent `PostgameStatBarGlass` (w `PostgameShared.tsx`)
Układ RLCS: etykieta nad paskiem, wartości na zewnątrz, dwukolorowy pasek w środku.
- Kontener: 100% szerokości sekcji, wysokość 44 px (etykieta 14 px + pasek 12 px + oddech), wiersze co 10 px.
- Etykieta: `glassLabel`, fontSize 11, letterSpacing .24em, centrowana, `textShadow: 0 1px 8px rgba(0,0,0,.6)`, bez tła.
- Pasek 12 px, szerokość 100% minus miejsce na wartości (`margin: 0 56px`), ostre rogi. Tor: `rgba(8,12,22,.55)` + `border-top: 1px solid rgba(255,255,255,.18)`.
- Wypełnienia: niebieskie od lewej `linear-gradient(90deg,#1B6FF0,#00B2FF)` szer. `bluePct%`; pomarańczowe od prawej `linear-gradient(270deg,#EB4B00,#FF8C23)` szer. `orangePct%`; biały separator 2 px pełnej wysokości w punkcie styku (bez glow). `bluePct = blue/(blue+orange)*100`; suma 0 → pusty tor, separator na 50%.
- Wartości: `glassName` 18 px, kolumny 48 px (wyrównanie right/left). Wygrywający: pełna biel + `textShadow: 0 0 12px rgba(255,255,255,.4)`; przegrywający `rgba(255,255,255,.55)`; remis: obie białe bez glow.
- Stary `PostgameTeamBarRowGlass` z układem [panel][etykieta][panel] usuwam (nieużywany w standard).

### 3b. Struktura widoku glass (`PostgameSummary.tsx`)
- Nagłówek `[nazwa A][score][score][nazwa B]` i pigułki serii — bez zmian.
- W glass: zamiast trzykolumnowego gridu — pionowy stos `PostgameStatBarGlass` (istniejące `ROWS` + agregaty `row.team`/`sumPlayers`), a pod nim dwa kompaktowe panele graczy obok siebie (`PANEL_STYLE_GLASS`, po jednym na drużynę):
  - wiersz na gracza (max 4, wysokość 26 px): nick (`glassName` 14 px) — score — gole — asysty — obrony (`glassLabel` 11 px w kolumnach).
- Trzykolumnowy grid per gracz (`PlayerNamesRow`/`PlayerValuesRow`) pozostaje wyłącznie w gałęzi standard.
- Bez dodatkowego tła za sekcją — czytelność z frosted toru paska i textShadow.

### 3c. Bez zmian
`ROWS`, `sumPlayers`, `formatValue`, `usePostgameRelay`, kolejność statystyk, nagłówek, pigułki.

## Definition of Done
- Bracket: wiersz `[pasek nazwy][score]` bez chipa.
- Bracket: 3 zrzuty kotwiczenia — pierwsza widoczna kolumna zawsze na tej samej współrzędnej Y (pool 1/r1, pool 1/r2, pool 2/r1).
- Bracket: auto-pan działa (pauza 3 s ↔ 35 px/s), restart przy zmianie okna/poola, brak restartu od pollingu danych.
- Recent: cyfry wyniku w pełni widoczne i wycentrowane w 43 px; etykieta rundy usunięta; wiersz jednoliniowy.
- Postgame: paski drużynowe `[wartość|pasek dwukolorowy z białym separatorem|wartość]` z etykietą nad paskiem; panele graczy pod spodem; grid per gracz usunięty z glass.
- Standard bez regresji; TS/lint czysto; weryfikacja wizualna w preview (1920×1080).

## Pliki
- `src/components/studio/BracketView.tsx`
- `src/components/studio/RecentMatchesTable.tsx`
- `src/components/studio/PostgameShared.tsx`
- `src/components/studio/PostgameSummary.tsx`
