
# Plan: Rozszerzenie opcji kreowania overlaya - kompleksowe ulepszenia

## Przegląd zmian

Na podstawie analizy kodu i zgłoszonych problemów, wprowadzam następujące zmiany:

---

## 1. Naprawa szerokości scoreboardu

### Problem
Suwak szerokości (`width`) istnieje w StyleEditor (linia 77-84), ale w `Overlay.tsx` ta wartość **nie jest używana** - szerokość scoreboardu wynika z zawartości (flexbox), nie z ustawionej wartości `width`.

### Rozwiązanie
W `Overlay.tsx` linii 100-107 dodaję właściwość `width` i `minWidth` do głównego kontenera scoreboardu:

```typescript
<div
  className="flex items-center justify-center"
  style={{
    width: config.scoreboard.width, // Dodane
    minWidth: config.scoreboard.width, // Zabezpieczenie
    ...getBackgroundStyle(config.scoreboard.backgroundColor, config.scoreboard.backgroundGradient),
    border: `${config.scoreboard.borderWidth}px solid ${config.scoreboard.borderColor}`,
    ...getEdgeStyle(config.scoreboard.edgeStyle, config.scoreboard.borderRadius),
    padding: '8px 0',
  }}
>
```

---

## 2. Połączenie "Kształt elementu" i "Styl krawędzi" + naprawa działania

### Problem
Istnieją dwa podobne parametry:
- `EdgeStyle`: 'rounded' | 'skewed' | 'sharp'
- `ElementShape`: 'sharp' | 'rounded' | 'skewed' | 'pill' | 'hexagon' | 'parallelogram'

Oba robią podobne rzeczy, ale `ElementShape` nie jest używane w `Overlay.tsx` dla scoreboardu.

### Rozwiązanie
1. Usunięcie `EdgeStylePicker` z edytorów
2. Pozostawienie tylko `ShapePicker` jako "Kształt elementu"
3. Modyfikacja `getEdgeStyle` w Overlay.tsx aby używało `shape` zamiast `edgeStyle`
4. Usunięcie właściwości `edgeStyle` z interfejsów (tylko `shape`)

### Zmiany w typach
```typescript
// Usuwam edgeStyle, zostawiam tylko shape
export interface ScoreboardConfig {
  // ...
  shape: ElementShape; // zamiast dwóch pól
}
```

---

## 3. Punkty serii - orientacja i pozycjonowanie

### Nowe właściwości w `SeriesDisplayConfig`
```typescript
export interface SeriesDisplayConfig extends ElementStyle {
  visible: boolean;
  showSeriesType: boolean;
  dotSize: number;
  dotSpacing: number;
  activeDotColor: string;
  inactiveDotColor: string;
  // NOWE:
  orientation: 'horizontal' | 'vertical';
  position: { x: number; y: number }; // pozycja względem scoreboardu
  offsetX: number;
  offsetY: number;
}
```

### Nowe kontrolki w StyleEditor
```text
┌─────────────────────────────────────────────────────────┐
│ Orientacja                                              │
│ ○ Poziomo  ● Pionowo                                    │
├─────────────────────────────────────────────────────────┤
│ Pozycja X      [────●──────] 50%     [____ 50]          │
│ Pozycja Y      [──────●────] 80%     [____ 80]          │
│ Przesunięcie X [────●──────] 0px     [____  0]          │
│ Przesunięcie Y [────●──────] 0px     [____  0]          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Niezależne pozycjonowanie i rozmiar każdego elementu w scoreboardzie

### Rozszerzenie interfejsów
Każdy element (ScoreDisplay, TimerDisplay, TeamName) otrzyma:

```typescript
export interface ScoreDisplayConfig extends ElementStyle {
  // ... istniejące
  // NOWE - niezależna pozycja i rozmiar
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface TimerDisplayConfig extends ElementStyle {
  // ... istniejące
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface TeamNameConfig extends ElementStyle {
  // ... istniejące
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}
```

### Nowe sekcje w StyleEditor dla każdego elementu
Dodaję sekcję "Rozmiar i przesunięcie" z suwakami + polami input.

---

## 5. Ręczne wprowadzanie wartości przy każdym suwaku

### Modyfikacja komponentu `SliderInput`

```typescript
const SliderInput = ({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = '',
}: {
  // ... props
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num));
      onValueChange(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-16 h-6 text-xs text-right px-1"
            min={min}
            max={max}
            step={step}
          />
          <span className="text-xs text-muted-foreground w-6">{unit}</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => {
          onValueChange(v);
          setInputValue(v.toString());
        }}
        min={min}
        max={max}
        step={step}
        className="py-1"
      />
    </div>
  );
};
```

Wizualizacja:
```text
┌─────────────────────────────────────────────────────────┐
│ Szerokość                         [___700] px           │
│ [════════════●════════════════════════]                 │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Usunięcie opcji "Odstępy między elementami"

Usuwam z `StyleEditor.tsx`:
- Suwak "Odstęp między elementami" (gap) z scoreboardu (linie 138-145)
- Suwak "Odstęp" z scoreDisplay (linie 191-198)

Z typów usuwam `gap` z `ScoreboardConfig`.

---

## 7. Opcja opacity dla każdego elementu

### Dodanie suwaka opacity do każdego edytora

Opcja opacity istnieje już w `ElementStyle`, ale nie jest używana w UI. Dodaję suwak:

```typescript
<SliderInput
  label="Przeźroczystość"
  value={config.scoreboard.opacity ?? 1}
  onValueChange={(v) => onChange('scoreboard', { opacity: v })}
  min={0}
  max={1}
  step={0.05}
  unit=""
/>
```

Oraz używam w renderowaniu:
```typescript
style={{
  ...existingStyles,
  opacity: config.scoreboard.opacity ?? 1,
}}
```

---

## 8. Naprawa statystyk gracza + dodanie "kasacja" (demolitions)

### Problem
W `PlayerState` brakuje pola `demos` (demolitions/kasacje). Strzały i obrony są w typach, ale mogą nie być wyświetlane poprawnie.

### Rozwiązanie

1. Rozszerzenie `PlayerState`:
```typescript
export interface PlayerState {
  id: string;
  name: string;
  team: 0 | 1;
  boost: number;
  goals: number;
  shots: number;
  assists: number;
  saves: number;
  demos: number; // NOWE - kasacje/demolitions
  score: number;
  isPrimary: boolean;
}
```

2. Rozszerzenie `PlayerStatsConfig`:
```typescript
export interface PlayerStatsConfig {
  // ... istniejące
  showDemos: boolean; // NOWE
}
```

3. Aktualizacja renderowania w `Overlay.tsx`:
```typescript
const stats = [
  { label: 'SCR', value: player.score, show: config.showScore },
  { label: 'G', value: player.goals, show: config.showGoals },
  { label: 'A', value: player.assists, show: config.showAssists },
  { label: 'SV', value: player.saves, show: config.showSaves },
  { label: 'SH', value: player.shots, show: config.showShots },
  { label: 'DEM', value: player.demos, show: config.showDemos }, // NOWE
].filter((s) => s.show);
```

4. Dodanie switcha w StyleEditor:
```typescript
<div className="flex items-center justify-between">
  <Label className="text-xs">Kasacje</Label>
  <Switch
    checked={config.playerStats.showDemos}
    onCheckedChange={(v) => onChange('playerStats', { showDemos: v })}
    className="scale-75"
  />
</div>
```

---

## 9. Efekt glow (świecenie) dla każdego elementu

### Nowy interfejs
```typescript
export interface GlowConfig {
  enabled: boolean;
  color: string;
  blur: number; // 0-50px
  spread: number; // 0-20px
  intensity: number; // 0-1 (opacity)
}
```

### Rozszerzenie interfejsów
Dodaję `glow?: GlowConfig` do:
- `ScoreboardConfig`
- `ScoreDisplayConfig`
- `TimerDisplayConfig`
- `TeamNameConfig`
- `BoostBarsConfig`
- `BoostCircleConfig`
- `PlayerStatsConfig`

### Nowy komponent `GlowEditor`
```typescript
interface GlowEditorProps {
  label: string;
  glow: GlowConfig;
  onChange: (glow: GlowConfig) => void;
}

export function GlowEditor({ label, glow, onChange }: GlowEditorProps) {
  const defaultGlow: GlowConfig = {
    enabled: false,
    color: '#3B82F6',
    blur: 10,
    spread: 2,
    intensity: 0.5,
  };
  const current = glow || defaultGlow;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          checked={current.enabled}
          onCheckedChange={(v) => onChange({ ...current, enabled: v })}
        />
      </div>
      {current.enabled && (
        <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
          <ColorPicker
            label="Kolor świecenia"
            value={current.color}
            onChange={(v) => onChange({ ...current, color: v })}
          />
          <SliderInput
            label="Rozmycie"
            value={current.blur}
            onValueChange={(v) => onChange({ ...current, blur: v })}
            min={0}
            max={50}
            unit="px"
          />
          <SliderInput
            label="Rozszerzenie"
            value={current.spread}
            onValueChange={(v) => onChange({ ...current, spread: v })}
            min={0}
            max={20}
            unit="px"
          />
          <SliderInput
            label="Intensywność"
            value={current.intensity}
            onValueChange={(v) => onChange({ ...current, intensity: v })}
            min={0}
            max={1}
            step={0.1}
          />
        </div>
      )}
    </div>
  );
}
```

### Funkcja pomocnicza do generowania CSS
```typescript
function getGlowStyle(glow?: GlowConfig): React.CSSProperties {
  if (!glow?.enabled) return {};
  const { color, blur, spread, intensity } = glow;
  // Konwertuj hex do rgba z intensity
  const rgba = hexToRgba(color, intensity);
  return {
    boxShadow: `0 0 ${blur}px ${spread}px ${rgba}`,
  };
}
```

### Wizualizacja w UI
```text
┌─────────────────────────────────────────────────────────┐
│ Efekt świecenia                              [ON/OFF]   │
├─────────────────────────────────────────────────────────┤
│ Kolor świecenia    [■ #3B82F6]                          │
│ Rozmycie           [────●────────] 15px   [___ 15]      │
│ Rozszerzenie       [──●──────────] 3px    [___  3]      │
│ Intensywność       [──────●──────] 0.6    [__ 0.6]      │
└─────────────────────────────────────────────────────────┘
```

---

## Pliki do modyfikacji

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | Nowe interfejsy (GlowConfig, rozszerzenia), usunięcie edgeStyle, dodanie demos |
| `src/components/creator/StyleEditor.tsx` | Modyfikacja SliderInput, dodanie GlowEditor, orientacja serii, opacity |
| `src/components/ui/glow-editor.tsx` | Nowy komponent |
| `src/pages/Overlay.tsx` | Naprawa szerokości, użycie shape zamiast edgeStyle, glow, opacity, demos |
| `src/components/creator/OverlayPreview.tsx` | Synchronizacja zmian z Overlay |
| `src/lib/glow-utils.ts` | Helper dla glow CSS |

---

## Kolejność implementacji

1. Modyfikacja typów w `broadcast.ts`
2. Nowy komponent `SliderInput` z inputem ręcznym
3. Nowy komponent `GlowEditor`
4. Helper `getGlowStyle` w `glow-utils.ts`
5. Aktualizacja `StyleEditor.tsx`:
   - Usunięcie EdgeStylePicker
   - Usunięcie zbędnych suwaków gap
   - Dodanie opacity
   - Dodanie pozycjonowania serii
   - Dodanie kontrolek rozmiarów elementów
   - Dodanie GlowEditor do każdej sekcji
   - Dodanie showDemos
6. Aktualizacja `Overlay.tsx`:
   - Naprawa szerokości scoreboardu
   - Użycie shape zamiast edgeStyle
   - Dodanie opacity i glow do stylów
   - Dodanie demos do statystyk
7. Synchronizacja `OverlayPreview.tsx`
8. Aktualizacja `defaultOverlayConfig` z nowymi wartościami

---

## Efekt końcowy

Po wdrożeniu użytkownik będzie mógł:
- Ustawić dokładną szerokość scoreboardu za pomocą działającego suwaka
- Wybrać jeden spójny kształt elementu (bez duplikacji opcji)
- Ustawić orientację punktów serii (pion/poziom) i pozycję X/Y
- Precyzyjnie pozycjonować i skalować każdy element scoreboardu
- Wpisywać wartości ręcznie przy każdym suwaku
- Ustawić przeźroczystość każdego elementu niezależnie
- Zobaczyć statystykę kasacji (demolitions) w statystykach gracza
- Dodać efekt świecenia (glow) do każdego elementu z kontrolą koloru, rozmiaru i intensywności
