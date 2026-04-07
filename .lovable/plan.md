

# Plan: Redesign tabeli ostatnich meczów w stylu MatchCard

## Cel

Przebudować `RecentMatchesTable` tak, aby wizualnie pasowała do kart "Next Matches" — skewed lines, glassmorphism, gradienty, poświata zwycięzcy, badge rundy, Avg MMR i seed przy drużynach, animacje Framer Motion ze stagger effect.

## Zmiany w `src/components/studio/RecentMatchesTable.tsx`

### Układ wiersza meczu

Każdy wiersz to pochylony pasek (`skewX(-5deg)`) z glassmorphism (`bg-slate-900/90`, `backdrop-blur`, border `rgba(255,255,255,0.08)`), górna krawędź z gradientem niebiesko-pomarańczowym.

```text
┌────────────────────────────────────────────────────────────┐
│ #1  Team Alpha  Avg 1450  │  2 : 1  │  Avg 1320  Team Beta  #2 │
│                           │ Runda 1 │                           │
└────────────────────────────────────────────────────────────┘
         ↑ skew -5deg, glass bg, gradient top border
```

Kolumny:
- **Seed** (mały badge, np. `#1`)
- **Team A name** (wyrównane do prawej, font-esports uppercase)
- **Avg MMR A** (mały tekst muted)
- **Centralny blok wyniku** — gradient pomarańczowo-niebieski (`linear-gradient(90deg, blue, orange)`), wynik duży + badge "Runda X Mecz Y" pod spodem
- **Avg MMR B** (mały tekst muted)
- **Team B name** (wyrównane do lewej)
- **Seed B**

### Zwycięzca

- Nazwa pogrubiona (`font-bold`)
- Subtelna poświata: `text-shadow` + delikatny `box-shadow` w kolorze strony (niebieski `#2563eb` / pomarańczowy `#f97316`)
- Przegrany: `text-slate-500`, zwykła waga

### Centralny blok wyniku

- Gradient tła: `linear-gradient(90deg, rgba(37,99,235,0.6), rgba(249,115,22,0.6))`
- Skew `-5deg` (jak reszta)
- Wynik: duży font, biały
- Pod wynikiem: mały badge "Runda X" lub "Runda X Mecz Y"

### Animacje (Framer Motion)

- `AnimatePresence` + `motion.div` na liście
- Stagger: każdy wiersz z `delay: index * 0.08`
- Nowy mecz na górze: `initial={{ opacity: 0, x: -40, skewX: '-8deg' }}` → `animate={{ opacity: 1, x: 0, skewX: '-5deg' }}`
- Exit: `exit={{ opacity: 0, x: 40 }}`
- `layout` prop dla płynnego przesuwania gdy nowy mecz wypycha stary

### Avg MMR i Seed

- Seed: mały badge (`text-xs`, muted color) przy krawędzi wiersza
- Avg MMR: `text-xs font-mono` obok nazwy drużyny, format np. `1450 MMR`

## Pliki

| Plik | Zmiana |
|------|--------|
| `src/components/studio/RecentMatchesTable.tsx` | Pełna przebudowa — skewed glassmorphism rows, gradient score block, glow winner, stagger animations, avg MMR + seed display |

