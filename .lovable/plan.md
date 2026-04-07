

# Plan: Stała szerokość banerów drużyn z precyzyjnym wyrównaniem geometrycznym

## Kontekst

Karty graczy mają `width: 160px`, `height: 320px`, `skewX(-5deg)`. Przy skew -5deg, tangens wynosi ~0.0875, co daje przesunięcie dolnej krawędzi: `320 * 0.0875 ≈ 28px`. Banery obecnie mają `w-full` i zależą od wrappera — co powoduje niestabilne wyrównanie.

## Zmiany w `src/components/studio/MatchCard.tsx`

### 1. TeamBanner — stała szerokość + geometryczny offset

- Ustawić stałą szerokość banera: **450px**
- Zachować `skewX(-5deg)` (identycznie jak karty)
- Dodać CSS custom property `--skew-offset` obliczaną jako `320px * tan(5deg) ≈ 28px`
- Dla drużyny A (niebieskiej): banner wyrównany do prawej (`align-self: flex-end`), z `marginRight` kompensującym skew offset dolnej krawędzi prawej karty
- Dla drużyny B (pomarańczowej): banner wyrównany do lewej (`align-self: flex-start`), z `marginLeft` kompensującym skew offset dolnej krawędzi lewej karty
- Dodać subtelny `box-shadow` skierowany w dół: `0 4px 12px rgba(0,0,0,0.4)`

### 2. Typografia banerów

- Tekst wyrównany do krawędzi bliższej osi VS:
  - Niebieski: `text-align: right`, `paddingRight: 20px`
  - Pomarańczowy: `text-align: left`, `paddingLeft: 20px`
- Gradient spójny z kartami, z mocniejszym nasyceniem przy krawędzi VS

### 3. Wrapper drużyn — potwierdzenie struktury

- `team-blue-wrapper`: `flex flex-col items-end` — banner automatycznie wyrównuje prawą krawędź
- `team-orange-wrapper`: `flex flex-col items-start` — banner wyrównuje lewą krawędź
- Banner w `div` z `marginTop: auto` (już jest) — zapewnia przyleganie do dolnej krawędzi kart

### Matematyka offsetu

```text
Kąt skew: -5deg
tan(5°) ≈ 0.0875
Wysokość karty: 320px
Offset dolnej krawędzi: 320 * 0.0875 ≈ 28px

Dolna-prawa krawędź karty jest przesunięta o ~28px w lewo
względem górnej-prawej. Banner musi to kompensować
poprzez marginRight (A) lub marginLeft (B).
```

## Plik

| Plik | Zmiana |
|------|--------|
| `src/components/studio/MatchCard.tsx` | `TeamBanner`: stała width 450px, skewX(-5deg), margin offset ~28px, box-shadow w dół, tekst do osi VS |

