
# Plan: preset "GLASS OVERLAY" w kreatorze v2

## Założenia architektoniczne

Kreator v2 działa na sztywnym schemacie `OverlayV2Config` (typy w `src/types/overlayV2.ts`), a presety to wiersze w `overlay_presets_v2` z konfiguracją renderowaną przez `ScoreboardV2 / BoostStackV2 / PlayerCardV2 / SeriesScoreV2 / TeamNameV2`. Spec wymaga zupełnie innego rysunku (chamfery, sweep, GOL-swap, brak boxa przy braku rangi) — niemożliwe do uzyskania samymi polami stylu. Więc dokładamy **przełącznik motywu** w configu i alternatywne komponenty.

Tryb `standard` (dzisiejszy) zostaje bez zmian — istniejące presety/sceny użytkowników nienaruszone.

## Zakres zmian

### 1. `src/lib/studio-glass-theme.ts` — DODAJEMY (bez modyfikacji istniejących wartości)

```ts
export const glassBoostFillBlue = 'linear-gradient(90deg, rgba(0,175,255,.55), rgba(0,220,255,.35))';
export const glassBoostFillOrange = 'linear-gradient(270deg, rgba(255,140,35,.55), rgba(255,190,80,.35))';
export const glassBoostFillCritical = 'linear-gradient(90deg, rgba(255,60,60,.6), rgba(255,120,60,.4))';
export const GOAL_SWAP_MS = 180;
export const GOAL_BANNER_HOLD_MS = 6000;
```

### 2. `src/types/overlayV2.ts` — pole motywu

- Dodać `theme: 'standard' | 'glass'` w `GeneralV2Style` (domyślnie `'standard'`).
- `mergeV2Config` uzupełnia brak pola jako `'standard'` (back-compat dla zapisanych presetów).
- `V2_ELEMENT_LABELS` bez zmian.

### 3. Nowe komponenty prezentacyjne (czytają wyłącznie z `studio-glass-theme.ts`)

#### `src/components/v2/glass/GlassScorebar.tsx`
- 46 px wys., ~560 px szer., wycentrowany u góry (pozycja z `config.scoreboard.position`).
- Układ: `glassBarBlue` chamferLeft(10) z nazwą A → `glassScoreBox` 46 px (wynik A) → `glassScoreBox` 92 px (zegar 22 px + pod spodem `Mecz {n} · BO{x}` 8 px `glassLabel`, boczne bordery 1px rgba(255,255,255,.12)) → `glassScoreBox` 46 px (wynik B) → `glassBarOrange` chamferRight(10) z nazwą B (right-align).
- Nazwy: `glassName` 21 px. Wyniki: `glassScoreDigitWin` u prowadzącego (remis → obaj win), `glassScoreDigitLose` u przegrywającego.
- Pod scorebarem rząd pigułek serii (`gamePillBlue / Orange / Empty`, 26×9 px, gap 4, center), liczba = BO, wypełnienie wg `useBroadcastSeries()`.
- Każdy segment z `glassSpecularSweep` + `glassContentLayer` (zIndex 2).

#### `src/components/v2/glass/GlassBoostPanel.tsx` (`side: 'blue' | 'orange'`)
- Wiersz: 30 px wys., 218 px szer., gap 6 px.
- Niebieski: `glassBarBlue` chamferLeft(10) z warstwą `.fill` `position:absolute; left:0; width:${boost}%` (`glassBoostFillBlue`) **pod** sweepem i nazwą; po prawej `glassScoreBox` 38 px z cyfrą boostu (15 px).
- Pomarańczowy: lustro — chamferRight(10), fill od prawej (`glassBoostFillOrange`), score box po lewej (cyfra na zewnętrznej krawędzi).
- Stany: `boost<10` → fill = `glassBoostFillCritical`, cyfra `#FF7A5C` z glow `0 0 10px rgba(255,90,60,.5)`; `boost===100` → cyfra `#FFD27A` glow `0 0 12px rgba(255,200,90,.6)`.
- **Brak boxów rangi** w wierszach boostu.
- Update boostu: `width` aktualizowany przez React; brak własnego rAF.

#### `src/components/v2/glass/GlassPlayerCard.tsx`
Jeden kontener, dwa stany treści.

**Geometria wspólna:** 430×52 px, kicker nad kartą (tick 18×2.5 px `skewX(-35deg)` w kolorze drużyny + `glassLabel` 10 px, 60% bieli, textShadow `0 1px 8px rgba(0,0,0,.5)`); karta = `[glassScoreBox 84 px chamferLeft(10)] [pasek koloru drużyny chamferRight(10), flex:1, padding 0 18px]`; pod kartą 3 odłamki `skewX(-30deg)` (kolor drużyny + biały) right-align; sweep + zIndex 2.

**Stan IDLE:** w boxie 84 px `RankIcon` (reuse `src/components/studio/RankIcon.tsx`, `size='sm'` z `width/height=30`); pasek: nick `glassName` 23 px + `{mmr} MMR` `glassLabel` 11 px po prawej; kicker = nazwa drużyny gracza.
**Gracz bez rangi (`rank == null`):** boxa nie renderujemy — pasek dostaje OBA chamfery (`chamferLeft+chamferRight`) i zajmuje całą szerokość; żadnych pustych boxów.

**Stan GOL:** ranga znika `translateY(-10px)+fade` ease-in `GOAL_SWAP_MS`, wchodzi `GOL!` `glassScoreDigitWin` 24 px letterSpacing .04em (`translateY(10px)→0+fade` ease-out, `GOAL_SWAP_MS`). Pasek: nick strzelca + `asysta · {nick}` po prawej tylko gdy istnieje. Kicker: `{drużyna} · {czas gola}`. Powrót do IDLE po `GOAL_BANNER_HOLD_MS` tą samą animacją w odwrocie; kolejny gol w trakcie → swap strzelca + reset timera. Animacje wyłącznie `transform/opacity`.

**Widoczność karty:** używamy istniejącego `activeCameraTarget` z `useLiveStatsV2`. Jeśli aktywny gracz istnieje → karta widoczna IDLE. Jeśli nie ma aktywnego gracza, karta jest UKRYTA i pojawia się wyłącznie w stanie GOL (entry `fade + translateY(16px)` 220 ms; podczas trwania pokazuje strzelca; po `GOAL_BANNER_HOLD_MS` znika exitem). Decyzja udokumentowana w PR.

#### `src/components/v2/glass/V2GlassStage.tsx`
Kompozytor renderujący 4 elementy na pozycjach domyślnych presetu (kanwa 1920×1080). Konsumuje `OverlayV2Config` (pozycje edytowalne w kreatorze) + live data.

### 4. Detektor gola — `src/hooks/useGoalEventDetector.ts`

Brak gotowego eventu w `livestats`. Wyprowadzamy:
- Trzymamy ref do poprzedniego `match.team0_score / team1_score` oraz poprzednich `goals` per gracz.
- Inkrement wyniku drużyny → wybieramy stronę.
- Strzelec = gracz tej strony, którego `goals` wzrósł o 1 w tym samym tiku; jeśli brak jednoznacznego → fallback: gracz z najwyższą wartością `goals` po stronie.
- Asysta = gracz tej samej drużyny ≠ strzelec, którego `assists` wzrósł o 1; brak → `null`.
- Zwraca `{ scorerName, assistName, teamSide, scoredAt }` z licznikiem nonce, żeby kolejny gol w trakcie holdu nadpisał stan.

### 5. Integracja z presetem i renderem

#### `src/lib/v2-glass-preset.ts`
- Stała `GLASS_OVERLAY_CONFIG: OverlayV2Config` (na bazie `defaultOverlayV2Config` z `general.theme = 'glass'`) z pozycjami:
  - scoreboard: `top 22, center X` (`anchorV:'top', offsetY: -518`),
  - seriesScore: pod scorebarem (margines 6 px),
  - boostBar.positionLeft: `left 18, top 200` (z anchorV:'top'); positionRight lustro,
  - playerCard: `bottom 120, center X`.
- Helper `ensureGlassPreset(presets, createPreset)` — przy starcie kreatora, jeśli nie istnieje wiersz `name='GLASS OVERLAY'` w `presets`, dodaje go raz przez `createPreset('GLASS OVERLAY', GLASS_OVERLAY_CONFIG)`.

#### `src/pages/Creator.tsx`
- Po załadowaniu `presets` wołamy `ensureGlassPreset` (jednorazowo, idempotentnie po nazwie). Preset pojawia się normalnie na liście wyboru.

#### `src/components/creator/V2Preview.tsx` i `src/pages/OverlayV2.tsx`
- Po wyliczeniu `config` sprawdzamy `config.general.theme`. Gdy `'glass'` → renderujemy `<V2GlassStage … />` zamiast obecnych komponentów; gdy `'standard'` → bez zmian.
- W glass-stage przekazujemy: `match`, `blue`, `orange`, `registryMap`, `activeCameraTarget`, `activePlayer`, `activeRegistry`, `series`, `session.team_a_name/b_name`, `mmrOverride` (do rangi/MMR aktywnego gracza zgodnie z istniejącym mapowaniem MMRIVALS) oraz wynik `useGoalEventDetector`.

### 6. Czego nie ruszamy

- Schemat zapisu/odczytu presetów, `useV2Presets`, `useActiveV2Config` (poza fallbackiem `theme` w `mergeV2Config`).
- Źródła danych (`useLiveStatsV2`, relay, MMRIVALS API, mapowanie graczy).
- Studio i `studio-glass-theme.ts` w zakresie istniejących wartości.
- Standardowe komponenty `ScoreboardV2 / BoostStackV2 / PlayerCardV2 / SeriesScoreV2 / TeamNameV2`.

## Definition of Done

- [ ] Preset "GLASS OVERLAY" widoczny na liście kreatora, ładowalny jednym kliknięciem, z poprawnymi pozycjami domyślnymi.
- [ ] V2Preview (mock + live) i `/v2/overlay` w trybie `theme: 'glass'` renderują `V2GlassStage`; w `'standard'` zachowanie bez zmian.
- [ ] Scorebar zasilany z `game_state` (match/timer/serii); leading score z glow, trailing przygaszony; remis → oba win.
- [ ] Boost: fill wg %, lustrzana strona pomarańczowa, stany <10 i =100; brak rang w wierszach.
- [ ] PlayerCard: idle z `RankIcon` 30 px w boxie 84 px; bez rangi → karta bez boxa (oba chamfery na pasku); gol → swap 180 ms na `GOL!`, strzelec + asysta, powrót po 6 s, kolejny gol resetuje timer.
- [ ] Element "Powtórka" nie istnieje.
- [ ] Tło `transparent` (już zapewnione w `OverlayV2`); animacje wyłącznie `transform/opacity`; weryfikacja w preview 1920×1080.
- [ ] TS/lint czysto; istniejące presety nienaruszone (`mergeV2Config` uzupełnia `theme`).
