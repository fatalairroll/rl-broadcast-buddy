## Hybrydowe auto-ukrywanie overlaya V2

Bot już docelowo będzie pisał `match_metadata.is_active` (true przy MatchCreated / żywych graczach, false przy MatchDestroyed). Po stronie overlaya dokładam drugą warstwę bezpieczeństwa: **stale detection 8s** na podstawie `updated_at`.

### Logika końcowa

Overlay jest widoczny gdy spełnione **OBA** warunki:
1. `match.is_active === true` (lub null/undefined → traktujemy jako true dla wstecznej kompatybilności)
2. `Date.now() - new Date(match.updated_at).getTime() < 8000`

W przeciwnym razie kontener dostaje `opacity-0` (już opakowany w `transition-opacity duration-500`, więc fade działa od razu).

### Zmiany

**`src/pages/OverlayV2.tsx`**
- Dodaję `useState<number>(Date.now())` + `useEffect` z `setInterval(..., 1000)`, który tylko inkrementuje "tick", żeby komponent przeliczał świeżość co sekundę (bez tego stale-check zamarza między eventami realtime).
- `const isFresh = match?.updated_at ? (now - new Date(match.updated_at).getTime() < 8000) : false;`
- `const isActive = (match?.is_active ?? true) && isFresh;`
- Pozostała logika klasy `opacity-0/100` + `transition-opacity duration-500` bez zmian.

**Bez zmian:** baza (`is_active` już istnieje), `useLiveStatsV2` (już ciągnie `match_metadata.*` w tym `updated_at` i `is_active`), `V2Preview` (mock zawsze pokazany).

### Plik do edycji
- `src/pages/OverlayV2.tsx`

### Uwagi
- Mock w `/creator` ma `is_active: true` i świeże `updated_at` przy każdym renderze — preview nie zostanie ukryty.
- Próg 8s jest stałą `STALE_MS = 8_000` na górze pliku, łatwa do tuningu później.
- Po stronie bota: gdy zacznie pisać `is_active=false`, fade zadziała natychmiast (nie czekamy 8s).
