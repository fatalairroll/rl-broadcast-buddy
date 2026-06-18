# Poprawki NEO-BRUTALISM — studio

Trzy ogniska. Standard, sharp-glass i overlay meczowy v2 — bez zmian (poza wspólną logiką bracketu z pkt 2, regress-test glass obowiązkowy).

Wszystkie widoki neobrutal pozostają w `StudioContentFrame` i respektują `STUDIO_CONTENT_MAX_WIDTH = 956` oraz `STUDIO_CAMERA_SAFE_RIGHT = 450`. Żadnych własnych szerokości > 956 ani gridów wielokolumnowych wypychających poza ten obszar.

---

## 1. Recent — jedna kolumna

Plik: `src/components/studio/RecentMatchesTable.tsx` → `NbRecentMatchesTable`.

Aktualnie: `gridTemplateColumns: '1fr 1fr'`, `height: 'calc(100vh - 220px)'`, `visible = matches.slice(0, maxRows * 2)`. Druga kolumna wjeżdża w strefę kamery.

Zmiana:

- Zamiast `grid` — `flex column` z `gap` (analogicznie do glass: `GLASS_ROW_GAP = 4`, tutaj zachowamy neobrutal `NB_ROW_GAP = 10`).
- Szerokość 100 % (kontener już w `StudioContentFrame` = 956 px max).
- Wysokość wiersza: `NB_ROW_H = 62` (bez zmian).
- Logika `maxRows` jak w glass: `ResizeObserver` na kontenerze, `floor((availableH + gap) / (rowH + gap))`, `visible = matches.slice(0, maxRows)` (już bez `* 2`).
- Wysokość kontenera: dopasować do trybu standard/glass — użyć `height: 'calc(100vh - 220px)'` lub bez stałej, polegając na flex w `StudioContentFrame`. Wybór: `calc(100vh - 220px)`, by zachować spójność z istniejącą logiką pomiaru i nie przycinać dołu.
- Wiersz neobrutal (`NbRecentRow`) — bez zmian wizualnych (NB_ACID u zwycięzcy, blok wyniku z czarnym tłem, NB_DIM u przegranego).
- `motion.div` x-slide jak dotąd.

Test akceptacyjny: porównać liczbę widocznych meczów neobrutal vs standard przy tym samym datasecie (rozdzielczość 1920×1080, `?obs=1`) — neobrutal nie pokazuje mniej niż standard, nic nie wyjeżdża w prawo ani nie jest przycięte u dołu.

---

## 2. Bracket — kotwiczenie pierwszej widocznej rundy od góry

Plik: `src/components/studio/BracketView.tsx`.

Stan obecny: pozycjonowanie slotu liczone z `roundOffset` (indeks W OKNIE) — `visibleRounds.map(([...], roundOffset) => getSlotLayout(roundOffset, cardH))`. Jednak nazwa parametru w `getContainerHeight(absoluteRoundIndex)` myli i sugeruje absolutny indeks; w realiach jest podawany `visualRoundOffset - 1`. Ponadto brak twardego testu, że ŻADNE miejsce nie używa `roundIdx` (klucza `round_index`) do liczenia wysokości/offsetu slotu.

Zmiany:

1. **Audyt i rename**: w `getContainerHeight` i `getSlotLayout` zmienić nazwy parametrów na `windowIdx` (z komentarzem: „indeks rundy w bieżącym oknie 0/1/2, NIGDY absolutny `round_index`"). Potwierdzić w komentarzu, że `roundOffset` z `visibleRounds.map(..., roundOffset)` jest jedynym źródłem prawdy.
2. **windowIdx === 0 → flex-start, height = cardH** — już tak działa (`getSlotLayout(0)`). Doprecyzować w kodzie i utrzymać.
3. **windowIdx ≥ 1 → center, height = getContainerHeight(windowIdx − 1, cardH) bazowane WYŁĄCZNIE na windowIdx**.
4. **`calcLines`**: pozycje liczone z `getBoundingClientRect` — to już layout-based i automatycznie spójne z punktami 1–3. Bez zmian w SVG.
5. **Top offset wspólny dla wszystkich motywów neobrutal/glass**: dla bracketu w trybie neobrutal dodać `paddingTop` o wartości `BRACKET_TOP_OFFSET` analogicznie do glass (lub własna stała `NB_BRACKET_TOP_OFFSET` jeśli wartość ma być różna). To gwarantuje stałą górną Y pierwszej widocznej kolumny — niezależnie czy faza 1 czy faza 2 jest pierwszą widoczną.
6. Reset `containerRef.style.transform` przy zmianie `startIdx` — już jest (`useEffect [startIdx, selectedPoolId]`). Zostawić.

Test akceptacyjny: dwa zrzuty (faza 1 jako pierwsza widoczna, faza 2 jako pierwsza widoczna). Górna krawędź pierwszej kolumny na IDENTYCZNEJ Y. Sprawdzić w obu motywach (neobrutal i glass — regress). Standard bracket — wizualnie bez zmian (nie używa BRACKET_TOP_OFFSET).

---

## 3. Next_3 — najwyższy mecz z panelami graczy

Plik: `src/components/studio/MatchCard.tsx` → `NbMatchView` / nowe komponenty.

Aktualnie wszystkie mecze pokazane jako jednolite wiersze `NbRow`. Wymagamy: główny (najwyższy) mecz = panele graczy + nagłówek + bannery drużyn; pod nim kolejka kolejnych meczów jako wiersze (obecny `NbRow`).

Nowa struktura `NbMatchView`:

```text
┌───────────────────────────────────────────────────────────┐
│  [BLOK: R{x} M{y}]    [BLOK ACID: WKRÓTCE]    [BO{n}]     │  ← NbHeader
├───────────────────────────────────────────────────────────┤
│ [panel A1][panel A2][..]    VS    [panel B1][panel B2][..]│  ← NbPlayerPanels
│ [NB_BLUE: NAZWA A         ]    [NB_ORANGE: NAZWA B       ]│  ← NbTeamBanners
│ [mono · OCZEKUJE / CHECK-IN OK]  [mono · ...              ]│
├───────────────────────────────────────────────────────────┤
│ NASTĘPNE                                                  │
│ [NbRow upcoming #1]                                       │
│ [NbRow upcoming #2]                                       │
└───────────────────────────────────────────────────────────┘
```

Wymiary dopasowane do 956 px szerokości:

- `maxWidth: STUDIO_CONTENT_MAX_WIDTH` (956) zamiast obecnego `maxWidth: 1280` w `NbMatchView`.
- Panel gracza: szerokość `(956/2 − ~80 dla VS) / playersPerTeam − gap`. Dla 2v2: ~190 px, dla 3v3: ~125 px. Wysokość ~260–280 px (skalować odwrotnie, by 3v3 nie wymagał szerszego layoutu).
- VS w środku: blok kwadratowy ~72×72 NB_ACID z czarnym „VS" (NB_FONT 900, 32 px).

`NbHeader(roundIndex, matchIndex, bestOf)`:

- 3 stykające się bloki (margin-right: −3 px), neobrutal w stylu „lewe = NB_WHITE + NB_INK mono, środek = NB_ACID + 'WKRÓTCE' (NB_FONT 900 italic 18 px), prawe = NB_WHITE z 'FORMAT BO{n}' mono".
- `border: NB_BORDER`, `boxShadow: nbShadowSmall` na całości.

`NbPlayerPanel(player, side, mode)`:

- `border: NB_BORDER`, `boxShadow: nbShadow`, `background: NB_WHITE`.
- Górna belka (~36 px): NB_INK tło, biały tekst — nick (`nick_in_game ?? nick`), `NB_FONT 800`, UPPERCASE, `text-overflow: ellipsis`, `font-size` skalowane do liczby graczy (2v2: 14 px, 3v3: 11 px).
- Środek: `RankIcon` rozmiar `xl` (96 px) lub `lg` (64 px) dla 3v3, wycentrowany, bez glow (neobrutal = flat) — pominąć `glowColor`.
- Watermark MMR: duża pionowa cyfra (writing-mode: vertical-rl) w tle, `font-family: NB_FONT`, `font-weight: 900`, `font-size: 92 px`, `color: rgba(17,17,17,.08)`, `position: absolute`, `pointer-events: none`. Pomijać gdy `mmr == null`.
- Dolny pasek (~10 px): pełna szerokość, `background: side === 'a' ? NB_BLUE : NB_ORANGE`.

`NbTeamBanner(name, side, team)`:

- Blok pełnej szerokości połowy (rozciąga się pod całą grupą paneli danej strony).
- `background: NB_BLUE` / `NB_ORANGE`, `color: NB_WHITE`, `NB_FONT 900`, font-size 22 px, UPPERCASE, padding 12px 18px, `border: NB_BORDER`, `boxShadow: nbShadow`.
- Pod bannerem mała etykieta mono: `OCZEKUJE` (NB_DIM) lub `CHECK-IN · HH:MM` (NB_INK) zależnie od `team.checked_in`.

`NbPlayerPanels`:

- `gameMode` z propsów (`'2v2'` → 2 graczy/stronę, `'3v3'` → 3). Adaptacyjnie czytać `match.team_a?.players.length` i `match.team_b?.players.length`.
- TBD: jeśli brak drużyny — pokazać szare panele placeholder w tej samej liczbie co `gameMode`.

`UpcomingQueue` neobrutal:

- Pod bannerami: jeśli `visibleUpcoming.length > 0` — etykieta `NASTĘPNE` (mono, NB_BORDER_THIN) + sekwencja `NbRow` w wersji compact (obecna).
- `NbRow` (kolejka) — bez zmian. Zostawić.
- Etykieta `NASTĘPNE` ma się pojawiać dopiero gdy są realne mecze (już sprawdzone w obecnym kodzie).

Limity:

- Łącznie (header + panele + bannery + 2–3 wiersze kolejki) musi zmieścić się w `STUDIO_STAGE_HEIGHT − STUDIO_PADDING_TOP − STUDIO_PADDING_BOTTOM` = ~1024 px. Wysokości:
  - Header: ~50 px.
  - Panele: 260 px.
  - Bannery: ~78 px (główny 60 + check-in 18).
  - Etykieta + 3× NbRow: ~30 + 3×(60+12) = ~246 px.
  - Razem ~634 px → mieści się z marginesem.

Aktualizacja w `MatchCard.tsx`:

- Usunąć `maxWidth: 1280` z `NbMatchView` → `maxWidth: STUDIO_CONTENT_MAX_WIDTH` (import z `studio-layout`).
- Wydzielić `NbHeader`, `NbPlayerPanel`, `NbPlayerPanels`, `NbTeamBanner` w obrębie tego samego pliku (poniżej `NbRow`).
- Rotacja next_3 w `Studio` / `StudioRender` — bez zmian (`upcomingMatches` rotuje, główny mecz = `match`).

---

## Pliki dotknięte

- `src/components/studio/RecentMatchesTable.tsx` — punkt 1 (refaktor `NbRecentMatchesTable`).
- `src/components/studio/BracketView.tsx` — punkt 2 (rename + opcjonalny top-offset neobrutal).
- `src/components/studio/MatchCard.tsx` — punkt 3 (nowe `NbHeader`/`NbPlayerPanel`/`NbTeamBanner`, refaktor `NbMatchView`).

Nie ruszamy: `StudioContentFrame`, `studio-layout.ts`, `RankIcon`, `useStudioData`, `usePostgameRelay`, Twitch poll, auto-scroll/pan logic poza pkt 2, overlay v2, standard/sharp-glass (poza wspólną logiką bracketu z regress-testem).

## Definition of Done

- Recent neobrutal: 1 kolumna, ≤ 956 px, liczba meczów = standard, brak przycięć.
- Bracket neobrutal i glass: pierwsza widoczna kolumna zawsze od tej samej górnej Y (faza 1 vs faza 2 — identyczne).
- Next_3 neobrutal: główny mecz z panelami graczy (RankIcon + MMR watermark + nick), bannery drużyn w kolorach NB_BLUE/NB_ORANGE, kolejka pod spodem, adaptacja 2v2/3v3.
- Wszystkie 3 widoki w obszarze 956 px treści, strefa kamery wolna, TS/lint czysto.
- Standard i sharp-glass bez regresji wizualnej (manualny diff 4 widoków).
