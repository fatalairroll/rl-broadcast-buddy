

# Plan: Osobne boxy dla nazw drużyn (Detached Team Names)

## Opis

Na screenshocie widać, ze nazwy drużyn ("TOP BLOKES", "SOLARY") sa w osobnych, kolorowych boxach umieszczonych na zewnatrz glownego paska scoreboardu -- po bokach. Obecnie nazwy sa wewnatrz paska scoreboardu. Plan dodaje opcje "odlaczenia" nazw do osobnych, niezaleznie pozycjonowanych boxow z wlasnym tlem, rozmiarem i pozycja.

## Zmiany

### 1. `src/types/broadcast.ts` -- rozszerzenie `TeamNameConfig`

Dodanie nowych pol:

| Pole | Typ | Domyslnie | Opis |
|------|-----|-----------|------|
| `detached` | `boolean` | `false` | Czy nazwa jest w osobnym boxie poza scoreboardem |
| `boxWidth` | `number` | `200` | Szerokosc boxa |
| `boxHeight` | `number` | `40` | Wysokosc boxa |
| `boxOffsetX` | `number` | `0` | Pozycja X boxa (przesuniecie od krawedzi scoreboardu) |
| `boxOffsetY` | `number` | `0` | Pozycja Y boxa |
| `boxBackgroundColor` | `string` | kolor druzyny | Tlo boxa |
| `boxBorderRadius` | `number` | `4` | Zaokraglenie rogow boxa |

Aktualizacja `defaultOverlayConfig` z wartosciami domyslnymi.

### 2. `src/pages/Overlay.tsx` -- renderowanie detached boxow

Logika warunkowa:
- Gdy `detached === false`: nazwy renderowane jak dotychczas (wewnatrz scoreboardu)
- Gdy `detached === true`: nazwy **ukryte** wewnatrz scoreboardu i zamiast tego renderowane jako **osobne absolutnie pozycjonowane divy** obok scoreboardu

Dla Team A (detached):
```
<div style={{
  position: 'absolute',
  right: '100%',  // po lewej stronie scoreboardu
  top: '50%',
  transform: `translateY(-50%) translate(${-boxOffsetX}px, ${boxOffsetY}px)`,
  width: boxWidth,
  height: boxHeight,
  backgroundColor: boxBackgroundColor,
  borderRadius: boxBorderRadius,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
  <span>TEAM A NAME</span>
</div>
```

Analogicznie Team B po prawej (`left: '100%'`).

Logo i series dots takze przenoszone do boxa (lub pozostaja w scoreboard -- w zaleznosci od preferencji).

### 3. `src/components/creator/OverlayPreview.tsx` -- podglad detached boxow

Ta sama logika warunkowa co w Overlay.tsx, ale ze skala 0.4x.

### 4. `src/components/creator/StyleEditor.tsx` -- kontrolki UI

W sekcji edytora nazwy druzyny (`renderTeamNameEditor`), dodanie:

1. **Checkbox/Switch** "Osobny box" (`detached`) na gorze sekcji
2. Gdy `detached === true`, wyswietlenie dodatkowych kontrolek:
   - Suwak "Szerokosc boxa" (100-400px)
   - Suwak "Wysokosc boxa" (20-80px)
   - Suwak "Przesuniecie boxa X" (-200 do 200)
   - Suwak "Przesuniecie boxa Y" (-100 do 100)
   - ColorPicker "Tlo boxa"
   - Suwak "Zaokraglenie boxa" (0-20)

### 5. `src/config/overlayTemplates.ts` -- aktualizacja szablonow

Dodanie domyslnych wartosci `detached: false` i pozostalych pol do istniejacych szablonow.

## Szczegoly techniczne

- Boxy sa pozycjonowane wzgledem kontenera scoreboardu (position: absolute, relative do rodzica)
- Kontener scoreboardu (linia ~117-118 w Overlay.tsx) musi zachowac `position: relative` aby boxy mogly byc pozycjonowane wzgledem niego
- W trybie `detached`, element nazwy wewnatrz scoreboardu jest ukrywany (`display: none` lub brak renderowania), ale logo i score pozostaja na miejscu
- Kolor tla boxa domyslnie uzywa koloru druzyny z sesji (team_a_color / team_b_color), ale moze byc nadpisany

## Efekt

- Domyslnie: bez zmian, nazwy w scoreboardzie
- Po wlaczeniu "Osobny box": nazwa druzyny pojawia sie w oddzielnym, konfigurowalnym boxie po stronie scoreboardu, umozliwiajac uzyskanie efektu widocznego na screenshocie
