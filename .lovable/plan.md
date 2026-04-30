# Etap 1 — Kill legacy overlay + odpięcie Kreatora

Cel: w UI zostaje tylko Overlay V2. Legacy `/overlay` znika, Kreator (który dziś edytuje tylko legacy) zostaje wyłączony z UI, ale plik nie jest jeszcze kasowany — w razie gdybyś chciał go w Etapie 2 przepiąć pod V2 zamiast wywalać.

## Co robię

1. **Routing (`src/App.tsx`)**
   - Usuwam import `Overlay` i `Creator`.
   - Usuwam trasy `/overlay` i `/creator`. Wejście na te ścieżki trafi na `NotFound`.
   - Przy okazji usuwam zduplikowany `<Route path="*" element={<NotFound />} />`.

2. **Dashboard (`src/pages/Dashboard.tsx`)**
   - Usuwam przycisk „Overlay" (link do `/overlay`).
   - Usuwam przycisk „Kreator" (link do `/creator`).
   - Zostają: Overlay V2, Studio, Admin, Players V2, Logout.
   - Przycisk „Overlay V2" przemianowuję na samo „Overlay" (skoro legacy już nie ma — nie ma z czym mylić). Ikona `Radio` zostaje.

3. **MatchControls (`src/components/dashboard/MatchControls.tsx`)**
   - Usuwam sekcję „Preset overlay" (Select wybierający `overlay_preset_id`). Presety dotyczyły wyłącznie legacy, V2 ma styl hardkodowany. Zostawiam pole `overlay_preset_id` w typie/sesji bez ruszania DB — po prostu nie edytuję go z UI.
   - Usuwam props `presets` i powiązany `useOverlayPresets()` z Dashboardu (import + użycie).

4. **Strona startowa (`src/pages/Index.tsx`)**
   - Karta „Kreator Overlay" → zamieniam na coś sensownego dla obecnego stanu, np. „Studio & MMRivals" (krótki opis modułu turniejowego), żeby nie obiecywać funkcji której nie ma. Reszta strony bez zmian.

5. **Pliki, których NIE ruszam w tym etapie** (świadoma decyzja, czekają na Etap 2):
   - `src/pages/Overlay.tsx`
   - `src/pages/Creator.tsx` + `src/components/creator/*`
   - `src/config/overlayTemplates.ts`
   - hook `useOverlayPresets` w `src/hooks/useBroadcast.tsx`
   - tabela `overlay_presets` w bazie
   
   Powód: są niepodpięte pod żaden aktywny route ani UI, więc nie szkodzą. Skasujemy je hurtem w Etapie 2 razem z decyzją „Kreator pod V2 czy w pełni wywalamy".

## Po wdrożeniu — Twoja decyzja na Etap 2

Powiedz w następnej wiadomości, którą drogą lecimy:

- **A. Pełen kill** — kasuję `Overlay.tsx`, `Creator.tsx`, `components/creator/*`, `overlayTemplates.ts`, `useOverlayPresets`, kolumnę `overlay_preset_id` z `broadcast_sessions` i tabelę `overlay_presets`. Czysto, bez powrotu.
- **B. Kreator → V2** — refaktoruję `ScoreboardV2`, `BoostStackV2`, `PlayerCardV2` tak, by przyjmowały `OverlayConfig` (skew, kolory HSL, fonty), Kreator zaczyna edytować V2, presety V2 lądują w nowej tabeli (`overlay_presets_v2`) albo w istniejącej z polem `version`.

## Szczegóły techniczne

```text
src/App.tsx
  - import Overlay from "./pages/Overlay";        DELETE
  - import Creator from "./pages/Creator";        DELETE
  - <Route path="/overlay" .../>                  DELETE
  - <Route path="/creator" .../>                  DELETE
  - duplikat <Route path="*" .../>                DELETE (zostaje 1)

src/pages/Dashboard.tsx
  - usunięcie 2 <Button> (Overlay legacy, Kreator)
  - { presets } z useOverlayPresets()             DELETE
  - <MatchControls presets={presets} ... />       DELETE prop presets
  - import useOverlayPresets                      DELETE jeśli nieużywany
  - przycisk "Overlay V2" -> label "Overlay"

src/components/dashboard/MatchControls.tsx
  - prop presets: OverlayPreset[]                 DELETE
  - cała sekcja "Preset overlay" (Label+Select)   DELETE
  - import Palette z lucide-react                 DELETE jeśli osierocony
  - import OverlayPreset z types/broadcast        DELETE jeśli nieużywany

src/pages/Index.tsx
  - karta "Kreator Overlay"                       REPLACE tytuł/opis
    np. "Studio turniejowe" / "Bracket, najbliższe i ostatnie mecze MMRivals"
```

Brak zmian w bazie, brak migracji w tym etapie.
