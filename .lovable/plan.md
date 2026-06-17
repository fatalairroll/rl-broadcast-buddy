# Plan: 3 fazy porządków UI (rev 2)

## FAZA 1 — Sprzątanie nawigacji

**`src/App.tsx`**
- Trasa `/` → `<Navigate to="/dashboard" replace />` (import z `react-router-dom`).
- Usunąć import `Index` (plik `src/pages/Index.tsx` zostaje na dysku nieużywany — bez ryzyka).

**`src/pages/Dashboard.tsx`**
- Usunąć przycisk "Overlay" z `<nav>` w nagłówku (ten z `window.open('/v2/overlay', '_blank')`).
- Posprzątać nieużywane importy (`Radio`, `ExternalLink` jeśli już nigdzie indziej w pliku).

Trasy `/v2/overlay`, `/creator`, `/studio`, `/admin`, `/relay` — bez zmian.

---

## FAZA 2 — Klucz streamera w localStorage

Lokalizacja: `src/pages/Studio.tsx`, stan `streamerKey` (input "Klucz streamera (do URL)", ~linia 211-219), trafia do `/studio/render?key=...`.

**`src/pages/Studio.tsx`**
- Stała `STREAMER_KEY_LS = 'rlbroadcast.toolKey'`.
- `useState(() => localStorage.getItem(STREAMER_KEY_LS) ?? '')`.
- `useEffect` zapisujący `streamerKey` (pusty → `removeItem`).
- Pole klucza w `<Collapsible>` (już dostępny w `@/components/ui/collapsible`):
  - `defaultOpen={!storedKey}` (otwarte gdy jeszcze pusto, zwinięte gdy jest zapisany).
  - Trigger: "Zmień klucz" + małe "Klucz zapisany ✓" obok (bez ujawniania wartości).
  - W środku input + `Button variant="ghost" size="sm"` "Wyczyść zapisany klucz" → `setStreamerKey(''); localStorage.removeItem(...)`.
- Logika autoryzacji / budowania `renderUrl` — nietknięta.

---

## FAZA 3 — Status relaya w nagłówku (3 stany)

### Miejsce wskaźnika
Sprawdzone: `Dashboard.tsx` i `Creator.tsx` mają **odrębne** nagłówki — nie ma jednego wspólnego `AppHeader`. Zgodnie z uwagą użytkownika nie tworzymy teraz nowego komponentu nagłówka; `RelayStatus` ląduje w nagłówku `Dashboard.tsx`. Notatka na przyszłość (do późniejszej konsolidacji UI): gdy powstanie wspólny `AppHeader`, przenieść `RelayStatus` raz na zawsze tam — nie powielać w każdym nagłówku.

### `src/components/dashboard/RelayStatus.tsx` (rozszerzenie)
- `lastPing` w `useRef` + `tick` co 1 s wymuszający re-render (żeby kolor zmieniał się sam wraz z upływem czasu, bez nowych pingów).
- 3 stany na podstawie `age = now - lastPing`:
  - `age < 10_000 ms` → zielony "Relay aktywny".
  - `age < 30_000 ms` → żółty "Relay — brak danych Xs" (X = `Math.floor(age/1000)`).
  - `age ≥ 30_000` lub `lastPing == null` → czerwony "Brak relaya".
- Klasy: zielony jak teraz; żółty `bg-amber-500/20 text-amber-400 border-amber-500/30`; czerwony `bg-red-500/20 text-red-400 border-red-500/30`.
- Skompaktować padding/typo (ma mieścić się obok przycisków nav).

### `src/pages/Dashboard.tsx`
- Wstawić `<RelayStatus />` w `<nav>` nagłówka (przed przyciskami).

### `src/components/dashboard/MatchControls.tsx`
- Usunąć render `<RelayStatus />` z `CardHeader` (i import) — żeby nie dublować.

### Heartbeat w skrypcie relay (Python)
Skrypt w `src/pages/Relay.tsx` ma już `heartbeat_loop`. Sprawdzić podczas implementacji, czy wysyła `supabase.channel('rl_broadcast_room').send({type:'broadcast', event:'RELAY_PING', payload:{timestamp: ...}})` co `HEARTBEAT_S`.
- **Jeśli tak** — nic nie zmieniać.
- **Jeśli nie** — dodać wysyłkę.

W obu przypadkach na końcu wdrożenia jasno zaraportować użytkownikowi:
- "Skryptu relay nie trzeba wymieniać — heartbeat już działa." **lub**
- "Skrypt relay zmieniony — pobierz nową wersję z `/relay` i uruchom ponownie na maszynie z grą; inaczej wskaźnik będzie czerwony mimo działającego relaya."

---

## Definition of Done

- `/` → instant redirect do `/dashboard`.
- Brak przycisku "Overlay" w nagłówku Dashboardu; `/v2/overlay` nadal działa po wpisaniu URL.
- Klucz streamera trzymany w localStorage, autouzupełniany, pole pod "Zmień klucz" z "Klucz zapisany ✓" i przyciskiem "Wyczyść".
- Wskaźnik relaya w nagłówku Dashboardu: zielony < 10 s, żółty < 30 s, czerwony ≥ 30 s lub brak; reakcja w < 30 s od zatrzymania/startu relaya.
- Końcowy komunikat wdrożenia jednoznacznie mówi, czy trzeba wymienić skrypt relay.
- TS/lint czysto. Render overlayów, preset GLASS, Studio render, Creator, Admin, `useSeriesAutoTracker`, RankClash — nietknięte.
