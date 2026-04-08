

# Plan: Przenieś głosy na zewnątrz boxów + naprawa przycisku ankiety

## Zmiany

### 1. Naprawa przycisku "Rozpocznij ankietę" — `src/pages/StudioRender.tsx`

- Usunąć `overflow-hidden` z kontenera sidebara (linia ~168) → `className="flex flex-col"`
- Owinąć `motion.button` w `<AnimatePresence>` aby animacja wejścia/wyjścia działała poprawnie

### 2. Głosy na zewnątrz boxów drużyn — `src/components/studio/MatchCard.tsx`

**TeamBanner:**
- Usunąć `pollPct` z wnętrza banera
- Owinąć baner we wrapper `<div className="flex items-center">`
- Dla `side === 'a'` gdy `pollPct` istnieje: renderować po lewej stronie banera element z ikoną `BarChart3` (size 16) + `{pollPct}%`
- Styl: biały kolor, `text-base`, `font-esports font-bold uppercase tracking-[0.15em]`, `marginRight: 8px`

**UpcomingQueueRow:**
- Usunąć ikonę i procent z wnętrza wiersza
- Owinąć wiersz we wrapper flex z informacją o głosach po lewej (gdy `pollPct` istnieje)
- Styl: biały, `text-base`, `font-esports font-bold`, `transform: skewX(-5deg)` dopasowany do wiersza

