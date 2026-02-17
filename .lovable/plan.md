

# Plan: Wynik serii jako niezalezny element

## Problem

Kropki serii sa renderowane wewnatrz kontenerow nazw druzyn (zarowno w trybie inline jak i detached). Nie mozna ich swobodnie przesuwac -- zawsze sa "przyklejone" pod nazwa druzyny.

## Rozwiazanie

Wyniesc kropki serii z kontenerow nazw druzyn i renderowac je jako niezalezne, absolutnie pozycjonowane elementy wzgledem outer-container scoreboardu. Kazda druzyna ma swoje kropki z wlasnymi offsetami.

## Zmiany

### 1. `src/types/broadcast.ts` -- rozszerzenie `SeriesDisplayConfig`

Dodanie nowych pol umozliwiajacych niezalezne pozycjonowanie kropek dla kazdej druzyny:

```
teamAOffsetX: number;  // offset X kropek druzyny A
teamAOffsetY: number;  // offset Y kropek druzyny A
teamBOffsetX: number;  // offset X kropek druzyny B
teamBOffsetY: number;  // offset Y kropek druzyny B
```

Istniejace `offsetX`/`offsetY` zostana uzyte jako globalne wartosci domyslne. Nowe pola daja niezalezna kontrole nad kazdym zestawem kropek.

Alternatywnie -- prostsze podejscie: uzyc istniejacych `offsetX`/`offsetY` jako wspolnych i dodac `position` z `x`/`y` procentowym (jak scoreboard). Ale to zmienia cala koncepcje -- lepiej zachowac offsety per-team.

**Aktualizacja domyslnych wartosci** w `defaultOverlayConfig`:
- `teamAOffsetX: 0`, `teamAOffsetY: 0`
- `teamBOffsetX: 0`, `teamBOffsetY: 0`

### 2. `src/pages/Overlay.tsx` -- przeniesienie kropek serii

**Usuniecie** bloków renderujacych kropki serii z:
- Wnetrza Team A inline name (linie ~197-221)
- Wnetrza Team B inline name (linie ~331-355)
- Wnetrza Team A detached box (linie ~429-442)
- Wnetrza Team B detached box (odpowiednie linie)

**Dodanie** dwoch nowych, niezaleznych blokow po detached boxach (ale wciaz wewnatrz outer-container):

```
{/* Team A Series Dots - independent element */}
{config.seriesDisplay.visible && seriesDotsCount > 0 && (
  <div style={{
    position: 'absolute',
    right: '50%',        // domyslnie przy lewej polowie scoreboardu
    top: '100%',         // pod scoreboardem
    transform: `translate(${-config.seriesDisplay.teamAOffsetX}px, ${config.seriesDisplay.teamAOffsetY}px)`,
    ...
  }}>
    {/* kropki A */}
  </div>
)}

{/* Team B Series Dots - independent element */}
{config.seriesDisplay.visible && seriesDotsCount > 0 && (
  <div style={{
    position: 'absolute',
    left: '50%',
    top: '100%',
    transform: `translate(${config.seriesDisplay.teamBOffsetX}px, ${config.seriesDisplay.teamBOffsetY}px)`,
    ...
  }}>
    {/* kropki B */}
  </div>
)}
```

### 3. `src/components/creator/OverlayPreview.tsx` -- identyczna zmiana

Przeniesienie kropek serii z kontenerow nazw druzyn do niezaleznych elementow w outer-container. Skalowanie 0.4x jak pozostale elementy podgladu.

### 4. `src/components/creator/StyleEditor.tsx` -- nowe suwaki

W sekcji edycji `seriesDisplay` dodanie suwaków:
- "Offset X druzyny A" / "Offset Y druzyny A"
- "Offset X druzyny B" / "Offset Y druzyny B"

Pozwoli to na niezalezne przesuwanie kropek kazdej druzyny.

### 5. `src/config/overlayTemplates.ts` -- domyslne wartosci

Dodanie `teamAOffsetX: 0`, `teamAOffsetY: 0`, `teamBOffsetX: 0`, `teamBOffsetY: 0` do szablonow.

## Podsumowanie zmian w plikach

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | Nowe pola `teamAOffsetX/Y`, `teamBOffsetX/Y` w `SeriesDisplayConfig` |
| `src/pages/Overlay.tsx` | Usuniecie kropek z nazw druzyn, dodanie niezaleznych blokow |
| `src/components/creator/OverlayPreview.tsx` | j.w. |
| `src/components/creator/StyleEditor.tsx` | Suwaki per-team offset |
| `src/config/overlayTemplates.ts` | Domyslne wartosci nowych pol |

