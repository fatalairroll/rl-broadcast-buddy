

# Plan: Napraw timing rotacji i przeprojektuj wiersze kolejki

## Problem z timingiem

API polluje co 5s i za każdym razem wywołuje `setQueue(matches)`, co resetuje kolejkę i przerywa 6-sekundowy cykl rotacji. Rozwiązanie: porównywać nowe dane z istniejącą kolejką i aktualizować tylko gdy lista meczów faktycznie się zmieni (np. nowe match_id).

## Nowy styl wierszy kolejki

Zamiast prostych szarych pasków z nazwą drużyny, wiersze kolejki będą miały styl zbliżony do RecentMatchesTable:
- Ciemne tło gradientowe
- Na środku: numer rundy i meczu (np. "R2 M3") oddzielony pionowymi neonowymi paskami (niebieski/pomarańczowy)
- Skew `-5deg` (taki sam jak banery drużyn w aktywnym meczu, NIE -15deg jak w zakończonych)
- Malejące opacity dla kolejnych wierszy

## Zmiany w plikach

### 1. `src/pages/StudioRender.tsx`
- Zmienić sync queue: zamiast `setQueue(matches)` przy każdym renderze, porównywać `matches` po match_id i aktualizować tylko gdy lista się zmieni (nowe mecze lub zmiana kolejności)
- Dzięki temu interval 6s nie będzie przerywany przez polling API

### 2. `src/components/studio/MatchCard.tsx` — komponent `UpcomingQueue`
Przebudować wiersze kolejki z prostych pasków na mini-wersje stylu RecentMatchesTable:

```text
┌─────────────────────────────────────────────────┐
│  Team A name  │▌R2 M3▐│  Team B name            │
└─────────────────────────────────────────────────┘
```

- Tło: `linear-gradient(90deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))`
- Centralny blok z numerem rundy/meczu, neonowe paski (3px) blue/orange po bokach
- Nazwy drużyn po obu stronach (A = prawo, B = lewo)
- Skew: `-5deg` (jak TeamBanner), tekst unskewed `skewX(5deg)`
- Szerokość: dopasowana do szerokości obu wrapperów drużyn (pełna szerokość)
- Opacity: 0.8, 0.6, 0.4, 0.25 dla kolejnych wierszy
- Animacja: zachować obecny `AnimatePresence` z slide-up

