

# Plan: Dynamiczne skośne prostokąty graczy w MatchCard

## Podsumowanie

Całkowita przebudowa `MatchCard` — zamiast tabelarycznego widoku, każdy gracz jest wyświetlany jako wysoki, pochylony prostokąt (~15°) z gradientem kolorystycznym drużyny. Układ horyzontalny: `[Gracz1][Gracz2] VS [Gracz3][Gracz4]`.

## Układ wizualny

```text
    Drużyna A                          Drużyna B
 ┌─────────┐ ┌─────────┐         ┌─────────┐ ┌─────────┐
 │  /    /  │ │  /    /  │   VS   │  /    /  │ │  /    /  │
 │ NICK    │ │ NICK    │         │ NICK    │ │ NICK    │
 │ RANK    │ │ RANK    │         │ RANK    │ │ RANK    │
 │ MMR     │ │ MMR     │         │ MMR     │ │ MMR     │
 └─────────┘ └─────────┘         └─────────┘ └─────────┘

 Pomarańczowe              Niebieskie
 (gradient)                (gradient)
```

- Prostokąty pochylone CSS `transform: skewX(-15deg)`, zawartość wewnątrz `skewX(15deg)` żeby tekst był prosty
- Gracze 2 i 3 blisko "VS" — mniejszy gap
- Nazwy drużyn nad grupami prostokątów
- Header meczu (Round, status) nad całością

## Kolory gradientów

- **Drużyna A (pomarańczowa)**: `linear-gradient(180deg, #F97316, #EA580C)` — ciepły pomarańcz
- **Drużyna B (niebieska)**: `linear-gradient(180deg, #3B82F6, #1D4ED8)` — głęboki niebieski

## Zawartość prostokąta gracza (od góry)

1. Nick (bold, biały)
2. RankIcon (badge)
3. MMR (mono, mniejszy)

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/components/studio/MatchCard.tsx` | Pełna przebudowa — nowy układ z pochylonymi prostokątami graczy, usunięcie `TeamSide`, nowy komponent `PlayerCard` inline |
| `src/components/studio/PlayerRow.tsx` | Bez zmian (zachowany dla ewentualnego użycia w innych widokach) |

## Detale techniczne

- `PlayerCard` — nowy komponent wewnątrz `MatchCard.tsx`:
  - `transform: skewX(-15deg)` na kontenerze
  - `transform: skewX(15deg)` na zawartości (prostuje tekst)
  - Wymiary: ~120px szerokości × ~180px wysokości
  - Gradient tła zależy od strony (A/B)
  - Framer Motion `staggerChildren` dla animacji wejścia

- Układ główny: `flex items-center` z różnymi gap-ami:
  - `gap-2` między graczami tej samej drużyny
  - `gap-1` między graczami a VS
  - VS: duży, bold, lekko przezroczysty

- Responsywność: stała szerokość dopasowana do OBS overlay (nie musi być responsive)

