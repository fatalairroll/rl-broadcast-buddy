

# Plan: Redesign układu overlay na wzór profesjonalnych turniejów RL

## Analiza referencji

Na podstawie przesłanego screena z profesjonalnego overlaya Rocket League, nowy układ powinien zawierać:

```text
+------------------------------------------------------------------+
|                    [Zinshin no LAN] (tytuł turnieju)             |
|  [LOGO] [Nazwa drużyny A] [1] [2:01] [5] [Nazwa drużyny B] [LOGO]|
|                       [GAME 672 / seria]                          |
+------------------------------------------------------------------+

[Boost bary lewa strona]                    [Boost bary prawa strona]
BUZZ         [===33==]                              [===8===] BANDIT
FURY         [===0===]                              [===33==] CHIPPER
HOLLYWOOD    [===4===]                              [===REX=] REX
```

## Zmiany do wprowadzenia

### 1. Nowy układ Scoreboard (górny pasek)

**Struktura pozioma (od lewej do prawej):**
1. Logo drużyny A
2. Nazwa drużyny A
3. Wynik drużyny A (kolorowe tło - niebieskie)
4. Timer (środek, biały tekst na czarnym tle)
5. Wynik drużyny B (kolorowe tło - pomarańczowe)
6. Nazwa drużyny B
7. Logo drużyny B

**Pod scoreboardem:**
- Pasek serii (np. "GAME 672" lub wskaźniki wygranych meczy)

### 2. Paski serii

Logika dla różnych typów serii:
- **BO1**: brak wskaźników serii (pojedynczy mecz)
- **BO3**: 2 pola na stronę (wygrywa kto zdobędzie 2)
- **BO5**: 3 pola na stronę (wygrywa kto zdobędzie 3)
- **BO7**: 4 pola na stronę (wygrywa kto zdobędzie 4)

### 3. Boost Bars na 2/3 wysokości ekranu

**Pozycja:**
- Lewa strona: boost bary drużyny niebieskiej (na ~66% wysokości ekranu)
- Prawa strona: boost bary drużyny pomarańczowej (lustrzane odbicie)

**Dynamiczna liczba barów:**
- Automatyczne dostosowanie do liczby graczy w meczu (1v1, 2v2, 3v3, 4v4)

**Wartość boosta:**
- Min: 0, Max: 100 (przeliczane jeśli źródło danych używa innych jednostek)

### 4. Opcje stylizacji krawędzi

Nowa opcja dla boost barów i elementów scoreboard:
- `edgeStyle`: `'rounded'` | `'skewed'` | `'sharp'`
- **Rounded**: zaokrąglone rogi (obecne)
- **Skewed**: ścięte/skośne krawędzie (jak w referencji)
- **Sharp**: ostre krawędzie (prostokąt)

### 5. Color Picker z paletą

Nowy komponent `ColorPicker`:
- Wizualna paleta kolorów (preset colors)
- Suwak odcienia (hue slider)
- Input HEX/RGBA dla dokładnych wartości
- Podgląd wybranego koloru

## Pliki do modyfikacji

### `src/types/broadcast.ts`
- Dodanie nowego typu `EdgeStyle = 'rounded' | 'skewed' | 'sharp'`
- Dodanie pola `edgeStyle` do `BoostBarsConfig` i innych konfiguracji
- Aktualizacja `BoostBarsConfig` z nową pozycją (% ekranu zamiast stałej)

### `src/pages/Overlay.tsx`
- Kompletna przebudowa struktury scoreboardu
- Nowy układ: LOGO | NAZWA | WYNIK | TIMER | WYNIK | NAZWA | LOGO
- Pasek serii pod głównym scoreboardem
- Boost bary na 66% wysokości ekranu
- Obsługa skośnych krawędzi (CSS clip-path lub transform: skewX)

### `src/components/creator/OverlayPreview.tsx`
- Aktualizacja podglądu zgodnie z nowym układem
- Dodanie wizualizacji skośnych krawędzi

### `src/components/creator/StyleEditor.tsx`
- Dodanie nowego komponentu `ColorPicker` z paletą
- Zamiana `ColorInput` na `ColorPicker` we wszystkich edytorach
- Dodanie opcji wyboru stylu krawędzi (`EdgeStyle`)

### `src/components/ui/color-picker.tsx` (nowy plik)
- Komponent color picker z:
  - Paletą predefiniowanych kolorów
  - Suwakiem odcienia
  - Inputem HEX/RGBA
  - Podglądem wybranego koloru

## Szczegóły techniczne

### Skośne krawędzie (CSS)

```css
/* Opcja 1: clip-path */
.skewed-edge {
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}

/* Opcja 2: transform + overflow */
.skewed-container {
  transform: skewX(-10deg);
}
.skewed-content {
  transform: skewX(10deg); /* przeciwne skew dla tekstu */
}
```

### Pozycja boost barów (% ekranu)

```typescript
// Nowa konfiguracja
interface BoostBarsConfig {
  // ... istniejące pola
  verticalPosition: number; // 0-100, domyślnie 66 (2/3 ekranu)
  horizontalPadding: number; // padding od krawędzi w px
  edgeStyle: EdgeStyle;
}
```

### Paleta kolorów (preset)

```typescript
const COLOR_PRESETS = [
  // Niebieskie
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  // Pomarańczowe
  '#F97316', '#EA580C', '#C2410C', '#9A3412',
  // Zielone
  '#22C55E', '#16A34A', '#15803D', '#166534',
  // Czerwone
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
  // Neutralne
  '#FFFFFF', '#000000', '#6B7280', '#374151',
];
```

### Przeliczanie boosta

```typescript
// Normalizacja wartości boosta do zakresu 0-100
function normalizeBoost(value: number, max: number = 100): number {
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}
```

## Kolejność implementacji

1. **Typ EdgeStyle i aktualizacja typów** - dodanie nowych opcji konfiguracji
2. **Komponent ColorPicker** - nowy komponent UI z paletą kolorów
3. **Aktualizacja StyleEditor** - zamiana ColorInput na ColorPicker, dodanie EdgeStyle
4. **Nowy układ Overlay.tsx** - przebudowa struktury zgodnie z referencją
5. **Aktualizacja OverlayPreview** - synchronizacja podglądu z nowym układem
6. **Domyślna konfiguracja** - aktualizacja defaultOverlayConfig

## Efekt końcowy

Po wdrożeniu:
- Profesjonalny układ zgodny z referencją
- Timer na środku, wyniki po bokach
- Logo i nazwa drużyny symetrycznie
- Pasek serii pod scoreboardem
- Boost bary na 2/3 wysokości ekranu
- Opcja skośnych lub zaokrąglonych krawędzi
- Intuicyjny color picker z paletą presetów

