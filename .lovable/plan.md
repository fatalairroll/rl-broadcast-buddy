

# Plan: Rozszerzenie możliwości projektowania overlay

## Przegląd

Na podstawie przesłanych przykładów profesjonalnych overlayów oraz sugestii użytkownika, rozszerzam kreator overlay o:

1. **Kształty elementów** - możliwość wyboru kształtu dla każdego elementu
2. **Pozycjonowanie X/Y** - precyzyjne przesuwanie elementów według osi
3. **Gotowe warianty overlay** - predefiniowane szablony do wyboru
4. **Naprawa layoutu boost barów** - stała szerokość paska boost, elastyczna przestrzeń na nick

---

## 1. Kształty elementów

### Aktualny stan
Obecnie istnieje `EdgeStyle` z opcjami: `'rounded'`, `'skewed'`, `'sharp'`

### Nowy system kształtów
Rozszerzam opcje kształtów o dodatkowe warianty:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Kształty elementów:                                             │
│                                                                 │
│ ┌────────┐   ╱────────╲   ┌────────┐   (  ────  )   ╔════════╗  │
│ │ SHARP  │   │ SKEWED │   │ROUNDED │   │ PILL   │   ║ DOUBLE ║  │
│ └────────┘   ╲────────╱   └────────┘   (  ────  )   ╚════════╝  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Nowe kształty:**
- `sharp` - ostre rogi (bez zaokrągleń)
- `rounded` - zaokrąglone rogi
- `skewed` - ścięte/skośne krawędzie
- `pill` - pełne zaokrąglenie (jak kapsułka)
- `hexagon` - sześciokąt (popularny w esportowych overlayach)

### Implementacja CSS

```css
/* Pill shape */
.shape-pill {
  border-radius: 9999px;
}

/* Hexagon shape */
.shape-hexagon {
  clip-path: polygon(5% 50%, 15% 0%, 85% 0%, 95% 50%, 85% 100%, 15% 100%);
}

/* Double skew (parallelogram) */
.shape-double-skew {
  clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
}
```

---

## 2. Pozycjonowanie X/Y dla każdego elementu

### Aktualny stan
Tylko niektóre elementy (scoreboard, boostCircle, playerStats) mają pozycję X/Y. 

### Nowe możliwości
Każdy element overlay będzie miał własne pole `position: { x: number, y: number }` oraz opcję `offsetX` i `offsetY` dla precyzyjnego przesuwania.

### Zmiany w typach

```typescript
// Rozszerzenie ElementStyle o pozycję
interface PositionableElement {
  position: { x: number; y: number }; // % ekranu
  offsetX: number; // px offset
  offsetY: number; // px offset
}

// Aktualizacja interfejsów elementów
interface ScoreDisplayConfig extends ElementStyle, PositionableElement {
  // ... istniejące pola
}
```

### UI w StyleEditor

Dla każdego elementu dodaję sekcję "Pozycja":

```text
┌───────────────────────────────────────┐
│ Pozycja i przesunięcie                │
├───────────────────────────────────────┤
│ Pozycja X      [──●───────] 50%       │
│ Pozycja Y      [──────●───] 5%        │
│ Przesunięcie X [──────●───] 0px       │
│ Przesunięcie Y [────●─────] 0px       │
└───────────────────────────────────────┘
```

---

## 3. Gotowe warianty overlay (Templates)

Na podstawie przesłanych przykładów tworzę 4 predefiniowane szablony:

### Template 1: "RLCS Classic" (screen 1)
- Kompaktowy scoreboard z logo
- Boost bary po bokach z wartością liczbową
- Okrągły wskaźnik boosta w prawym dolnym rogu

### Template 2: "Tournament Pro" (screen 2)  
- Szeroki scoreboard z kolorowymi tłami drużyn
- Pasek informacyjny na górze (EXAMPLE TOP TEXT)
- Boost bary z większą czcionką nicków

### Template 3: "Minimalist Dark" (screen 3)
- Ciemny, elegancki design
- Boost bary po bokach z ciemnym tłem
- Wskaźnik boosta jako neonowy okrąg

### Template 4: "Modern Esport"
- Skośne krawędzie (skewed)
- Gradientowe tła drużyn
- Nowoczesny, dynamiczny wygląd

### Implementacja

```typescript
// src/config/overlayTemplates.ts
export const OVERLAY_TEMPLATES: Record<string, OverlayTemplate> = {
  rlcs_classic: {
    name: 'RLCS Classic',
    description: 'Klasyczny styl turniejów Rocket League',
    thumbnail: '/templates/rlcs-classic.png',
    config: { /* pełna konfiguracja */ }
  },
  tournament_pro: { /* ... */ },
  minimalist_dark: { /* ... */ },
  modern_esport: { /* ... */ },
};
```

### UI wyboru szablonu

Nowy komponent w Kreatorze - galeria szablonów:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Wybierz szablon startowy                                         │
├──────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│ │  [img 1]  │ │  [img 2]  │ │  [img 3]  │ │  [img 4]  │          │
│ │           │ │           │ │           │ │           │          │
│ │ RLCS      │ │ Tournament│ │ Minimalist│ │ Modern    │          │
│ │ Classic   │ │ Pro       │ │ Dark      │ │ Esport    │          │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                          [Zastosuj szablon]       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Naprawa layoutu boost barów

### Problem
Obecnie nick i boost bar dzielą jedną elastyczną przestrzeń (`flex-1`), co powoduje że długi nick skraca pasek boosta.

### Rozwiązanie
Stała szerokość dla boost bara, elastyczna przestrzeń dla nicku z `text-overflow: ellipsis`.

### Nowy layout boost bara

```text
┌─────────────────────────────────────────────────────────────┐
│ BUZZ______________________ [████████████ 88 ] │
│ VERYLONGNICKNAME__________ [████████     62 ] │
│ REX_______________________ [███          28 ] │
└─────────────────────────────────────────────────────────────┘
     ↑ flex (elastyczny)           ↑ fixed width (stała)
```

### Implementacja CSS

```tsx
// Aktualny (błędny) kod:
<span className="truncate" style={{ maxWidth: '80px' }}>{player.name}</span>
<div className="flex-1">...</div> // ← boost bar może się kurczyć

// Nowy (poprawiony) kod:
<div className="flex-1 min-w-0">
  <span className="truncate block">{player.name}</span>
</div>
<div className="flex-shrink-0" style={{ width: boostBarWidth }}>
  // boost bar - stała szerokość
</div>
<span className="w-8 text-center flex-shrink-0">{boost}</span>
```

### Nowe pole konfiguracji

```typescript
interface BoostBarsConfig {
  // ... istniejące
  boostBarWidth: number; // nowe pole - stała szerokość boost bara (px)
  nickWidth: 'auto' | number; // 'auto' = flex, number = max-width w px
}
```

---

## Szczegóły techniczne

### Pliki do modyfikacji

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | Dodanie nowych typów kształtów, rozszerzenie interfejsów o position |
| `src/pages/Overlay.tsx` | Aktualizacja renderowania z nowymi kształtami i pozycjami, naprawa boost barów |
| `src/components/creator/OverlayPreview.tsx` | Synchronizacja podglądu z nowymi opcjami |
| `src/components/creator/StyleEditor.tsx` | Dodanie sliderów X/Y dla każdego elementu |
| `src/components/ui/shape-picker.tsx` | Nowy komponent do wyboru kształtu |
| `src/config/overlayTemplates.ts` | Nowy plik z predefiniowanymi szablonami |
| `src/components/creator/TemplateGallery.tsx` | Nowy komponent galerii szablonów |
| `src/pages/Creator.tsx` | Integracja galerii szablonów |

### Nowy typ kształtu

```typescript
export type ElementShape = 
  | 'sharp'     // ostre rogi
  | 'rounded'   // zaokrąglone
  | 'skewed'    // skośne
  | 'pill'      // kapsułka
  | 'hexagon'   // sześciokąt
  | 'parallelogram'; // równoległobok
```

### Funkcja pomocnicza dla kształtów

```typescript
function getShapeStyle(shape: ElementShape, borderRadius: number): React.CSSProperties {
  switch (shape) {
    case 'sharp':
      return { borderRadius: 0 };
    case 'rounded':
      return { borderRadius };
    case 'pill':
      return { borderRadius: 9999 };
    case 'skewed':
      return { 
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        borderRadius: 0 
      };
    case 'hexagon':
      return { 
        clipPath: 'polygon(5% 50%, 15% 0%, 85% 0%, 95% 50%, 85% 100%, 15% 100%)',
        borderRadius: 0 
      };
    case 'parallelogram':
      return { 
        clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
        borderRadius: 0 
      };
  }
}
```

---

## Kolejność implementacji

1. **Rozszerzenie typów** - nowe kształty i pozycje w `broadcast.ts`
2. **ShapePicker component** - nowy komponent UI do wyboru kształtu
3. **Aktualizacja StyleEditor** - dodanie sliderów X/Y i shape picker
4. **Naprawa boost barów** - zmiana layoutu na fixed + flex
5. **Szablony overlay** - utworzenie 4 predefiniowanych konfiguracji
6. **TemplateGallery** - UI do wyboru szablonu
7. **Integracja w Creator** - połączenie wszystkich elementów
8. **Aktualizacja Overlay.tsx i Preview** - obsługa nowych opcji

---

## Efekt końcowy

Po wdrożeniu użytkownik będzie mógł:
- Wybrać kształt dla każdego elementu overlay (6 opcji)
- Precyzyjnie pozycjonować elementy za pomocą sliderów X/Y
- Rozpocząć od jednego z 4 gotowych szablonów
- Korzystać z poprawionych boost barów które nie kurczą się przy długich nickach

