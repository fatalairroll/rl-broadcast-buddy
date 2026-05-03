## Plan

Zostawiam obecny system kotwicy scoreboardu (timer wycentrowany na 960+offsetX). Dodaję tylko niezależne offsety dla **boxa timera** i dla **tekstu** w środku — bez wpływu na pozycje Blue/Orange.

### 1) Typy — `src/types/overlayV2.ts`
W `TimerStyle` dodać (default `0`):
- `boxOffsetX`, `boxOffsetY` — przesunięcie kafelka timera (inline i detached).
- `textOffsetX`, `textOffsetY` — przesunięcie samego napisu (i etykiety OT) wewnątrz kafelka.

Zaktualizować `defaultOverlayV2Config.timer` oraz `mergeV2Config` (fallback `?? 0`), żeby stare configi nie wybuchły.

### 2) Renderer — `src/components/v2/ScoreboardV2.tsx`
- W `timerNode`: opakować zawartość kafelka (span z czasem + label OT) dodatkowym wrapperem z `transform: translate(textOffsetX, textOffsetY)` (zastosowanym po `skewInner`, żeby nie wykrzywiało ruchu).
- Inline mode: do wrappera kafelka dołożyć `translate(boxOffsetX, boxOffsetY)` razem z istniejącym `translateX(-50%)` → `transform: translate(calc(-50% + Xpx), Ypx)`. Blue/Orange pozostają na `halfCenter` — nie ruszają się.
- Detached mode: do stylu z `positionToStyle(config.timer.position)` doliczyć `translate(boxOffsetX, boxOffsetY)`.

### 3) Edytor — `src/components/creator/StyleEditorV2.tsx` (sekcja `timer`)
Dodać dwie pod‑sekcje:
- **Pozycja boxa** (zawsze widoczna):
  - `Box - offset X` (-300..300 px)
  - `Box - offset Y` (-200..200 px)
- **Pozycja tekstu**:
  - `Tekst - offset X` (-100..100 px)
  - `Tekst - offset Y` (-60..60 px)

### Pliki
- `src/types/overlayV2.ts`
- `src/components/v2/ScoreboardV2.tsx`
- `src/components/creator/StyleEditorV2.tsx`

Bez zmian w bazie — pola jadą w JSON‑owym configu overlaya.
