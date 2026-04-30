## Cel

Dodać w nagłówku `src/pages/Dashboard.tsx` dwa nowe przyciski nawigacyjne do nowego systemu Live Stats V2.

## Zmiany

**Plik:** `src/pages/Dashboard.tsx` — sekcja `<nav>` w headerze.

1. **„Overlay V2"** — obok obecnego przycisku „Overlay". Otwiera `/v2/overlay` w nowej karcie (`window.open`, jak istniejący „Overlay"), bo to widok do OBS. Ikona `Monitor` + `ExternalLink`.

2. **„Players V2"** — obok przycisku „Admin". Nawiguje do `/v2/admin/players` przez `navigate()` (panel CRUD wewnątrz aplikacji). Ikona `Users` (lub `UserCog` z `lucide-react` dla rozróżnienia).

Kolejność w navie:
```
Overlay | Overlay V2 | Studio | Kreator | Admin | Players V2 | [logout]
```

Stylistyka: te same `<Button variant="ghost" size="sm">` co reszta — pełna spójność z istniejącym headerem, bez zmian designu.

## Co NIE jest zmieniane

- Żadne inne pliki (routy w `App.tsx` już istnieją).
- Brak guardów ról — zgodnie z obecną konwencją Dashboardu (dev mode).
- Brak zmian w Studio/Admin headerach (jeśli zechcesz, dorzucę osobno).