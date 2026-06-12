# Poprawki Glass Overlay

## 1. Gauge boosta — 100 px wyżej

`src/lib/v2-glass-preset.ts`:
- `GLASS_OVERLAY_CONFIG.boostGauge.position.offsetY`: `524` → `424`
- `GLASS_PRESET_VERSION`: `4` → `5` (wymusza nadpisanie wiersza systemowego presetu w DB przez `ensureGlassPreset`)

## 2. Przesuwanie rangi — offset przez margin bezpośrednio na `motion.div`

**Diagnoza:** ikona rangi to `motion.img`, framer-motion animuje `y`/`opacity` (czyli `transform`) i nadpisuje statyczny `transform: translate(calc(-50%+ox), calc(-50%+oy))`. Wizualnie offset znika po swapie ranga↔GOL.

**Naprawa:** przenieść offset na `marginLeft`/`marginTop` (framer-motion nie dotyka marginesów) bezpośrednio na elemencie `motion.div`, który jest bezpośrednim dzieckiem `AnimatePresence` (wymóg framera: dzieci z `key` muszą być komponentami motion — żadnego pośredniego, statycznego wrappera, bo zabije to exit-animację).

**`src/components/v2/glass/GlassPlayerCard.tsx`, `CardBody`** — w boxie 84 px:

```tsx
<AnimatePresence mode="wait">
  {inGoal ? (
    <motion.div key="goal"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: GOAL_SWAP_MS / 1000, ease: 'easeOut' }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...glassName, ...glassScoreDigitWin,
        fontSize: 24, letterSpacing: '.04em',
      }}
    >
      GOL!
    </motion.div>
  ) : rankIconSrc ? (
    <motion.div key="rank"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: GOAL_SWAP_MS / 1000, ease: 'easeIn' }}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        marginLeft: -rankSize / 2 + rankOx,
        marginTop:  -rankSize / 2 + rankOy,
        width: rankSize, height: rankSize,
      }}
    >
      <img src={rankIconSrc} alt={display.rank ?? ''}
           width={rankSize} height={rankSize}
           style={{ display: 'block', objectFit: 'contain' }}
           draggable={false} />
    </motion.div>
  ) : null}
</AnimatePresence>
```

Zasady:
- Gałąź "GOL!" — wyłącznie wycentrowana (`inset:0` + flex center), bez `ox/oy`.
- Gałąź rangi — pozycja przez `left/top: 50%` + ujemne marginesy z dodanymi `rankOx`/`rankOy`. `motion.div` animuje tylko `opacity` i `y` (transform), marginesy zostają nietknięte → offset trwały także po exit/enter.
- `size = rankIconSize ?? 30`, `ox = rankOffsetX ?? 0`, `oy = rankOffsetY ?? 0` — istniejące pola, bez nowych.
- Box 84 px z `overflow: hidden` — bez zmian; skrajne wartości przycinają, nie rozpychają.

## Czego nie ruszam

Typy configu, kontrolki w `StyleEditorV2`, detektor gola, timery/stany karty, resolver pozycji, Studio, `GlassBoostGauge`, `GlassBoostPanel`, `GlassScorebar`, sceny użytkowników, tokeny.

## Pliki

- `src/lib/v2-glass-preset.ts`
- `src/components/v2/glass/GlassPlayerCard.tsx`

## DoD

- Suwaki Przesunięcie X/Y w `/creator` przesuwają ikonę na żywo i offset zostaje PO swapie ranga↔GOL (test: wymusić gola).
- Slider rozmiaru działa; ikona przycina się w boxie 84 px, layout nierozepchnięty.
- "GOL!" zawsze wycentrowany, niezależny od `ox/oy`.
- Brak warningów framer-motion (key na bezpośrednich dzieciach `AnimatePresence`, exit gra).
- Gauge 100 px wyżej; preset v5; wiersz DB zaktualizowany przy najbliższym wejściu w `/creator`.
- TS/lint czysto.
