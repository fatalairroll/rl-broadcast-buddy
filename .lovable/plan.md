

## Plan: Zwiększenie kontrastu kart graczy i czytelności MMR

### Zmiany w `src/components/studio/MatchCard.tsx`

1. **Ciemniejsze tło karty** — w `PlayerPanel`, zmienić `glassBg` z `rgba(10,15,30,0.75)` / `rgba(30,15,10,0.75)` na wersje z wyższą opacity (~0.85), oraz nagłówek nicku z `rgba(0,0,0,0.5)` na `rgba(0,0,0,0.75)`.

2. **Silniejszy blur** — w `PlayerPanel`, zmienić `backdropFilter: 'blur(10px)'` na `'blur(15px)'`.

3. **MMR czytelniejszy** — w `MmrHeroText`:
   - `mixBlendMode: 'overlay'` → `'normal'`
   - `opacity` obu drużyn → `0.25`
   - `color` → `#ffffff`

### Plik do edycji
- `src/components/studio/MatchCard.tsx`

