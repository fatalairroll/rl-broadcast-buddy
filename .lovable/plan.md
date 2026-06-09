## Studio layout v2 — recent niżej + węższe paski postgame

Zmiany ograniczone do 3 plików. Bez ruszania `StudioContentFrame`, `Relay.tsx`, live `/v2/overlay`, Supabase.

### 1. `src/lib/studio-layout.ts`
Dodać dwie stałe (bez zmian istniejących):
- `STUDIO_RECENT_OFFSET_TOP = 56`
- `POSTGAME_CENTER_COL_WIDTH = 168`

### 2. `src/pages/StudioRender.tsx`
- Import `STUDIO_RECENT_OFFSET_TOP`.
- W gałęzi `mode === 'recent'` owinąć `<RecentMatchesTable />` w `<div style={{ marginTop: STUDIO_RECENT_OFFSET_TOP, width: '100%' }}>`.
- Pozostałe tryby (next_3, bracket, postgame) bez zmian.

### 3. `src/components/studio/PostgameSummary.tsx`
- Import `POSTGAME_CENTER_COL_WIDTH`.
- `gridStyle.gridTemplateColumns`: z `'1fr minmax(320px, 420px) 1fr'` → `` `minmax(0, 1fr) ${POSTGAME_CENTER_COL_WIDTH}px minmax(0, 1fr)` ``.
- `PlayerNamesRow`: usunąć `truncate`, dodać `whiteSpace: 'nowrap'`; rozmiar nicku `text-sm` (2v2) / `text-xs` (3v3) — kolumny graczy są teraz szersze, więc nicki mieszczą się bez ellipsy.

### 4. `src/components/studio/PostgameShared.tsx`
- `PostgameTeamBarRow` — etykieta statystyki (PUNKTY, GOLE…): zmniejszyć z `text-[10px]` do `text-[9px]` z `lineHeight: 1.1`, żeby „CZAS NA SUPERSONIC” / „CZAS NA 100 BOOSTA” mieściły się w 168 px. Pasek (h `10px`) i suwak bez zmian. Wartości liczbowe po bokach (`text-base`) bez zmian — mają miejsce.

### Definition of Done
- `recent` widocznie obniżone (~56 px); next_3 / postgame / bracket bez zmian pionowych.
- Postgame: kolumna pasków = 168 px, nicki 3v3 bez `…`.
- Ramka 956 px + safe right 450 px zachowane.
- OBS `?obs=1`, 10 wierszy PL, relay bez regresji.
