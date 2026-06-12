# Plan: GlassBoostGauge + weryfikacja rangi

## 1. Weryfikacja rangi w karcie (pkt 1)

Stan po poprzedniej iteracji:
- `PlayerCardV2Style` ma `rankIconSize`, `rankOffsetX`, `rankOffsetY` (overlayV2.ts:176–178, default 36/0/0).
- `GlassPlayerCard` czyta je przez `config.playerCard.rankIconSize ?? 30` itp. i aplikuje przez `width`/`height` oraz `transform: translate(calc(-50% + ox), calc(-50% + oy))` (GlassPlayerCard.tsx:195–197, 278–288). To jest poprawne — działa na żywo (preview używa tego samego configu) i po zapisie (mergeV2Config zachowuje pola, bo `pc = { ...default, ...partial }`).
- `StyleEditorV2` ma trzy slidery (rozmiar 16–160, offsety ±200) na liniach 200–202.

Wniosek: punkt 1 zamknięty. Po bumpie `GLASS_PRESET_VERSION` w pkt 2 systemowy preset i tak się odświeży.

## 2. GlassBoostGauge — okrągły wskaźnik boosta

### 2a. Typy (src/types/overlayV2.ts)
- Nowy interfejs:
  ```ts
  export interface BoostGaugeV2Style {
    visible: boolean;
    size: number;           // px, default 230, UI 180–320
    position: PositionV2;   // anchorH:'right', anchorV:'bottom'
  }
  ```
- Dodać `boostGauge: BoostGaugeV2Style` do `OverlayV2Config`.
- Dodać `'boostGauge'` do `V2EditableElement` i `V2_ELEMENT_LABELS` (`'Wskaźnik boosta (gauge, Glass)'`).
- `defaultOverlayV2Config.boostGauge = { visible: false, size: 230, position: { anchorH:'right', anchorV:'bottom', offsetX: 936, offsetY: 524 } }` (936 = 1920/2 − 24, 524 = 1080/2 − 16; resolver: prawy/dolny brzeg elementu = 960+offsetX / 540+offsetY).
- W `mergeV2Config`: backfill z defaultu analogicznie do innych sekcji.

### 2b. Komponent (src/components/v2/glass/GlassBoostGauge.tsx — NOWY)
Props: `config: OverlayV2Config`, `activePlayer: PlayerLive | null`.

Logika:
- Brak `activePlayer` → `AnimatePresence` exit (opacity, 150 ms), nic.
- `side = activePlayer.team_num === 0 ? 'blue' : 'orange'`.
- `boost = clamp(activePlayer.boost, 0, 100)`.
- `size = config.boostGauge.size`.

Markup (pozycja przez `positionToStyle(config.boostGauge.position)`):
- Wrapper `width:size, height:size, borderRadius:'50%'`, materiał `opaqueDark` + `borderRadius:'50%'`, drop-shadow `0 10px 30px rgba(0,0,10,.5)`.
- Warstwa `fakeRefractionDark` (inset 0, `borderRadius:'50%'`).
- Refleks górny: absolute, `top:0, left:10%, right:10%, height:'40%', background:'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.32), transparent 65%)'`.
- SVG `width=size height=size` z `transform: rotate(-90deg)`:
  - tor: `<circle stroke="rgba(255,255,255,.08)" strokeWidth=11 r=(size/2)-16 fill="none"/>`
  - wypełnienie: `<circle stroke="url(#gauge-{side|critical})" strokeLinecap="round" strokeWidth=11 r=r fill="none" strokeDasharray=C strokeDashoffset=C*(1-boost/100)/>`, `transition:'stroke-dashoffset .12s linear'`.
  - `<defs>` z liniowymi gradientami: blue `#00B2FF→#1B5FD6`, orange `#FF9430→#D44E00`, critical `#FF5C3C→#FF8A50` (wybór wg progu `boost<10`).
- Środek (absolute centered):
  - cyfra: `glassName` + `glassScoreDigitWin`, `fontSize: size*0.245`. `boost<10`: `#FF7A5C`, `textShadow:'0 0 16px rgba(255,90,60,.6)'`. `boost===100`: `#FFD27A`, `textShadow:'0 0 18px rgba(255,200,90,.65)'`.
  - podpis `BOOST`: `glassLabel`, `fontSize: size*0.048` (~11 przy 230), `color: 'rgba(255,255,255,.55)'`, marginTop ~4.
- `motion.div` initial/exit `{ opacity:0 }`, animate `{ opacity:1 }`, transition 0.15s.

### 2c. Integracja (src/components/v2/glass/V2GlassStage.tsx)
Po sekcji `playerCard`:
```tsx
{config.boostGauge.visible && (
  <GlassBoostGauge config={config} activePlayer={activePlayer} />
)}
```
Standard scene (`ScoreboardV2` itp.) — nie tykać; element żyje wyłącznie w stage Glass.

### 2d. Kreator
- `ElementListV2.tsx`: dodać `'boostGauge'` do `ORDER` po `playerCard`.
- `StyleEditorV2.tsx`: panel renderowany tylko gdy `config.general.theme === 'glass'`:
  ```tsx
  {element === 'boostGauge' && config.general.theme === 'glass' && (
    <>
      <Toggle label="Widoczny" .../>
      <PositionEditor .../>
      <SliderInput label="Rozmiar" min={180} max={320} unit="px" .../>
    </>
  )}
  {element === 'boostGauge' && config.general.theme !== 'glass' && (
    <p className="text-xs text-muted-foreground">
      Wskaźnik boosta (gauge) jest dostępny tylko dla motywu Glass.
      Zmień motyw w sekcji „Ogólne", aby go konfigurować.
    </p>
  )}
  ```
  Dzięki temu sekcja jest widoczna w liście elementów (spójność UX), ale w trybie standard użytkownik dostaje czytelny komunikat zamiast martwych kontrolek, które niczego nie wyświetlą.

### 2e. Preset (src/lib/v2-glass-preset.ts)
- `GLASS_PRESET_VERSION = 4`.
- `GLASS_OVERLAY_CONFIG.boostGauge = { visible: true, size: 230, position: { anchorH:'right', anchorV:'bottom', offsetX: 936, offsetY: 524 } }`.
- `ensureGlassPreset` (logika z poprzedniego planu) sam zaktualizuje istniejący wiersz DB.

## 3. Pliki
- `src/types/overlayV2.ts` — typy + default + merge.
- `src/components/v2/glass/GlassBoostGauge.tsx` — NOWY.
- `src/components/v2/glass/V2GlassStage.tsx` — render.
- `src/components/creator/ElementListV2.tsx` — pozycja w liście.
- `src/components/creator/StyleEditorV2.tsx` — panel + gate motywu Glass.
- `src/lib/v2-glass-preset.ts` — wpis w configu + bump wersji.

## 4. Czego NIE zmieniam
Studio, GlassBoostPanel (boczne paski), GlassPlayerCard (poza już zrobionym rank), detektor gola, resolver pozycji, sceny użytkowników, tokeny w studio-glass-theme.ts.

## 5. Weryfikacja po build mode
- `/creator`, preset GLASS OVERLAY → sekcja „Wskaźnik boosta (gauge, Glass)" pokazuje kontrolki; zmiany na żywo w preview.
- Inny preset (theme standard) → ta sama sekcja pokazuje komunikat „dostępne tylko dla motywu Glass".
- `/v2/overlay` po zapisie: gauge w prawym dolnym rogu, kolor zgodny z drużyną aktywnego gracza, fade-out gdy brak activeCamera.
- Stary wiersz `GLASS OVERLAY` w DB przepisany dzięki bumpowi `GLASS_PRESET_VERSION` na 4.
