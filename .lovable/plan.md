# Studio — kompletna naprawa layoutu

Implementacja wyłącznie wg dokumentu użytkownika. Bez zmian w Relay, live `/v2/overlay`, Supabase.

## 1. `src/lib/studio-layout.ts` — przepisanie

Nowe stałe (usuwam wszystkie poprzednie):
- `STUDIO_STAGE_WIDTH = 1920`, `STUDIO_STAGE_HEIGHT = 1080`
- `STUDIO_CONTENT_MAX_WIDTH = 956` (jedna szerokość dla wszystkich trybów)
- `STUDIO_CAMERA_SAFE_RIGHT = 450`
- `STUDIO_AVAILABLE_WIDTH = 1470`
- `STUDIO_PADDING_TOP = 24`
- `STUDIO_PADDING_BOTTOM = 32`
- `STUDIO_SIDEBAR_WIDTH = 112`
- Helper `studioContentStyle(obs)` zwracający pełny CSS frame.

Usuwam: `STUDIO_MAX_WIDTH_DEFAULT`, `STUDIO_MAX_WIDTH_POSTGAME`.

## 2. `src/components/studio/StudioContentFrame.tsx` — uproszczenie

- Usunąć propy `maxWidth`, `paddingBottom`.
- Tylko propy `children`, `obs`.
- Outer `div` używa `studioContentStyle(obs)`.
- Inner `div`: `width:100%, maxWidth:956, margin:'0 auto'`.

## 3. `src/pages/StudioRender.tsx`

- Import nowych stałych (usunąć `STUDIO_MAX_WIDTH_POSTGAME`).
- Sidebar bez zmian (już flush left, 112px, borderRadius `0 12px 12px 0`, borderLeft none).
- Wszystkie 4 tryby renderują się w `<StudioContentFrame obs={obs}>` bez dodatkowych propów.
- Usunąć `paddingBottom={24}` z next_3 (frame ma stały 32 bottom).

## 4. `src/components/studio/RecentMatchesTable.tsx`

- Usunąć `max-w-[1100px]` (już zrobione w poprzedniej iteracji — zweryfikować).

## 5. `src/components/studio/BracketView.tsx`

- Usunąć ewentualne lokalne safe-area / paddingRight (kamera daje frame).

## 6. `src/components/studio/PostgameSummary.tsx`

- Owijka root: `<div className="w-full flex flex-col items-center">`.
- Header w `<div className="flex w-full justify-center">` (jest).
- `PostgameGlassPanel` `marginTop: 8` (było 12).
- Zachować `rowGap: 4` w grid, padding `16px 20px`.
- Bez własnych paddingów / `min-h-screen` / `items-start`.

## 7. `src/components/studio/PostgameScoreboardHeader.tsx` — kompakt ~50%

| Element | Było | Będzie |
|---|---|---|
| `TILE_H` | 100 | **50** |
| `BLUE_W` / `ORANGE_W` | 140 | **85** |
| `MID_W` | 260 | **190** |
| fontSize wyniku | 60 | **34** |
| fontSize "PODSUMOWANIE" | 24 | **15**, letterSpacing 0.18em |

- **Usunąć** wiersz `Team names row` (BLUE/ORANGE pod kafelkami) — cały drugi `<div>`.
- Szerokość TOTAL_W = 360.

## 8. `src/components/studio/MatchCard.tsx` (opcjonalnie)

Jeśli kolejka next_3 nadal ucięta po zmniejszeniu top padding:
- Root wrapper `p-6` → `p-4`.
- HeaderPanel `mb-8` → `mb-4`.

Najpierw zweryfikować wizualnie po pkt. 1-7; zmienić tylko jeśli kolejka nie mieści się w 1080p.

## Pliki edytowane

- `src/lib/studio-layout.ts` (rewrite)
- `src/components/studio/StudioContentFrame.tsx` (rewrite)
- `src/pages/StudioRender.tsx` (usunąć propy z frame)
- `src/components/studio/PostgameSummary.tsx` (drobne)
- `src/components/studio/PostgameScoreboardHeader.tsx` (kompakt + usunąć BLUE/ORANGE)
- `src/components/studio/BracketView.tsx` (sprawdzić/usunąć duplikat paddingRight)
- `src/components/studio/RecentMatchesTable.tsx` (sprawdzić — `max-w-[1100px]` już usunięty)
- `src/components/studio/MatchCard.tsx` (warunkowo, po weryfikacji)

## Nie edytuję

`Relay.tsx`, `ScoreboardV2.tsx`, `/v2/overlay`, Supabase, sidebar layout, hooks, twitch-poll.
