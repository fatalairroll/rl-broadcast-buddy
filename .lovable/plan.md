
# Plan: Wynik serii jako niezalezny element

## Problem

Kropki serii sa renderowane wewnatrz kontenerow nazw druzyn -- zarowno w trybie inline (pod nazwa), jak i w trybie detached (wewnatrz boxa). Przez to nie da sie ich przesuwac niezaleznie suwakami X/Y -- zawsze sa "przyklejone" do nazwy druzyny.

## Rozwiazanie

Wyniesc WSZYSTKIE bloki kropek serii z kontenerow nazw druzyn i renderowac je jako dwa niezalezne, absolutnie pozycjonowane elementy (Team A i Team B) wewnatrz outer-container scoreboardu. Dodac per-team offsety do `SeriesDisplayConfig`.

## Zmiany w plikach

### 1. `src/types/broadcast.ts`

Dodac 4 nowe pola do `SeriesDisplayConfig`:

```
teamAOffsetX: number;  // default 0
teamAOffsetY: number;  // default 0
teamBOffsetX: number;  // default 0
teamBOffsetY: number;  // default 0
```

Zaktualizowac `defaultOverlayConfig.seriesDisplay` o te pola.

### 2. `src/pages/Overlay.tsx`

**Usunac** bloki kropek serii z 4 miejsc:
- Linie ~196-221 (inline Team A, wewnatrz `!config.teamAName.detached`)
- Linie ~334-358 (inline Team B, wewnatrz `!config.teamBName.detached`)
- Linie ~433-446 (detached Team A box)
- Linie ~484-496 (detached Team B box)

**Dodac** 2 nowe niezalezne bloki po detached boxach (ale wciaz wewnatrz outer-container `<div className="absolute flex flex-col items-center">`):

```tsx
{/* Team A Series Dots - independent */}
{config.seriesDisplay.visible && seriesDotsCount > 0 && (
  <div style={{
    position: 'absolute',
    right: '50%',
    top: '100%',
    transform: `translate(${-(config.seriesDisplay.teamAOffsetX ?? 0)}px, ${(config.seriesDisplay.teamAOffsetY ?? 0)}px)`,
    opacity: config.seriesDisplay.opacity,
    ...getGlowStyle(config.seriesDisplay.glow),
  }}>
    <div className="flex items-center" style={{
      gap: config.seriesDisplay.dotSpacing,
      flexDirection: config.seriesDisplay.orientation === 'vertical' ? 'column' : 'row',
    }}>
      {/* kropki A */}
    </div>
  </div>
)}

{/* Team B Series Dots - independent */}
{config.seriesDisplay.visible && seriesDotsCount > 0 && (
  <div style={{
    position: 'absolute',
    left: '50%',
    top: '100%',
    transform: `translate(${(config.seriesDisplay.teamBOffsetX ?? 0)}px, ${(config.seriesDisplay.teamBOffsetY ?? 0)}px)`,
    ...
  }}>
    {/* kropki B */}
  </div>
)}
```

### 3. `src/components/creator/OverlayPreview.tsx`

Identyczna zmiana -- usunac kropki z 4 miejsc (inline A ~191-215, inline B ~313-336, detached A ~391-403, detached B ~437-449) i dodac 2 niezalezne bloki ze skalowaniem 0.4x.

### 4. `src/components/creator/StyleEditor.tsx`

W `renderSeriesDisplayEditor` dodac nowa sekcje "Pozycja per druzyna" z 4 suwakami:
- Offset X druzyny A (min -200, max 200)
- Offset Y druzyny A (min -100, max 100)
- Offset X druzyny B (min -200, max 200)
- Offset Y druzyny B (min -100, max 100)

Istniejace suwaki "Rozsuwanie X" i "Przesuniecie Y" moga zostac (jako globalne/wspolne) lub zostac zastapione per-team suwakami. Proponuje zastapic je per-team suwakami, poniewaz to daje pelna kontrole.

### 5. `src/config/overlayTemplates.ts`

Dodac `teamAOffsetX: 0`, `teamAOffsetY: 0`, `teamBOffsetX: 0`, `teamBOffsetY: 0` do wszystkich szablonow w sekcji `seriesDisplay`.

## Podsumowanie

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | 4 nowe pola w `SeriesDisplayConfig` + defaults |
| `src/pages/Overlay.tsx` | Usuniecie kropek z 4 kontenerow, dodanie 2 niezaleznych blokow |
| `src/components/creator/OverlayPreview.tsx` | j.w. |
| `src/components/creator/StyleEditor.tsx` | 4 suwaki per-team offset zamiast wspolnych |
| `src/config/overlayTemplates.ts` | Nowe wartosci domyslne |
