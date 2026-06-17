## FAZA 6 — Wspólny TopNav + wygaszenie dashboardu

### 1. `src/components/layout/TopNav.tsx` (nowy)

Sticky pasek (`border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50`):
- Po lewej: **logo `Gamepad2` + "RL Broadcast"** (świadomie zostawione dla spójności wizualnej — pozycja 0, nieklikalna lub link do `/creator`).
- Zakładki przez `NavLink` (`src/components/NavLink.tsx`) z `activeClassName` (podświetlenie aktywnej trasy — np. `bg-secondary text-foreground`):
  - Kreator → `/creator`
  - Studio → `/studio`
  - Admin → `/admin`
  - Gracze (v2) → `/v2/admin/players`
  - Relay → `/relay`
- Po prawej: `<RelayStatus />`, przycisk **Overlay** (`window.open('/v2/overlay', '_blank')`), przycisk **Wyloguj** (`signOut` + `navigate('/auth')`) — wymagany, bo z dashboardu znika dotychczasowe miejsce wylogowania.

Świadomie: pasek ma 7 elementów akcji (logo + 5 zakładek + Overlay/Wyloguj + RelayStatus). Jeśli za gęsto — łatwy do późniejszego przycięcia, decyzja zostawiona na po wdrożeniu.

### 2. `src/components/layout/OperatorLayout.tsx` (nowy)

```text
<TopNav />
<Outlet />
```

W `src/App.tsx` owija trasy operatorskie:

```text
<Route element={<OperatorLayout />}>
  <Route path="/creator" element={<Creator />} />
  <Route path="/studio" element={<Studio />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/relay" element={<Relay />} />
  <Route path="/v2/admin/players" element={<PlayersRegistryAdmin />} />
</Route>
```

Poza layoutem (czyste, bez TopNav): `/auth`, `/studio/render`, `/v2/overlay`.

### 3. `src/App.tsx` — redirecty i sprzątanie

- `/` → `<Navigate to="/creator" replace />`
- `/dashboard` → `<Navigate to="/creator" replace />` (trasa zostaje jako redirect, brak 404 ze starych linków)
- Usunąć import `Dashboard`.

### 4. `src/pages/Creator.tsx` — przebudowa nagłówka

- USUNĄĆ cały lokalny `<header>` (Dashboard/Overlay/Relay, tytuł, `RelayStatus`, Tabs Mock/Live) — zastąpi go `TopNav`.
- Switcher **Mock/Live** (`Tabs` z `previewMode/setPreviewMode`) przenieść do `<main>`, nad `<V2Preview />`; logika bez zmian.
- Wskaźnik "• niezapisane zmiany" przenieść nad Mock/Live lub do panelu presetów (lewa kolumna).

### 5. Aktualizacja celów nawigacji (`/dashboard` → `/creator`)

- `src/pages/Auth.tsx:29`, `:68` — po login/signup → `/creator`.
- `src/pages/Relay.tsx:1509` — przycisk powrotu → `/creator`.
- `src/pages/Admin.tsx:202` — przycisk powrotu → `/creator`. Zakomentowany guard na linii 80 — podmienić tekst dla porządku.
- `src/pages/PlayersRegistryAdmin.tsx:126` — `<Link to="/dashboard">` → `/creator`.
- Komentarz w `Relay.tsx:1028` (treść skryptu) zostaje.

### 6. Usunięcie plików dashboardu — z asekuracją

Wstępny grep dał: `Dashboard.tsx` (tylko import w App), `MatchControls.tsx` (tylko Dashboard), `TeamEditor.tsx` (tylko Dashboard). Faza 5 portowała wzorzec color pickera/logo do `BroadcastControlsPanel`, więc `TeamEditor` nie powinien być importowany w kreatorze — ale weryfikujemy **przed** `rm`:

Procedura — w jednym kroku, w tej kolejności:

1. Usunąć trasę i import `Dashboard` z `App.tsx` (sekcja 3).
2. `rg -n "from.*dashboard/Dashboard|from.*pages/Dashboard"` → musi zwrócić 0.
3. `rg -n "from.*dashboard/MatchControls"` → musi zwrócić 0.
4. `rg -n "from.*dashboard/TeamEditor"` → musi zwrócić 0. **Jeśli zwróci ≥1 — TeamEditor zostaje, raportuję i nie usuwam.**
5. Dopiero potem `rm`:
   - `src/pages/Dashboard.tsx`
   - `src/components/dashboard/MatchControls.tsx`
   - `src/components/dashboard/TeamEditor.tsx` (warunkowo)
6. `src/components/dashboard/RelayStatus.tsx` **ZOSTAJE** — używany przez `TopNav`. Bez przenoszenia pliku.
7. Po `rm` — sprawdzić output buildu; jeśli czerwone, przywrócić ostatni problematyczny plik.

### 7. Weryfikacja końcowa

- `rg "to=\"/dashboard\"|navigate\\('/dashboard'\\)"` → 0 (poza redirect w `App.tsx`).
- Build/TS czysto.
- Wizualnie: TopNav na `/creator`, `/studio`, `/admin`, `/v2/admin/players`, `/relay`; brak na `/studio/render`, `/v2/overlay`, `/auth`.
- `/v2/overlay` i `/studio/render` renderują się identycznie (źródła OBS nienaruszone).
- Switcher Mock/Live działa w treści kreatora.
- Aktywna zakładka wyróżniona wg trasy.

### Czego NIE ruszam

GLASS OVERLAY, `OverlayV2`, `StudioRender`, `BroadcastSession`/`useBroadcast`, `useTeams`, `team_a/b_id`, `useSeriesAutoTracker`, `BroadcastControlsPanel`, struktura `/admin`, `/relay`, `/studio`.
