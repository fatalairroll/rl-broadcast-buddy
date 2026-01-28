
# Plan: Naprawa synchronizacji presetów + Pełne zarządzanie gradientami

## Zidentyfikowany problem z presetami

Przeanalizowałem kod i znalazłem źródło problemu:

**W pliku `Overlay.tsx` linia 49:**
```typescript
const [config] = useState<OverlayConfig>(defaultOverlayConfig);
```

Overlay zawsze używa domyślnej konfiguracji zamiast pobierać preset powiązany z sesją. Sesja ma pole `overlay_preset_id` w bazie danych, ale nigdzie nie jest ono wykorzystywane do załadowania odpowiedniej konfiguracji.

**Przepływ danych powinien wyglądać tak:**
```text
Kreator → Zapisuje preset → broadcast_sessions.overlay_preset_id
                                    ↓
Dashboard → Wybiera preset → Aktualizuje overlay_preset_id
                                    ↓
Overlay → Pobiera preset na podstawie overlay_preset_id → Renderuje z zapisaną konfiguracją
```

**Aktualnie:**
```text
Kreator → Zapisuje preset (OK)
Overlay → Ignoruje preset → Używa defaultOverlayConfig (BŁĄD)
```

---

## 1. Naprawa synchronizacji presetów

### Zmiany w `src/hooks/useBroadcast.tsx`

Rozszerzenie hooka `useBroadcast` o:
- Pobieranie presetu na podstawie `overlay_preset_id` z sesji
- Zwracanie konfiguracji overlay wraz z sesją

```typescript
export function useBroadcast(sessionId?: string) {
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>(defaultOverlayConfig);
  
  // Po pobraniu sesji, pobierz też powiązany preset
  useEffect(() => {
    if (session?.overlay_preset_id) {
      fetchPreset(session.overlay_preset_id);
    }
  }, [session?.overlay_preset_id]);
  
  return {
    // ... istniejące
    overlayConfig, // NOWE - konfiguracja z presetu
  };
}
```

### Zmiany w `src/pages/Overlay.tsx`

Zamiast:
```typescript
const [config] = useState<OverlayConfig>(defaultOverlayConfig);
```

Nowy kod:
```typescript
const { session, gameState, overlayConfig } = useBroadcast(sessionId);
const config = overlayConfig; // Używa konfiguracji z presetu
```

### Dodanie wyboru presetu w Dashboard

W panelu MatchControls dodanie dropdown do wyboru aktywnego presetu dla sesji:
- Lista dostępnych presetów
- Po wyborze: aktualizacja `overlay_preset_id` w sesji
- Automatyczna synchronizacja z Overlay przez Realtime

---

## 2. Pełne zarządzanie gradientami

### Nowy interfejs gradientu

Rozszerzenie typów w `src/types/broadcast.ts`:

```typescript
export interface GradientStop {
  color: string;
  position: number; // 0-100%
}

export interface GradientConfig {
  enabled: boolean;
  type: 'linear' | 'radial';
  angle: number; // 0-360 dla linear
  stops: GradientStop[];
}

// Rozszerzenie ElementStyle
export interface ElementStyle {
  backgroundColor: string;
  backgroundGradient?: GradientConfig; // NOWE
  // ... reszta
}
```

### Nowy komponent `GradientEditor`

Utworzenie `src/components/ui/gradient-editor.tsx`:

**Funkcje:**
- Przełącznik: kolor jednolity / gradient
- Wybór typu: liniowy / radialny
- Suwak kąta gradientu (0-360 stopni)
- Lista stopów gradientu z:
  - ColorPicker dla każdego stopu
  - Suwak pozycji (0-100%)
  - Przycisk usunięcia stopu
- Przycisk dodania nowego stopu
- Podgląd gradientu na żywo

**Wizualizacja UI:**
```text
┌─────────────────────────────────────────────────────────┐
│ Tło elementu                                            │
├─────────────────────────────────────────────────────────┤
│ ○ Kolor jednolity   ● Gradient                          │
├─────────────────────────────────────────────────────────┤
│ Typ:    ○ Liniowy  ● Radialny                           │
│ Kąt:    [────●──────────] 45°                           │
├─────────────────────────────────────────────────────────┤
│ Stopy gradientu:                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [■ #3B82F6]  [────●────] 0%   [🗑]                │   │
│ │ [■ #8B5CF6]  [──────●──] 50%  [🗑]                │   │
│ │ [■ #EC4899]  [────────●] 100% [🗑]                │   │
│ └──────────────────────────────────────────────────┘   │
│                                     [+ Dodaj stop]      │
├─────────────────────────────────────────────────────────┤
│ Podgląd:                                                │
│ ┌──────────────────────────────────────────────────┐   │
│ │░░░░░▓▓▓▓▓▓████████████████████▓▓▓▓▓░░░░░│   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Integracja w StyleEditor

Zamiana pojedynczego `ColorPicker` na `GradientEditor` dla:
- Scoreboard (`backgroundColor`)
- ScoreDisplay (`backgroundColor`)
- TimerDisplay (`backgroundColor`)
- BoostBars (`backgroundColor`)
- PlayerStats (`backgroundColor`)

### Funkcja generowania CSS

```typescript
function getBackgroundStyle(
  backgroundColor: string, 
  gradient?: GradientConfig
): React.CSSProperties {
  if (!gradient?.enabled || !gradient.stops.length) {
    return { backgroundColor };
  }
  
  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  
  if (gradient.type === 'linear') {
    return { 
      background: `linear-gradient(${gradient.angle}deg, ${stops})` 
    };
  }
  
  return { 
    background: `radial-gradient(circle, ${stops})` 
  };
}
```

---

## Pliki do modyfikacji

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | Dodanie `GradientConfig`, rozszerzenie interfejsów elementów |
| `src/hooks/useBroadcast.tsx` | Dodanie pobierania presetu i zwracania `overlayConfig` |
| `src/pages/Overlay.tsx` | Użycie `overlayConfig` z hooka zamiast defaulta, obsługa gradientów |
| `src/components/ui/gradient-editor.tsx` | Nowy komponent edytora gradientów |
| `src/components/creator/StyleEditor.tsx` | Zamiana ColorPicker na GradientEditor dla tła |
| `src/components/creator/OverlayPreview.tsx` | Obsługa renderowania gradientów |
| `src/components/dashboard/MatchControls.tsx` | Dodanie dropdown wyboru presetu |

---

## Kolejność implementacji

1. **Naprawa typów** - dodanie `GradientConfig` do broadcast.ts
2. **Rozszerzenie useBroadcast** - pobieranie presetu i konfiguracji
3. **Naprawa Overlay.tsx** - użycie konfiguracji z presetu
4. **Komponent GradientEditor** - nowy UI do zarządzania gradientami
5. **Aktualizacja StyleEditor** - integracja GradientEditor
6. **Dodanie wyboru presetu** - dropdown w MatchControls
7. **Aktualizacja renderowania** - obsługa gradientów w Overlay i Preview

---

## Efekt końcowy

Po wdrożeniu:
- Presety zapisane w kreatorze będą automatycznie odzwierciedlane w overlayu
- Możliwość wyboru aktywnego presetu z poziomu Dashboard
- Pełna kontrola nad gradientami:
  - Typ (liniowy/radialny)
  - Kąt gradientu
  - Wiele stopów kolorów z pozycjami
  - Podgląd w czasie rzeczywistym
