

# Plan: Redesign kart graczy — MMR hero, skew, glassmorphism

## Zmiany

### 1. `src/components/studio/MatchCard.tsx` — PlayerPanel

**Usunięcie tekstury**: Usunąć klasę `brushed-metal` z paneli.

**Nick wyśrodkowany względem górnej krawędzi**: Ponieważ karta ma `clipPath: polygon(15% 0, 100% 0, 85% 100%, 0 100%)`, górna krawędź zaczyna się od 15% — nick musi być wyśrodkowany względem zakresu 15%-100% (środek ~57.5% od lewej), co wymaga przesunięcia `padding-left` lub odpowiedniego offsetu.

**MMR jako "Hero Element"**: Duży pionowy tekst MMR zajmujący ~70% wysokości karty:
- `writing-mode: vertical-rl` z obrotem liter
- Font Rajdhani/Inter Black, bardzo duży (~80-100px)
- `mix-blend-mode: overlay`, `opacity: 0.35`
- Ciemniejszy odcień koloru drużyny — efekt "wytłoczenia"
- Pozycja absolutna za ikoną rangi (warstwa tła)

**Premium detale**:
- `border: 1px solid rgba(255,255,255,0.1)`
- `box-shadow` glow w kolorze drużyny (niebieski/pomarańczowy)
- `transform: skewX(-5deg)` na całej karcie (zawartość wewnątrz counter-skew `skewX(5deg)`)
- `backdrop-filter: blur(10px)` (glassmorphism)

**Nazwy drużyn**: Białe (`text-white`), przesunięte niżej pod karty z większym `mt`, wycentrowane pod odpowiednimi grupami kart (nie justify-between na pełnej szerokości).

**Round index**: Zweryfikować `match.round_index + 1` — wartość pochodzi z API i jest 0-indexed, więc +1 jest poprawne.

### 2. `src/components/studio/MatchCard.tsx` — TbdPanel
- Analogiczne zmiany: skew, border, bez tekstury.

### 3. `src/index.css` — ewentualne drobne poprawki
- Usunięcie `.brushed-metal` jeśli nie jest już potrzebna nigdzie indziej (sprawdzę użycia).

## Hierarchia warstw w karcie (z-index, od tyłu):
1. Gradient tła drużyny
2. Smoke layers (animowane)
3. **MMR hero text** (pionowy, blend overlay, opacity 0.35)
4. Nick (góra), Ikona rangi (środek), Nazwa rangi (pod ikoną)

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/components/studio/MatchCard.tsx` | Usunięcie tekstury, MMR hero, skew, glassmorphism, białe nazwy drużyn, centrowanie nicku |
| `src/index.css` | Opcjonalnie usunięcie `.brushed-metal` jeśli nieużywana |

