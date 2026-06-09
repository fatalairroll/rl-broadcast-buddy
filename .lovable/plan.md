## Część A — next_3: ukryj mecze TBD vs TBD

### 1. Nowy plik `src/lib/studio-match-utils.ts`
- `isTeamTbd(team)` — true gdy `name` puste lub `"TBD"` (case-insensitive, po trim).
- `isFullyTbdMatch(match)` — oba sloty TBD.
- `filterNext3VisibleMatches(matches)` — odsiewa fully-TBD.

### 2. `src/hooks/useStudioData.ts`
W gałęzi `mode === 'next_3'`, po istniejącym filter+sort, **przed** `.slice(0, count)`:
```ts
resultMatches = filterNext3VisibleMatches(resultMatches).slice(0, count);
```
Pozostałe tryby bez zmian (bracket, recent — TBD może występować).

### 3. `src/pages/StudioRender.tsx`
W gałęzi `next_3` opakować render w guard `queue.length > 0` — gdy 0 meczów, nie renderuj `MatchCard` (`null`/transparent). Rotacja i poll bez zmian.

### 4. `src/components/studio/MatchCard.tsx`
W `UpcomingQueue` (lub odpowiedniku) na początku:
```ts
const visible = matches.filter((m) => !isFullyTbdMatch(m));
if (visible.length === 0) return null;
```
Pojedyncze TBD (Team vs TBD) — bez zmian wyświetlania.

---

## Część B — Postgame: jednolite etykiety pasków, 1 linia

### 5. `src/lib/studio-layout.ts`
- `POSTGAME_CENTER_COL_WIDTH` z `168` → **`208`**.
- Dodać:
  - `POSTGAME_BAR_LABEL_FONT_SIZE = 10` (px)
  - `POSTGAME_BAR_LABEL_LETTER_SPACING = '0.05em'`

### 6. `src/components/studio/PostgameShared.tsx` — `PostgameTeamBarRow`
Etykieta środkowa: jednolity styl dla wszystkich 10 wierszy.
- `fontSize: POSTGAME_BAR_LABEL_FONT_SIZE`
- `letterSpacing: POSTGAME_BAR_LABEL_LETTER_SPACING`
- `lineHeight: 1`
- `whiteSpace: 'nowrap'`
- `textTransform: 'uppercase'`, `textAlign: 'center'`, `color: rgba(255,255,255,0.6)`
- Klasa `font-esports` (zachować).
- Usunąć obecne `text-[9px]` / `lineHeight: 1.1`.
- Pasek (10px) i suwak — bez zmian.

### 7. `src/components/studio/PostgameSummary.tsx`
- Importowany `POSTGAME_CENTER_COL_WIDTH` automatycznie podbije kolumnę do 208px (grid już używa stałej).
- Nicki: bez zmian (`nowrap`, bez `truncate`). Jeśli 3v3 będzie ciasno — opcjonalnie wartości graczy do `text-sm`, etykiet pasków NIE ruszać.

---

## Pliki

| Plik | Akcja |
|---|---|
| `src/lib/studio-match-utils.ts` | nowy |
| `src/lib/studio-layout.ts` | edit — 208 + stałe fontu |
| `src/hooks/useStudioData.ts` | edit — filtr TBD w next_3 |
| `src/pages/StudioRender.tsx` | edit — guard pustej kolejki |
| `src/components/studio/MatchCard.tsx` | edit — filtr w UpcomingQueue |
| `src/components/studio/PostgameShared.tsx` | edit — jednolite etykiety |
| `src/components/studio/PostgameSummary.tsx` | weryfikacja importu (bez zmian logiki) |

## Bez zmian
`Relay.tsx`, `/v2/overlay`, Supabase, `StudioContentFrame`, bracket/recent layout.
