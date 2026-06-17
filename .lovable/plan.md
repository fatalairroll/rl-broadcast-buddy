## Phase 10 — Motyw "NEO-BRUTALISM" dla STUDIA (4 widoki)

Dodaje trzeci motyw studia (`neobrutal`) obok `standard` i `sharp-glass`. Wszystkie 4 widoki (`next_3`, `recent`, `bracket`, `postgame`) dostają płaską, brutalistyczną warstwę wizualną. Logika danych i overlay meczowy v2 — nietknięte.

### 1. Typ motywu i tokeny

**`src/types/studio.ts`** — rozszerzyć `StudioTheme`:
```ts
export type StudioTheme = 'standard' | 'sharp-glass' | 'neobrutal';
```

**`src/lib/studio-neobrutal-theme.ts`** (nowy) — tokeny wzorem `studio-glass-theme.ts`:
- Kolory: `NB_BLUE=#2547FF`, `NB_ORANGE=#FF5A1F`, `NB_ACID=#D4FF3F`, `NB_INK=#111`, `NB_PAPER=#E8E4DA`, `NB_WHITE=#fff`, `NB_DIM=#999`.
- Obrysy: `NB_BORDER='3px solid #111'`, `NB_BORDER_THIN='2px solid #111'`.
- Cienie: `nbShadow='6px 6px 0 #111'`, `nbShadowSmall='5px 5px 0 #111'`.
- Fonty: `NB_FONT="'Archivo', sans-serif"`, `NB_MONO="'JetBrains Mono', monospace"`.
- `nbSceneBg` — pełne tło `NB_PAPER` + siatka blueprint 48×48 z `rgba(17,17,17,.04)`.
- `nbBlock`, `nbBlockAcid` — bloki bazowe (white/acid + border + shadow).
- ZERO gradientów, blura, backdrop-filter, glow.

Fonty Archivo + JetBrains Mono — dodane już w fazie y2k/neobrutal overlay; sprawdzić `index.html`, w razie czego dorzucić preload.

### 2. Aktywacja motywu

**`src/pages/Studio.tsx`** — w Select "Motyw graficzny" dodać opcję `Neo-Brutalism` → wartość `neobrutal`. `renderUrl` już propaguje `theme`.

**`src/pages/StudioRender.tsx`** — `theme` z URL już parsowany; dołożyć `'neobrutal'` jako kolejną poprawną wartość i przekazać w dół (kontekst/prop tak jak `sharp-glass`).

Sidebar operatora — bez zmian wizualnych.

### 3. Wspólne elementy motywu

**`src/components/studio/StudioContentFrame.tsx`** — rozgałęzić wg motywu: gdy `theme === 'neobrutal'`, wrapper dostaje `nbSceneBg` (pełna płachta + siatka). W `standard`/`sharp-glass` zachowanie bez zmian.

**Nagłówek-sygnatura** (identyczny na 4 widokach, lewy górny róg):
- Kicker `NB_MONO` 13px, `letterSpacing .24em`: `MMRIVALS · {nazwa turnieju}`.
- Tytuł `NB_FONT 900` ~58px UPPERCASE, `letterSpacing -.02em`, `NB_INK`. Tytuły per tryb: `Następne mecze`, `Zakończone mecze`, `Drabinka`, `Podsumowanie`.
- Pasek limonki: `height:10`, `width:160`, `NB_ACID`, `NB_BORDER`, `nbShadowSmall`.

**Tag widoku** (prawy górny róg): `NB_MONO 11px`, tło `NB_ACID`, `NB_BORDER_THIN`, padding `3px 10px`. Wartości: `STUDIO · NEXT/RESULTS/BRACKET/POSTGAME`.

Implementacja nagłówka+tagu wspólna — nowy helper `src/components/studio/NeobrutalHeader.tsx` używany z każdego widoku.

### 4. Widoki

Każdy komponent dostaje gałąź `theme === 'neobrutal'` obok istniejących. Dane, propsy, animacje framer-motion bez zmian.

**`MatchCard.tsx` (next_3)** — wiersz ~74px, bloki stykające się (bez gap):
```
[seed czarny, limonkowa cyfra 24] [nazwa A biały, NB_FONT 900 30 UPPERCASE, dolny border 8 NB_BLUE]
[VS limonka, 22] [nazwa B (do prawej), dolny border 8 NB_ORANGE] [czas czarny: godzina biała 22 + format limonka mono 8]
```
Ellipsis/nowrap dla długich nazw. Rotacja kolejki bez zmian.

**`RecentMatchesTable.tsx` (recent)** — `grid-template-columns: 1fr 1fr; gap:14px`, wiersze ~62px. ZERO skew. Zwycięzca: tło `NB_ACID`. Przegrany: `NB_DIM`. Wynik: środkowy blok 26px z bocznymi borderami. Slice do dostępnej wysokości (jak w glass) — żeby nic nie obcinało.

**`BracketView.tsx` (bracket)** — kolumny rund (gap:40), mecz = blok dwuwierszowy:
- Wiersz A: nazwa + wynik prawo; zwycięzca tło `NB_ACID`; lewy border 6px `NB_BLUE`.
- Wiersz B: jw.; lewy border 6px `NB_ORANGE`; TBD → `NB_DIM`.
- Blok: `NB_BORDER + nbShadowSmall`. Wiersze rozdzielone `border-top: 3px`.
- Etykiety rund: limonkowy tag `NB_MONO` nad kolumną.
- Łączniki `calcLines`: zmiana koloru/grubości na `stroke:#111`, `strokeWidth:3`. Logika pozycji, auto-scroll/auto-pan — bez zmian.

**Postgame (`PostgameScoreboardHeader` + `PostgameSummary` + `PostgameShared`)**:
- Nagłówek ~90px: `[A pełny NB_BLUE, NB_FONT 900 38 biały, NB_BORDER+nbShadow] [wynik NB_ACID, 2× cyfra 46 czarna (przegrany #888), z-index:2] [B pełny NB_ORANGE]`.
- Statystyki — tryptyk per wiersz ~46px, gap 10:
  - Wartość A: blok; strona wygrywająca → pełny `NB_BLUE` biały tekst; inaczej biały blok, czarny tekst.
  - Etykieta: blok `NB_PAPER`, `NB_MONO 14` UPPERCASE `letterSpacing .18em`.
  - Wartość B: analog., wygrywająca → `NB_ORANGE`.
  - Remis → obie strony biały blok.
- Brak pigułek serii, brak glow.
- Statystyki indywidualne graczy: jeśli `standard/glass` je pokazuje, w neobrutal renderować pod tryptykiem prosty rząd zwartych białych bloków (nick + wartości). `RankIcon` bez zmian.

### 5. Czego nie ruszać

- `standard` i `sharp-glass` studia — bez zmian (regress test wizualny po wdrożeniu).
- Overlay meczowy v2 (glass/y2k/neobrutal) — osobny obszar.
- `useStudioData`, `usePostgameRelay`, rotacja next_3, Twitch poll, `VALID_KEY`, `calcLines`, auto-scroll/pan.
- `RankIcon`.

### 6. Definition of Done

- [ ] `StudioTheme` ma `'neobrutal'`; Select w `/studio` ofertuje `Neo-Brutalism`; `?theme=neobrutal` renderuje motyw.
- [ ] 4 widoki w neobrutal: tło + siatka, nagłówek-sygnatura, tag widoku, bloki z `3px` obrysem i `6px 6px 0` cieniem, ZERO gradientów/blura/glow.
- [ ] Długie nazwy: ellipsis/nowrap.
- [ ] Hierarchia win/lose: limonka vs `NB_DIM` czytelna w recent/bracket/postgame.
- [ ] Bracket: grube czarne łączniki; auto-scroll/pan bez zmian.
- [ ] Recent: zero skew, brak przyciętych wierszy (slice do wysokości).
- [ ] `standard` i `sharp-glass` bez regresji.
- [ ] Animacje framer-motion działają jak dotąd.
- [ ] TS/lint czysto.
