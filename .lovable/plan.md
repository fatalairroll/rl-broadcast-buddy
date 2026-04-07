

# Plan: Zmiana układu karty gracza — ikona pod nick, MMR pionowy niżej, usunięcie etykiet

## Zmiany

### 1. `src/components/studio/MatchCard.tsx` — PlayerPanel

- **Usunięcie MMR na dole**: Usunąć sekcję `{mmr} MMR` (linie 160-167)
- **Nowa hierarchia contentu** (góra→dół):
  1. **Nick** — bez zmian, u góry
  2. **Ikona rangi** — zaraz pod nickiem (nie w centrum karty), bez labela (`showLabel={false}`)
  3. **Puste miejsce** — reszta karty wolna dla MMR hero
- **MmrHeroText** — zmienić pozycjonowanie: zamiast `inset-0` + `items-center`, ustawić `top: 45%` do `bottom: 0` (dolna ~55% karty), dodać `letterSpacing: '0.3em'` dla większych odstępów między cyframi

### 2. `src/components/studio/MatchCard.tsx` — MmrHeroText

- Zmienić kontener z `absolute inset-0` na `absolute left-0 right-0 bottom-0` z `top: 45%`
- Zwiększyć `letterSpacing` z `0.05em` na `0.3em` dla większych odstępów między cyframi
- Tekst zaczyna się pod rangą i kończy na dole karty

### 3. `src/components/studio/RankIcon.tsx` — bez zmian w pliku

W `MatchCard.tsx` zmienić wywołanie `RankIcon` z `showLabel` na `showLabel={false}` (lub usunąć prop), aby nie wyświetlać nazwy rangi pod ikoną.

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/components/studio/MatchCard.tsx` | Usunięcie MMR na dole, ikona rangi pod nick bez labela, MmrHeroText w dolnej części karty z większym letter-spacing |

