
# Plan: Gradienty dla wszystkich elementów + Statystyki graczy przy paskach boosta

## 1. Pełna kontrola kolorów/gradientów dla elementów

### Aktualny stan
Elementy mają już `GradientEditor` w `StyleEditor.tsx`:
- Tło Scoreboardu — OK (GradientEditor)
- Wynik meczu — StyleEditor ma GradientEditor dla `backgroundColor`, ale w Overlay.tsx wynik jest renderowany z `session?.team_a_color` jako tło (kolor drużyny), całkowicie ignorując `scoreDisplay.backgroundColor` i `backgroundGradient`
- Timer — OK (GradientEditor)
- Wynik Serii — OK (GradientEditor)
- Nazwy drużyn — OK (GradientEditor)

### Problem z Wynikiem meczu
W `Overlay.tsx` (linie ~229-246) i `OverlayPreview.tsx` (linie ~219-238) bloki wyniku używają:
```tsx
backgroundColor: session?.team_a_color || '#3B82F6'
```
zamiast `getBackgroundStyle(config.scoreDisplay.backgroundColor, config.scoreDisplay.backgroundGradient)`.

### Rozwiązanie dla Wyniku meczu
Dodać do `ScoreDisplayConfig` nowe pole `useTeamColor: boolean` (domyślnie `true`). Gdy włączone — wynik używa koloru drużyny (obecne zachowanie). Gdy wyłączone — używa `backgroundColor`/`backgroundGradient` z konfiguracji.

W `StyleEditor.tsx` dodać przełącznik "Użyj koloru drużyny" w sekcji `scoreDisplay`. Gdy wyłączony, pokazać `GradientEditor` dla własnego koloru.

W obu plikach renderujących podmienić logikę:
```tsx
const scoreABg = config.scoreDisplay.useTeamColor
  ? { backgroundColor: session?.team_a_color || '#3B82F6' }
  : getBackgroundStyle(config.scoreDisplay.backgroundColor, config.scoreDisplay.backgroundGradient);
```

### Pliki dla pkt 1:
- `src/types/broadcast.ts` — `useTeamColor?: boolean` w `ScoreDisplayConfig`, default `true`
- `src/pages/Overlay.tsx` — logika warunkowa dla tła wyniku
- `src/components/creator/OverlayPreview.tsx` — j.w.
- `src/components/creator/StyleEditor.tsx` — przełącznik + GradientEditor warunkowy
- `src/config/overlayTemplates.ts` — `useTeamColor: true` w szablonach

---

## 2. Statystyki graczy przy paskach boosta

### Odniesienie do screenshota
Zdjęcie pokazuje: każdy pasek boosta ma pod nim (lub obok) statystyki gracza — widoczne: imię, wynik (np. 0/1/2), kasacje. Układ to tabela pod paskami całego zespołu albo wiersze per-gracz.

Analizując screenshot dokładniej: każdy gracz ma wiersz z: `IMIE | 0 | 1 | 2` gdzie cyfry to np. cele, asysty, obrony. Wygląda jak trzy statystyki w jednym wierszu pod paskiem boosta.

### Podejście: "Statystyki w pasku" jako rozszerzenie istniejącego komponentu BoostBar

Dodać do `BoostBarsConfig` nowe pola:
```typescript
showStatsInBar: boolean;    // włącz/wyłącz statystyki per gracz w pasku (default: false)
statsInBarGoals: boolean;
statsInBarAssists: boolean;
statsInBarSaves: boolean;
statsInBarShots: boolean;
statsInBarDemos: boolean;
statsInBarScore: boolean;
statsTextColor: string;     // kolor tekstu statystyk
statsFontSize: number;      // rozmiar czcionki statystyk
```

### Układ renderowania
Zamiast jednego wiersza `flex items-center`, `BoostBar` będzie miał dwa wiersze (flex-col):
- Wiersz 1 (istniejący): Nazwa | Pasek | Wartość
- Wiersz 2 (nowy, gdy `showStatsInBar`): Statystyki jako małe cyfry z etykietami

```tsx
<div style={{ flexDirection: 'column', ... }}>
  <div className="flex items-center gap-2">
    {/* existing: name, bar, value */}
  </div>
  {config.showStatsInBar && (
    <div className="flex items-center gap-2 mt-0.5">
      {config.statsInBarScore && <span>SCR {player.score}</span>}
      {config.statsInBarGoals && <span>G {player.goals}</span>}
      {/* etc. */}
    </div>
  )}
</div>
```

### UI w StyleEditor
W sekcji `boostBars` (po sekcji Opcje) dodać nową sekcję "Statystyki w pasku":
- Przełącznik "Pokaż statystyki gracza"
- Gdy włączony: 6 przełączników dla każdej statystyki
- `ColorPicker` dla koloru tekstu statystyk
- `SliderInput` dla rozmiaru czcionki statystyk

### Pliki dla pkt 2:
- `src/types/broadcast.ts` — nowe pola w `BoostBarsConfig`
- `src/pages/Overlay.tsx` — rozszerzenie `BoostBar` o drugi wiersz statystyk
- `src/components/creator/OverlayPreview.tsx` — j.w. (skalowanie 0.35-0.4x)
- `src/components/creator/StyleEditor.tsx` — nowa sekcja statystyk w edytorze boostBars
- `src/config/overlayTemplates.ts` — nowe wartości domyślne

---

## Podsumowanie zmian

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | `useTeamColor` w `ScoreDisplayConfig`; nowe pola statystyk w `BoostBarsConfig` |
| `src/pages/Overlay.tsx` | Warunkowe tło wyniku; drugi wiersz statystyk w `BoostBar` |
| `src/components/creator/OverlayPreview.tsx` | j.w. |
| `src/components/creator/StyleEditor.tsx` | Przełącznik + warunkowy GradientEditor dla wyniku; sekcja statystyk w pasku |
| `src/config/overlayTemplates.ts` | Domyślne wartości nowych pól |

---

## Kolejność implementacji

1. Typy (`broadcast.ts`) — dodanie nowych pól
2. Logika renderowania (`Overlay.tsx` i `OverlayPreview.tsx`) — warunkowe style i nowy wiersz statystyk
3. Edytor (`StyleEditor.tsx`) — nowe kontrolki UI
4. Szablony (`overlayTemplates.ts`) — wartości domyślne
