

# Plan: Aktualizacja API — nowe pola i naprawa rang

## Problem

1. API zwraca nowe pola (`nick_in_game`, `rlstats_url`) nieobecne w typach
2. API zwraca rangi w formacie `"Diamond 1"` (arabskie cyfry), a kod używa `"Diamond I"` (rzymskie) — ikony nie pasują
3. Nick powinien priorytetowo wyświetlać `nick_in_game`

## Zmiany

### 1. `src/types/studio.ts` — nowe pola w `PlayerData`
- Dodać `nick_in_game?: string | null`
- Dodać `rlstats_url?: string | null`

### 2. `src/lib/rank-utils.ts` — normalizacja nazw rang
- Dodać funkcję `normalizeRankName(raw: string): string` zamieniającą format API (`"Diamond 1"`, `"Platinum 3"`, `"Grand Champion 2"`) na wewnętrzny (`"Diamond I"`, `"Platinum III"`, `"Grand Champion II"`)
- Użyć jej w `getRankIcon()` aby dopasować ikony niezależnie od formatu

### 3. `src/components/studio/MatchCard.tsx` — nick_in_game + rank fallback
- `PlayerPanel`: wyświetlać `player.nick_in_game ?? player.nick`
- `resolveRank`: przepuszczać rangę z API przez `normalizeRankName`, jeśli wynik nie pasuje do żadnego tier-a → fallback na MMR

### 4. `src/components/studio/PlayerRow.tsx` — nick_in_game
- Wyświetlać `player.nick_in_game ?? player.nick`

## Pliki

| Plik | Zmiana |
|------|--------|
| `src/types/studio.ts` | Dodać `nick_in_game`, `rlstats_url` |
| `src/lib/rank-utils.ts` | Dodać `normalizeRankName()`, użyć w `getRankIcon` |
| `src/components/studio/MatchCard.tsx` | `nick_in_game` priorytet, normalizacja rang |
| `src/components/studio/PlayerRow.tsx` | `nick_in_game` priorytet |

