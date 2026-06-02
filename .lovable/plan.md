## Dashboard hydration → relay HTTP (uzupełnienie planu v3)

Po załadowaniu aktywnej `broadcast_sessions` Dashboard (i równolegle Creator's BroadcastControlsPanel, jeśli to on jest aktywnym kontrolerem) ma jednorazowo wysłać aktualny stan do relaya, żeby overlay od startu pokazał właściwą serię i nazwy drużyn, nawet zanim ktoś dotknie +/-.

### Co dokładnie

W `src/lib/relay-http.ts` (nowy helper, planowany już w głównym planie v3) wystawić dwie funkcje:

```ts
postSeries({ type, blue, orange, blue_name?, orange_name? })
postTeams({ blue_name, orange_name })
```

Obie: `fetch('http://127.0.0.1:49301/...', { method:'POST', body: JSON.stringify(...) }).catch(()=>{})` — fire-and-forget, bez błędów w UI gdy relay nie żyje.

### Gdzie hydratować

W `src/pages/Dashboard.tsx`:

- Dodać `useEffect` zależny od `session?.id` (czyli odpala się raz po załadowaniu sesji i przy każdej zmianie aktywnej sesji, nie przy każdej edycji pól).
- Wewnątrz, jeśli `session` istnieje:
  - `postTeams({ blue_name: session.team_a_name ?? '', orange_name: session.team_b_name ?? '' })`
  - `postSeries({ type: session.series_type, blue: session.team_a_series_score, orange: session.team_b_series_score, blue_name: session.team_a_name ?? undefined, orange_name: session.team_b_name ?? undefined })`
- Guard: pominąć jeśli `session.id` się nie zmieniło (czyli zależność `session?.id` wystarcza).
- Drugi `useEffect` dla auto-resync po reconnect WS/HTTP: jeśli `useLocalRelayFeed().connected` flipuje z `false` na `true`, ponownie wywołać oba POST-y z aktualną sesją (relay mógł zostać zrestartowany i stracić in-memory state). Realizować przez `useRef<boolean>` poprzedniego `connected`.

### Pozostałe edycje (już planowane w v3, tu tylko przypomnienie)

- Każdy `onUpdate` / `incrementTeamASeriesScore` / `decrementTeamASeriesScore` / `incrementTeamBSeriesScore` / `decrementTeamBSeriesScore` w Dashboard po sukcesie Supabase upsert woła analogiczne `postSeries`/`postTeams` z nowymi wartościami.
- `handleSwapTeams` w `MatchControls` po `onUpdate` również wywołuje obie funkcje (bo zamienia i nazwy, i wynik serii).

### Pliki

- `src/lib/relay-http.ts` — nowy (już w planie v3).
- `src/pages/Dashboard.tsx` — dodać dwa `useEffect` (hydration on session load + resync on WS reconnect) oraz przekazać wrapper do `TeamEditor`/`MatchControls` jeśli wygodniej (alternatywnie wołać bezpośrednio w Dashboard po każdej akcji, bo Dashboard już trzyma callbacki).
- `src/components/dashboard/MatchControls.tsx`, `src/components/dashboard/TeamEditor.tsx`, `src/components/creator/BroadcastControlsPanel.tsx` — w istniejących handlerach dorzucić POST (jak w planie v3).

### Akceptacja

- Po starcie relaya i otwarciu Dashboardu z aktywną sesją (np. seria 2–1, „Team A” vs „Team B”), overlay `/v2/overlay` w pierwszej ramce WS pokazuje już 2–1 i właściwe nazwy — bez konieczności klikania +/-.
- Restart relaya: po reconnecie WS Dashboard ponownie wysyła stan, overlay znowu jest zsynchronizowany w ciągu jednej ramki.
- Brak relaya: brak błędów konsoli (fetch w catch).
