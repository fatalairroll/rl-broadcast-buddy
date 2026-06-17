# ANEKS do planu "Y2K CHROME" — Y2kBoostGauge

Rozszerza wdrożony preset Y2K CHROME o okrągły wskaźnik boosta śledzonego gracza. Analogiczny do `GlassBoostGauge`, ale w materiale Y2K (chrom). Reszta planu Y2K bez zmian.

## 1. Nowy komponent — `src/components/v2/y2k/Y2kBoostGauge.tsx`

Wzorowany 1:1 na `src/components/v2/glass/GlassBoostGauge.tsx` — ta sama logika danych, props, pozycjonowanie. Różnica wyłącznie wizualna.

**Props:** `config: OverlayV2Config`, `activePlayer: PlayerLive | null`.

**Logika (identyczna z glass):**
- Brak `activePlayer` → ukryty (AnimatePresence, fade 150 ms).
- `side = activePlayer.team_num === 1 ? 'orange' : 'blue'` (zgodnie z konwencją glass: team_num 0=blue, 1=orange — patrz `GlassBoostGauge`).
- `boost = clamp(0,100, round(activePlayer.boost))`, `size = config.boostGauge.size ?? 230`.
- Pozycjonowanie przez `positionToStyle(config.boostGauge.position)`.

**Wygląd (tokeny z `src/lib/y2k-theme.ts`):**
- **Obudowa (tarcza):** `borderRadius: '50%'`, tło `linear-gradient(180deg,#2a3550,#10141f,#1a2236)`, `border: y2kBorder`, `boxShadow: '0 0 30px rgba(91,141,239,.3), inset 0 2px 3px rgba(255,255,255,.35), inset 0 -10px 20px rgba(0,0,10,.5)'`. (Nie używamy `y2kCoreBg` — chcemy bardziej niebieskawy chrome niż domyślny core panel.)
- **Pierścień postępu (SVG, `transform: rotate(-90deg)`):**
  - tor: `stroke: rgba(180,200,255,.12)`, `strokeWidth: 7`, `r = size/2 - 13`.
  - wypełnienie: `strokeDasharray = C`, `strokeDashoffset = C*(1 - boost/100)`, `strokeLinecap: 'round'`, `transition: stroke-dashoffset .12s linear`.
  - gradient chrome wg strony (pionowy `linearGradient`):
    - `gauge-y2k-blue`: `#cfe3ff` → `#5B8DEF` → `#3460c8`
    - `gauge-y2k-orange`: `#ffe0cc` → `#FF6B35` → `#c84e20`
    - `gauge-y2k-critical`: `#ffd0c0` → `#FF5E3A` → `#c8281a`
- **Kropkowana skala (detal Y2K):** drugi okrąg `r = size/2 - 5`, `strokeWidth: 1`, `strokeDasharray: '2 7'`, kolor `rgba(196,181,253,.2)`.
- **Środek:**
  - cyfra: `Y2K_FONT`, `fontWeight: 900`, `fontSize: size*0.30`, kolor wg stanu, `textShadow: y2kScoreShadow` (lub stanowy glow).
  - pod nią `BOOST`: `Y2K_MONO`, `fontSize: Math.max(10, size*0.053)`, kolor `Y2K_CHROME`, `textShadow: y2kChromeTextShadow`, `marginTop: 4`.

**Stany:**
- `boost < 10`: pierścień `gauge-y2k-critical`, cyfra `#FF8A6B` + `textShadow: '0 0 16px rgba(255,90,50,.7), 0 2px 0 rgba(0,0,0,.55)'`, obudowa `boxShadow: '0 0 30px rgba(255,90,60,.35), inset 0 2px 3px rgba(255,255,255,.35), inset 0 -10px 20px rgba(0,0,10,.5)'`.
- `boost === 100`: cyfra `#FFD9A0` + `textShadow: '0 0 18px rgba(255,180,90,.8), 0 2px 0 rgba(0,0,0,.55)'`, pierścień pełny w kolorze drużyny (bez krytycznego).
- W przeciwnym razie: cyfra biała + `y2kScoreShadow`.

## 2. Integracja — `src/components/v2/y2k/V2Y2kStage.tsx`

Import `Y2kBoostGauge`. Po pozostałych elementach dodać:
```tsx
{config.boostGauge.visible && (
  <Y2kBoostGauge config={config} activePlayer={activePlayer} />
)}
```

## 3. Preset — `src/lib/v2-y2k-preset.ts`

Zmienić `boostGauge` z `visible:false` na:
```ts
boostGauge: {
  ...defaultOverlayV2Config.boostGauge,
  visible: true,
  size: 230,
  position: { anchorH: 'right', anchorV: 'bottom', offsetX: -936, offsetY: 424 },
},
```
(Wartości domyślne jak w glass — prawy dolny róg, ~100 px nad dołem; offsetX ujemny dla anchorH:'right' żeby przesunąć w stronę środka. Dostroić wizualnie po wdrożeniu, aby zakrywał natywny wskaźnik RL przy 1920×1080.)

**Podbić `Y2K_PRESET_VERSION` z 1 → 2** — bez bumpa `ensureY2kPreset` nie nadpisze istniejącego wiersza w DB.

## 4. Kontrolki w kreatorze — `src/components/creator/StyleEditorV2.tsx`

W sekcji `boostGauge` rozszerzyć warunek renderowania kontrolek (widoczność, slider rozmiaru, pozycja) z `isGlass` na `isGlass || isY2k`. Pozostałe stylistyczne pola (kolory itp.) — gdy są — pozostają ukryte dla y2k zgodnie z wcześniejszą regułą.

## 5. Czego NIE ruszać

`GlassBoostGauge` i glass; typ `boostGauge` w `src/types/overlayV2.ts` (reużycie pola); dane (`activeCameraTarget`, `useLiveStatsV2`); standard v2; resolver pozycji; transparentność OBS.

## 6. DoD

- [ ] `Y2kBoostGauge` renderuje się w `theme:'y2k'` gdy `boostGauge.visible`.
- [ ] Okrągły, chromowany; pierścień gradientowy wg strony gracza; kropkowana skala fioletowego chromu widoczna.
- [ ] Stany `<10` (czerwony pierścień + cyfra) i `=100` (złota cyfra) działają.
- [ ] Boost pochodzi z gracza wskazanego przez `activeCameraTarget`; brak gracza → fade-out 150 ms.
- [ ] Domyślnie prawy dolny róg, 230 px; przy domyślnych wartościach zakrywa natywny wskaźnik RL (weryfikacja na 1920×1080).
- [ ] Pozycja i rozmiar edytowalne w `StyleEditorV2` dla y2k (sekcja `boostGauge` widoczna).
- [ ] `Y2K_PRESET_VERSION` podbity (1 → 2); istniejący wiersz presetu w DB zaktualizowany przez `ensureY2kPreset`/`updatePreset`.
- [ ] Glass i standard bez regresji; TS/lint czysto.
