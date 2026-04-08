

# Plan: Dynamiczna kolejka meczów (Carousel) w widoku Next Matches

## Opis

Przebudowa widoku "Następne mecze" z prostej rotacji pojedynczych kart na system carousel, gdzie aktywny mecz (index 0) wyświetla pełną grafikę (karty zawodników, rangi, banery drużyn), a pod banerami drużyn wyświetla się pionowa lista nadchodzących meczów (index 1+) w formie mniejszych pasków z nazwami drużyn.

## Architektura

```text
┌──────────────────────────────────────────────────┐
│              HeaderPanel (Runda, BO)             │
├──────────────────────────────────────────────────┤
│   [PlayerA1][PlayerA2]   VS   [PlayerB1][PlayerB2]│
│                                                    │
│   ┌── TEAM A BANNER ──┐    ┌── TEAM B BANNER ──┐  │
│   │   Team Volt        │    │   Wiejskie Skór.  │  │
│   ├────────────────────┤    ├────────────────────┤  │
│   │ Next: Team X    80%│    │ Next: Team Y    80%│  │
│   │ Next: Team Z    60%│    │ Next: Team W    60%│  │
│   │ Next: Team Q    40%│    │ Next: Team R    40%│  │
│   └────────────────────┘    └────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Zmiany w plikach

### 1. `src/pages/StudioRender.tsx`
- Usunąć obecny system `activeIndex` z prostą rotacją
- Zarządzać kolejką jako `useState<MatchData[]>` — co 6s przesunąć element [0] na koniec tablicy
- Przekazać `queuedMatches` (index 1+) do `MatchCard` jako nowy prop

### 2. `src/components/studio/MatchCard.tsx`
- Dodać prop `upcomingMatches: MatchData[]`
- Stworzyć nowy komponent `UpcomingQueue` — lista pasków pod banerem każdej drużyny
- Paski mają:
  - Tę samą szerokość (450px) i kąt nachylenia (`skewX(-5deg)`) co baner główny
  - Wysokość o 30% mniejszą niż baner
  - Ciemniejsze, półprzezroczyste tło
  - Malejące opacity: 80% → 60% → 40% dla kolejnych wpisów
  - Wyrównanie: blue (prawa krawędź) = `marginRight: 18px`, orange (lewa) = `marginLeft: -12px` (jak baner)
- Animacja przejścia: `AnimatePresence` z `layout` + slide-up dla zmiany kolejki
- Karty zawodników: fade-out → podmiana danych → fade-in przy zmianie aktywnego meczu

### 3. Logika rotacji (StudioRender)
```typescript
const [queue, setQueue] = useState<MatchData[]>(matches);

useEffect(() => { setQueue(matches); }, [matches]);

useEffect(() => {
  if (queue.length <= 1) return;
  const timer = setInterval(() => {
    setQueue(prev => [...prev.slice(1), prev[0]]);
  }, 6000);
  return () => clearInterval(timer);
}, [queue.length]);
```

### 4. Komponent UpcomingQueue
```typescript
function UpcomingQueue({ matches, side }: { matches: MatchData[]; side: 'a' | 'b' }) {
  const opacities = [0.8, 0.6, 0.4, 0.25];
  return (
    <AnimatePresence mode="popLayout">
      {matches.map((m, i) => (
        <motion.div
          key={m.match_id}
          layout
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: opacities[i] ?? 0.2, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          // pasek: 450px, skewX(-5deg), 30% niższy, ciemne tło
        >
          {side === 'a' ? m.team_a?.name : m.team_b?.name}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

Wyrównanie pionowe: offset `tan(5°) * height` zapewni, że paski zaczynają się od dolnej krawędzi nachylonego banera.

