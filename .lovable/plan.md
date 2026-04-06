

# Plan: Ikony rang z obrazkami i mapowanie MMR

## Podsumowanie

Skopiowanie wszystkich 22 ikon rang do projektu, stworzenie systemu mapowania MMR → ranga, i zamiana tekstowych badge'ów w `RankIcon` na prawdziwe obrazki rang.

## Pliki ikon do skopiowania

22 plików `.webp` z `user-uploads://` do `src/assets/ranks/`:
- Bronze_I.webp, Bronze_II.webp, Bronze_III.webp
- Silver_I.webp, Silver_II.webp, Silver_III.webp
- Gold_I.webp, Gold_II.webp, Gold_III.webp
- Platinum_I.webp, Platinum_II.webp, Platinum_III.webp
- Diamond_I.webp, Diamond_II.webp, Diamond_III.webp
- Champion_I.webp, Champion_II.webp, Champion_III.webp
- Grand_Champion_I.webp, Grand_Champion_II.webp, Grand_Champion_III.webp
- Supersonic_Legend.webp

## Nowy plik: `src/lib/rank-utils.ts`

- Tabela MMR → nazwa rangi (22 pozycji z progami z dostarczonej tabeli)
- Funkcja `getRankFromMmr(mmr: number): string` — zwraca nazwę rangi na podstawie MMR
- Mapa nazw rang → importy obrazków (ES6 imports z `@/assets/ranks/`)

## Zmiany w `src/components/studio/RankIcon.tsx`

- Zamiana tekstowego badge'a na `<img>` z ikoną rangi
- Prop `size`: `sm` = 24px, `lg` = 64px
- Opcjonalny tekst rangi pod ikoną (tylko w `lg`)
- Fallback na tekstowy badge jeśli ikona nie znaleziona

## Zmiany w `src/components/studio/MatchCard.tsx`

- W `PlayerPanel`: użycie `getRankFromMmr()` gdy `rank` z API jest null ale MMR jest dostępny
- RankIcon z obrazkiem zamiast tekstu jako centralny element panelu

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/assets/ranks/*.webp` | 22 nowych plików ikon |
| `src/lib/rank-utils.ts` | Nowy — mapowanie MMR→ranga, importy obrazków |
| `src/components/studio/RankIcon.tsx` | Przebudowa na obrazki zamiast tekstowych badge'ów |
| `src/components/studio/MatchCard.tsx` | Użycie `getRankFromMmr` jako fallback |

