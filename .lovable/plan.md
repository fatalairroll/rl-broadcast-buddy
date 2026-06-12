
# Plan: GLASS OVERLAY — wariant OPAQUE (aneks, v2)

Modyfikacja zaakceptowanego presetu GLASS OVERLAY w kreatorze v2. Studio i inne presety — nietknięte. Dodajemy nowe tokeny "opaque glass" i przebudowujemy trzy komponenty presetu, aby były w 100% kryjące i zakrywały natywny HUD gry RL.

**Korekta vs poprzednia wersja planu:** rząd 1 scorebara po prawej stronie ścina GÓRNY prawy róg (nie dolny). Cały slab tworzy symetryczny ośmiokąt: górne rogi w rzędzie 1, dolne w rzędzie 2 — bez prześwitów na stykach.

## 1. Nowe tokeny — `src/lib/studio-glass-theme.ts` (tylko DODAJEMY)

Dopisać na końcu pliku nową sekcję `OPAQUE` — nic istniejącego nie ruszamy:

- `opaqueBarBlue`, `opaqueBarOrange`, `opaqueDark` — pełne gradienty (alpha=1), border + borderTop/borderBottom, inset shadow (highlight + głębia).
- `fakeRefractionBlue/Orange/Dark` — warstwa malowana radial-gradientami symulująca refrakcję.
- `opaqueCornerSpec` — refleks narożny (wypukłość) do skrajnych segmentów.
- `opaquePillBlue/Orange/Empty` — pigułki serii w wariancie opaque.
- **Nowe helpery chamfer dla rzędu 1 scorebara (tną tylko górne rogi):**
  ```ts
  export const chamferTopLeft = (px = 12): CSSProperties => ({
    clipPath: `polygon(${px}px 0, 100% 0, 100% 100%, 0 100%, 0 ${px}px)`,
  });
  export const chamferTopRight = (px = 12): CSSProperties => ({
    clipPath: `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`,
  });
  ```
  Istniejące `chamferLeft/Right` (tnące pary góra-lewo + dół-lewo / góra-prawo + dół-prawo) zostają nietknięte — używają ich inne komponenty.

Kolejność warstw w każdym opaque-panelu (od spodu):
1. baza `opaque*`
2. `fakeRefraction*`
3. `glassSpecularSweep` (istniejący)
4. opcjonalnie `opaqueCornerSpec` na skrajnym segmencie
5. treść z `glassContentLayer` (zIndex 2)

W komponentach opaque NIE używamy `backdropFilter` ani `WebkitBackdropFilter`.

## 2. Typy presetu — `src/types/overlayV2.ts`

Rozszerzyć `scoreboard` o opcjonalne pola:
- `coverWidth?: number` (default 620)
- `coverHeight?: number` (default 104, suma: rząd1 66 + rząd2 38)

`mergeV2Config` musi domyślać oba pola, by sceny istniejące zachowały kompatybilność. Pola wykorzystywane wyłącznie przez `theme: 'glass'`.

## 3. Scorebar — `src/components/v2/glass/GlassScorebar.tsx`

### Geometria
- Pozycja domyślna presetu: `anchorV: 'top'`, `offsetY: 0`.
- Wymiary: `coverWidth × coverHeight` z configu (domyślnie 620×104).
- Rząd 1: 66 px; rząd 2: `coverHeight - 66`.
- Szerokości segmentów rzędu 1 (baza dla 620): nazwa A | wynik A 58 | zegar 116 | wynik B 58 | nazwa B (nazwy dzielą resztę po równo).

### Rząd 1 — chamfery (KOREKTA)
- Pasek A (blue, lewa skrajna): `chamferTopLeft(12)` — ścina TYLKO górny-lewy róg.
- Pasek B (orange, prawa skrajna): `chamferTopRight(12)` — ścina TYLKO górny-prawy róg.
- Segmenty środkowe (wyniki, zegar): bez clip-path.
- Skutek: rząd 1 ma proste krawędzie dolne na całej szerokości → idealny styk z rzędem 2, brak trójkątnych prześwitów.

### Rząd 1 — treść
- Nazwy: `glassName` 27 px; blue left-align (padding 0 14 0 22), orange right-align (padding 0 22 0 14).
- Wyniki: 34 px; prowadzący `glassScoreDigitWin`, przegrywający `color: rgba(255,255,255,.30)` bez glow; remis → oba `win`.
- Zegar: 30 px, sam czas; bordery boczne `1px rgba(255,255,255,.14)`. BEZ podlinii "Mecz {n} · BO{x}".
- `opaqueCornerSpec` na pasku A (`left:-8%`) i lustrzanie na pasku B (`left:auto; right:-8%`).

### Rząd 2 — domknięcie + seria
- Pojedynczy slab `opaqueDark` na pełną szerokość, `borderTop: 'none'` (styk z rzędem 1 bez szwu).
- Dolne narożniki fazowane obustronnie, górne proste:
  ```
  clip-path: polygon(
    0 0, 100% 0,
    100% calc(100% - 12px), calc(100% - 12px) 100%,
    12px 100%, 0 calc(100% - 12px)
  )
  ```
- Cała sylwetka slabu = symetryczny ośmiokąt: 4 ścięcia (2 góra w rz. 1 + 2 dół w rz. 2), żadnych prześwitów.
- Zawartość (flex row, gap 18, center):
  `MMRIVALS` (glassLabel 10 px, rgba(255,255,255,.6)) · pigułki `opaquePill*` (liczba = BO, kolejność blue-wins → orange-wins → empty) · `Mecz {n} · BO{x}` (glassLabel 10 px).
- Sweep w rzędzie 2: height 30%.

## 4. Boost panels — `src/components/v2/glass/GlassBoostPanel.tsx`

- `glassBarBlue/Orange` → `opaqueBarBlue/Orange`; `glassScoreBox` → `opaqueDark`.
- Dodać warstwę `fakeRefraction*` nad bazą, pod fill/sweep.
- Kolejność: baza → fakeRefraction → fill (`glassBoostFill*` bez zmian) → sweep → treść.
- Brak `backdropFilter`.
- Stany `<10` (critical red fill) i `=100` (gold digit) — bez zmian.
- Chamfery wewnętrzne (`chamferLeft/Right(10)` istniejące): bez zmian — rzędy boostu mają inną geometrię niż scorebar, oba rogi po jednej stronie ścinają się celowo (nie ma drugiego rzędu pod spodem).
- Pozycje, wymiary, lustrzaność — bez zmian.

## 5. Karta zawodnika — `src/components/v2/glass/GlassPlayerCard.tsx`

- Pozycja domyślna w `GLASS_OVERLAY_CONFIG.playerCard.position`: `anchorH: 'left'`, `anchorV: 'bottom'`, `offsetX: 24`, `offsetY: 64`.
- Wewnątrz karty:
  - pasek drużyny `glassBar*` → `opaqueBar*` + `fakeRefraction*`.
  - box rangi / box "GOL!" `glassScoreBox` → `opaqueDark` + `fakeRefractionDark`.
  - kicker nad kartą: wyrównany do lewej.
  - odłamki pod kartą: `justifyContent: 'flex-start'`, marginLeft 2 px.
- Logika stanów (idle / GOL / bez rangi), `framer-motion` (translateY 180 ms, hold 6000 ms), detektor gola — BEZ ZMIAN.

## 6. Preset — `src/lib/v2-glass-preset.ts`

W `GLASS_OVERLAY_CONFIG`:
- `scoreboard.position` → `{ anchorH:'center', anchorV:'top', offsetX:0, offsetY:0 }`.
- `scoreboard.coverWidth = 620`, `scoreboard.coverHeight = 104`.
- `playerCard.position` → `{ anchorH:'left', anchorV:'bottom', offsetX:24, offsetY:64 }`.
- `seriesScore.visible` pozostaje `false`.

`ensureGlassPreset` jest idempotentne po nazwie — istniejące instancje w DB użytkowników NIE zostaną nadpisane (akceptujemy).

## 7. Czego NIE ruszamy

- Studio (motyw sharp-glass) i jego overlaye.
- Istniejące tokeny w `studio-glass-theme.ts` (`chamferLeft/Right` zostają dla innych komponentów).
- Standardowe komponenty v2.
- Hook `useGoalEventDetector`, logika stanów karty, dane.
- Sceny `theme: 'standard'`.

## 8. Definition of Done

- [ ] Scorebar top:0, 620×104 domyślnie; `coverWidth/coverHeight` edytowalne w configu presetu.
- [ ] Natywny HUD RL (skala 100%, 1080p) całkowicie zakryty.
- [ ] Rząd 1 ścinany TYLKO na górnych rogach (`chamferTopLeft/Right`); rząd 2 ścinany TYLKO na dolnych rogach — sylwetka = symetryczny ośmiokąt, brak trójkątnych prześwitów na stykach.
- [ ] Rząd 2: pigułki + brand MMRIVALS + numer meczu; styk z rzędem 1 bez szwu.
- [ ] Wolnostojący seriesScore nieaktywny w GLASS OVERLAY.
- [ ] Wszystkie panele presetu w 100% kryjące — zero `backdropFilter`, zero alpha w bazach; refrakcja + sweep + edge lighting obecne.
- [ ] Karta zawodnika w lewym-dolnym rogu, kicker i odłamki wyrównane do lewej; stany działają.
- [ ] Pigułki w wariancie opaque.
- [ ] TS/lint czysto; standard i Studio bez regresji.
