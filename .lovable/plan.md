

# Plan: Drzewko turniejowe (Bracket View) w stylu RLCS

## Cel

Przebudowa `BracketView` z prostego layoutu kolumnowego na pełne drzewko turniejowe z łącznikami SVG, pochylonymi blokami meczów i stylem spójnym z tabelą zakończonych meczów.

## Zmiany — `src/components/studio/BracketView.tsx`

Pełne przepisanie komponentu. Nowa struktura:

### Blok meczu (`BracketMatchCard`)
- Kontener z `skewX(-7deg)`, `backdrop-filter: blur(12px)`, ciemne tło gradientowe
- **Górny pasek** — Team A: biały font-esports, `border-left: 3px solid #2563eb` (niebieski)
- **Dolny pasek** — Team B: biały font-esports, `border-left: 3px solid #f97316` (pomarańczowy)
- **Centralny element wyniku** pomiędzy teamami — pionowy blok z neonowymi paskami (niebieski/pomarańczowy) i wynikiem `score_a : score_b`, identyczny styl jak w `RecentMatchesTable`
- Drużyna która odpadła (przegrała) — `opacity: 0.4` na nazwie
- Mecz live — czerwony border + shadow

### Layout drabinki
- Rundy rozmieszczone w kolumnach od lewej do prawej
- Nagłówek rundy: `skewX(-7deg)`, font-esports, uppercase, tracking
- Mecze w każdej rundzie wycentrowane pionowo z rosnącym `gap` (podwajany z każdą rundą) aby wizualnie tworzyć drzewko
- Kontener główny: `overflow-x-auto` dla przewijalności horyzontalnej

### Łączniki SVG
- Warstwa SVG `position: absolute` nad całym drzewkiem
- Po renderze: obliczenie pozycji bloków meczów przez `useRef` + `useEffect`
- Linia od środka prawej krawędzi meczu → do środka lewej krawędzi meczu w następnej rundzie
- Kolor linii: kolor drużyny zwycięzcy (#2563eb lub #f97316), szary gdy mecz nie rozegrany
- Efekt glow: `filter: drop-shadow(0 0 4px color)`
- Kształt: łamana linia (horizontal → vertical → horizontal) rysowana `<path>` z zaokrągleniami

### Technikalia
- `useRef` na kontenerze + refs na każdy blok meczu (Map po `match_id`)
- `useEffect` + `ResizeObserver` do przeliczenia pozycji łączników
- Logika łączenia: mecz w rundzie N łączy się z meczem w rundzie N+1 na podstawie `match_index` (mecze 0,1 → mecz 0 w następnej rundzie, mecze 2,3 → mecz 1 itd.)

## Pliki do edycji
- `src/components/studio/BracketView.tsx` — pełne przepisanie

