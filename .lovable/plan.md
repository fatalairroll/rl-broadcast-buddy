

# Plan: Skosy po obu stronach, naprawa kropek serii, gradient dla wiecej elementow

## 1. Regulowane skosy po obu stronach detached boxa

### Problem
Obecnie `getDetachedBoxShapeStyle` skosi tylko zewnetrzna krawedz, a wewnetrzna jest zawsze prosta. Uzytkownik chce niezaleznej kontroli obu stron.

### Rozwiazanie
Dodac drugi parametr `boxSkewOffsetInner` do `TeamNameConfig` kontrolujacy nachylenie wewnetrznej krawedzi (od strony scoreboardu). Zmodyfikowac `getDetachedBoxShapeStyle` aby przyjmowal oba offsety.

**Pliki:**

- `src/types/broadcast.ts` -- dodanie `boxSkewOffsetInner?: number` (domyslnie 0) do `TeamNameConfig`, zmiana nazwy istniejacego na jasniejsza: `boxSkewOffset` pozostaje jako zewnetrzny
- `src/components/ui/shape-picker.tsx` -- modyfikacja `getDetachedBoxShapeStyle`: nowy parametr `skewOffsetInner`, clip-path uzywa obu wartosci:
  - Team A (left): `polygon(outerSkew 0, 100% 0, calc(100% - innerSkew) 100%, 0 100%)`  
  - Team B (right): `polygon(innerSkew 0, 100% 0, calc(100% - outerSkew) 100%, 0 100%)`
- `src/components/creator/StyleEditor.tsx` -- dodanie drugiego suwaka "Nachylenie wewnetrzne" pod istniejacym "Nachylenie krawedzi", widoczny dla parallelogram/skewed
- `src/pages/Overlay.tsx` i `src/components/creator/OverlayPreview.tsx` -- przekazanie nowego parametru do `getDetachedBoxShapeStyle`
- `src/config/overlayTemplates.ts` -- dodanie `boxSkewOffsetInner: 0` do szablonow

## 2. Naprawa widocznosci kropek serii po wyodrebnieniu nazwy druzyny

### Problem
Kropki serii (series dots) sa renderowane wewnatrz bloku `!config.teamXName.detached`, wiec znikaja gdy nazwa druzyny jest wyodrebniona.

### Rozwiazanie
Gdy `detached === true`, renderowac kropki serii wewnatrz detached boxa (pod nazwa druzyny) lub obok niej. Kropki beda dodane do detached box divow w obu plikach renderujacych.

**Pliki:**

- `src/pages/Overlay.tsx` -- w blokach Team A/B Detached Box (linie ~396-461), dodac renderowanie kropek serii pod nazwa druzyny, analogicznie do tego jak sa renderowane w trybie inline
- `src/components/creator/OverlayPreview.tsx` -- identyczna zmiana w blokach detached boxow (linie ~357-415)

## 3. Gradient dla tla detached boxa nazwy druzyny

### Problem
Detached box ma tylko `ColorPicker` dla tla. Brakuje mozliwosci ustawienia gradientu.

### Rozwiazanie
Dodac `boxBackgroundGradient?: GradientConfig` do `TeamNameConfig` i zamienic `ColorPicker` na `GradientEditor` w sekcji detached box. W renderowaniu uzyc `getBackgroundStyle()`.

**Pliki:**

- `src/types/broadcast.ts` -- dodanie `boxBackgroundGradient?: GradientConfig` do `TeamNameConfig`
- `src/components/creator/StyleEditor.tsx` -- zamiana `ColorPicker` "Tlo boxa" (linia ~473) na `GradientEditor`
- `src/pages/Overlay.tsx` -- zamiana `backgroundColor: config.teamXName.boxBackgroundColor` na `...getBackgroundStyle(boxBgColor, boxBgGradient)` w detached boxach
- `src/components/creator/OverlayPreview.tsx` -- analogiczna zmiana
- `src/config/overlayTemplates.ts` -- aktualizacja szablonow

## Podsumowanie zmian w plikach

| Plik | Zmiany |
|------|--------|
| `src/types/broadcast.ts` | `boxSkewOffsetInner`, `boxBackgroundGradient` |
| `src/components/ui/shape-picker.tsx` | Dwustronny skos w `getDetachedBoxShapeStyle` |
| `src/components/creator/StyleEditor.tsx` | Suwak wewnetrznego skosu, GradientEditor dla boxa |
| `src/pages/Overlay.tsx` | Dwustronny skos, kropki serii w detached, gradient boxa |
| `src/components/creator/OverlayPreview.tsx` | j.w. |
| `src/config/overlayTemplates.ts` | Nowe domyslne wartosci |

