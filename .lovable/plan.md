# Auto-hide overlaya: debounce + fail-safe

## Cel
Overlay V2 ma znikać gdy bot Pythonowy zgłosi koniec meczu (`match_metadata.is_active = false`) lub gdy całkowicie straci połączenie. Pokazanie ma być natychmiastowe, ukrycie — z opóźnieniem żeby nie migotało.

## Logika

**Pokaż overlay (opacity-100)** gdy:
- `is_active === true` ORAZ
- `updated_at` młodszy niż 30s

**Ukryj overlay (opacity-0)** gdy spełniony jest jeden z warunków:
- `is_active === false` utrzymuje się nieprzerwanie ≥ 5s (debounce)
- `updated_at` starszy niż 30s (fail-safe — utrata połączenia z botem)

Każde przyjście świeżego update'u z `is_active=true` natychmiast resetuje debounce i pokazuje overlay.

## Zmiany w kodzie

### 1. Nowy plik: `src/hooks/useOverlayVisibility.ts`

Hook przyjmuje `match: MatchMetadata | null` i zwraca `boolean visible`.

Wewnątrz:
- `useState<boolean>(true)` — bieżąca widoczność
- `useRef<number>` — timestamp pierwszego momentu gdy `is_active` stał się `false`
- `useEffect` reagujący na zmiany `match.is_active` i `match.updated_at`:
  - jeśli `is_active === true` i dane świeże → `setVisible(true)`, wyczyść ref
  - jeśli `is_active === false` → ustaw ref na `Date.now()` jeżeli pusty
- `useEffect` z `setInterval(1000ms)` przeliczający widoczność:
  - oblicz `staleness = Date.now() - new Date(match.updated_at).getTime()`
  - `shouldHide = (refSet && Date.now() - ref >= 5000) || staleness > 30000`
  - `setVisible(!shouldHide)`
- gdy `match === null` → `visible = false` (nic do pokazania)

Stałe: `HIDE_DEBOUNCE_MS = 5000`, `STALE_MS = 30000`, `TICK_MS = 1000`.

### 2. `src/pages/OverlayV2.tsx`

Zamiana:
```tsx
const isActive = match?.is_active ?? true;
```
na:
```tsx
const visible = useOverlayVisibility(match);
```
i użycie `visible` w `className` zamiast `isActive`. Reszta bez zmian.

## Zachowanie w skrajnych przypadkach

| Sytuacja | Zachowanie |
|---|---|
| Bot ustawia `is_active=false` | Ukrycie po 5s, fade 500ms |
| Bot ustawia `is_active=true` po pauzie | Pokazanie natychmiast |
| Bot pada bez ustawienia flagi | Ukrycie po 30s (fail-safe) |
| Krótki restart bota (<5s) | Bez migotania — debounce trzyma overlay |
| Brak `match` w bazie | Ukryty |
| Brak pola `is_active` (legacy) | Traktujemy jak `true` (zgodność wsteczna) |

## Pliki

- nowy: `src/hooks/useOverlayVisibility.ts`
- edit: `src/pages/OverlayV2.tsx` (import + 2 linie)

Po stronie bota Python (poza tym repo) trzeba dopisać setowanie `match_metadata.is_active = true/false` — to nie wchodzi w zakres tej zmiany, ale bez tego działa tylko fail-safe na staleness.
