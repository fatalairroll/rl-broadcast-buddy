

# Plan: Podłączenie overlaya do tabeli `game_state`

## Zmiany w `src/pages/Overlay.tsx`

### 1. Dodać importy
- `useEffect` (już jest `useState`)
- `supabase` z `@/integrations/supabase/client`

### 2. Dodać stan `dbGameState`
Nowy state: `dbGameState` typu `{ timer: string; score_a: string; score_b: string } | null`

### 3. Dodać `useEffect` z:
- **Fetch początkowy**: `supabase.from('game_state').select('*').eq('id', 1).single()` → ustawienie `dbGameState`
- **Subskrypcja Realtime**:
```typescript
supabase
  .channel('game_updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
    (payload) => {
      setDbGameState(payload.new as { timer: string; score_a: string; score_b: string });
    }
  )
  .subscribe();
```
- **Cleanup**: `supabase.removeChannel(channel)` w return

### 4. Dodać parser timera
Funkcja `parseTimerToSeconds("1:33")` → `93`. Obsługa formatu `M:SS` oraz samych sekund.

### 5. Merge stanu (linia 94)
Zmienić logikę `currentGameState`:
```typescript
const baseGameState = gameState || mockGameState;
const currentGameState = dbGameState
  ? {
      ...baseGameState,
      game: { ...baseGameState.game, time: parseTimerToSeconds(dbGameState.timer) },
      teams: {
        blue: { score: parseInt(dbGameState.score_a) || 0 },
        orange: { score: parseInt(dbGameState.score_b) || 0 },
      },
    }
  : baseGameState;
```

Dane z `game_state` (OCR) nadpisują timer i wynik, reszta (gracze, boost, piłka) zostaje z Broadcast/mock.

## Testowanie

Po wdrożeniu — ręczna aktualizacja wiersza w bazie (np. z Pythona lub cURL) powinna natychmiast zmienić wynik i timer na overlayu.

