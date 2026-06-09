# Postgame Poprawka 3 — Jeden ekran „Podsumowanie"

Zastępuje dwa tryby (`postgame_players` + `postgame_summary`) jednym ekranem RLCS-style: nagłówek z bramkami, środkowe paski drużynowe z białym suwakiem na styku gradientów, wartości per gracz po bokach. **10 wierszy** statystyk (bez padów).

## Zmiany

### 1. `src/components/studio/PostgameShared.tsx` (rozszerzenie)
- **`PostgameSummaryHeader`** — flex w jednym rzędzie: lewo `team_names.blue` (uppercase, font-esports) + duża cyfra `blue_score` (~56px, `#2563eb`); środek **„PODSUMOWANIE"** (uppercase, white, tracking); prawo cyfra `orange_score` (`#f97316`) + `team_names.orange`. Nad panelem, na transparentnym tle.
- **`PostgameTeamBarRow`** — props `{ label, blueValue, orangeValue, format }`. Etykieta uppercase nad paskiem (`rgba(255,255,255,0.6)`). Pasek wys. ~12px, track `rgba(255,255,255,0.06)`, gradienty blue `#1e3a8a→#2563eb→#3b82f6` i orange `#c2410c→#f97316→#fb923c`. Biały suwak: `position:absolute; left:bluePct%; transform:translateX(-50%); width:3px; height:20px; background:#fff; box-shadow:0 0 6px rgba(255,255,255,0.5)`. `bluePct = blueVal/(blueVal+orangeVal)*100`, suma 0 → 50%.
- Zachować `PostgameGlassPanel`, `fmtNum`, `fmtFloat`, `fmtSeconds`. `PostgameProgressRow` / `PostgameMatchHeader` usunąć po refaktorze konsumentów.

### 2. `src/components/studio/PostgameSummary.tsx` (nowy)
Props: `{ data: PostgamePayload | null; state: PostgameState }`. Stany błędów jak w Poprawce 2 (relay error → „Relay niedostępny (127.0.0.1:49300)"; brak danych → „Brak danych — zagraj mecz z relay").

Przygotowanie graczy (wszyscy widoczni naraz, 2v2/3v3):
```ts
const bluePlayers = [...pairs].sort((a,b)=>a.rank-b.rank).map(p=>p.blue);
const orangePlayers = [...pairs].sort((a,b)=>a.rank-b.rank).map(p=>p.orange);
```

Layout: `PostgameSummaryHeader` nad `PostgameGlassPanel`. Panel = CSS grid `grid-template-columns: 1fr minmax(320px,420px) 1fr`. Wewnątrz grid wierszy `auto` (nagłówki nicków) + 10× `auto` (statystyki) — **jeden wiersz grid = jedna statystyka**, wyrównuje boki ze środkowym paskiem.

- **Wiersz nicków:** lewa komórka — subgrid N kolumn z `player_name` uppercase blue (`#2563eb`), font-esports, `border-bottom:2px solid #2563eb` opacity 0.6. Prawa lustrzanie orange (`#f97316`). Środek pusty.
- **Wiersze 1–10:** lewa = N kolumn z wartością gracza (white, tabular-nums); środek = `PostgameTeamBarRow`; prawa = lustrzanie orange.
- 3v3: redukcja fontu do `text-sm` (środek stałej szerokości).

10 wierszy (PL etykiety, bez padów):

| # | Label | Player field | Team-bar value | Format |
|---|---|---|---|---|
| 1 | PUNKTY | `score` | Σ player.score | num |
| 2 | GOLE | `goals` | Σ player.goals | num |
| 3 | KICKOFF GOALS | — (gracze `—`) | `team[side].kickoff_goals_10s` | num |
| 4 | ASYSTY | `assists` | Σ player.assists | num |
| 5 | STRZAŁY | `shots` | Σ player.shots | num |
| 6 | OBRONY | `saves` | `team[side].saves` | num |
| 7 | DEMOS | `demos` | `team[side].demos` | num |
| 8 | CZAS NA SUPERSONIC | `supersonic_seconds` | Σ (null→0) | MM:SS / — |
| 9 | ŚREDNI BOOST | `avg_boost` | `team[side].avg_boost` | float / — |
| 10 | CZAS NA 100 BOOSTA | `time_at_100_seconds` | Σ (null→0) | MM:SS / — |

`pad_pickups` z JSON ignorowane w UI.

### 3. `src/types/studio.ts`
Do `StudioMode` dodać `'postgame'`. Pozostawić `'postgame_players' | 'postgame_summary'` dla aliasów.

### 4. `src/pages/Studio.tsx`
W `Select` jedna opcja postgame: `<SelectItem value="postgame">Podsumowanie</SelectItem>` (usuń poprzednie dwie). Komunikat „Wymaga relay…" gdy `mode === 'postgame'`.

### 5. `src/pages/StudioRender.tsx`
- `MODES`: jeden wpis `{ key:'postgame', label:'Podsumowanie' }`.
- `const isPostgame = mode==='postgame' || mode==='postgame_players' || mode==='postgame_summary';`
- `useStudioData({ enabled: authorized && !!tournamentId && !isPostgame })`.
- Render: gdy `isPostgame` → `<PostgameSummary data={postgame} state={{connected:pgConnected,error:pgError}} />`.
- Wyłącz rotację `queue` i Twitch poll gdy `isPostgame` (poll button już ograniczony do `next_3`; dodać guard `!isPostgame` w efektach rotacji).
- Tło transparent (bez zmian).

### 6. Usunięcie
- `rm src/components/studio/PostgamePlayerCompare.tsx`
- `rm src/components/studio/PostgameTeamSummary.tsx`

## Niezmienione
`Relay.tsx`, `usePostgameRelay.ts`, `/v2/overlay`, Supabase, `types/postgame.ts`.

## Definition of Done
- Jeden tryb „Podsumowanie" (`mode=postgame`); stare URL-e renderują ten sam ekran.
- Nagłówek z bramkami meczu i „PODSUMOWANIE" na środku.
- **10** pasków drużynowych z PL etykietami, KICKOFF GOALS zaraz po GOLE, biały suwak na styku.
- Wszyscy gracze widoczni naraz, wartości wyrównane do wierszy pasków.
- Brak wiersza padów. Liquid glass + transparent OBS. Brak regresji relay/hook.
