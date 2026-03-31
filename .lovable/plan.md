

# Plan: Naprawa połączenia overlaya z tabelą `game_state`

## Problem

Overlay wyświetla dane z `mockGameState` (wynik 1:5, timer 2:01) zamiast danych z bazy (timer: "4", score_a: "0", score_b: "0"). To oznacza, że `dbGameState` pozostaje `null` — prawdopodobnie fetch początkowy zwraca błąd, który jest ignorowany (brak obsługi `error`).

## Zmiany w `src/pages/Overlay.tsx`

### 1. Dodać obsługę błędów w fetchu początkowym
Aktualny `.then(({ data })` ignoruje `error`. Trzeba dodać logowanie błędu i obsługę `error`.

### 2. Dodać console.log do debugowania
- Log po fetch początkowym (sukces/błąd)
- Log w callbacku Realtime (już jest, ale warto dodać log statusu subskrypcji)

### 3. Dodać obsługę statusu subskrypcji
Sprawdzać status kanału w `.subscribe((status) => { console.log('Subscription status:', status); })` — to pokaże czy Realtime faktycznie się łączy.

### 4. Poprawić typ danych w fetchu
Zamiast ręcznego mapowania `{ timer: data.timer, ... }`, użyć bezpośredniego przypisania z typem, aby uniknąć problemów z nullami.

```typescript
useEffect(() => {
  // Initial fetch with error handling
  supabase
    .from('game_state')
    .select('*')
    .eq('id', 1)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('game_state fetch error:', error);
        return;
      }
      if (data) {
        console.log('game_state fetched:', data);
        setDbGameState({ 
          timer: data.timer ?? '0:00', 
          score_a: data.score_a ?? '0', 
          score_b: data.score_b ?? '0' 
        });
      }
    });

  // Realtime subscription with status logging
  const channel = supabase
    .channel('game_updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
      (payload) => {
        console.log('game_state UPDATE:', payload.new);
        const newData = payload.new as { timer: string; score_a: string; score_b: string };
        setDbGameState(newData);
      }
    )
    .subscribe((status) => {
      console.log('game_updates channel status:', status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Plik do zmiany

| Plik | Zmiana |
|------|--------|
| `src/pages/Overlay.tsx` | Obsługa błędów fetchu, logi debugujące, status subskrypcji |

Po wdrożeniu — otwórz `/overlay` (nie `/`) w przeglądarce, sprawdź konsolę deweloperską (F12), i poszukaj logów `game_state fetched:` oraz `game_updates channel status:`. To pokaże czy dane są pobierane i czy Realtime działa.

