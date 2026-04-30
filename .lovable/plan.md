## Live Stats V2 — architektura oparta na RL Stats API

Stary system (`/overlay`, `useBroadcast`, OCR `game_state`, BakkesMod/SOS) zostaje **nietknięty**. Dodajemy nowy, niezależny tor danych: **Bot Python (RL Stats WS) → Supabase → `/v2/overlay`**.

---

### 1. Migracja bazy danych

Trzy nowe tabele + jedna pomocnicza, wszystkie z Realtime + RLS „dev mode" (anon/auth: SELECT/INSERT/UPDATE/DELETE), spójnie z obecnym projektem.

**`match_metadata`** — singleton (id=1, upsert)
- `id smallint PK` (zawsze 1)
- `match_guid text`
- `timer text` (np. `"4:32"`, format zgodny z obecnym `game_state.timer`)
- `time_seconds int` (raw z API, do logiki overtime/koniec)
- `blue_score int default 0`
- `orange_score int default 0`
- `is_overtime bool default false`
- `updated_at timestamptz default now()`

**`players_live`** — wiersz na gracza, klucz = nick z gry
- `player_name text PK`
- `team_num smallint` (0 = blue, 1 = orange)
- `boost smallint default 0` (0–100)
- `speed real default 0`
- `goals smallint default 0`
- `assists smallint default 0`
- `saves smallint default 0`
- `shots smallint default 0`
- `demos smallint default 0`
- `is_demolished bool default false`
- `is_supersonic bool default false`
- `mmr int` (opcjonalnie — bot może dociągać; null jeśli brak)
- `updated_at timestamptz default now()`

Bot robi `upsert` po `player_name`. Stare wiersze usuwa po końcu meczu (lub TTL przez czyszczenie po `updated_at`).

**`active_camera`** — singleton (id=1, upsert)
- `id smallint PK` (zawsze 1)
- `target_name text` — nick gracza, na którego patrzy kamera (`Data.Game.Target.Name`)
- `updated_at timestamptz default now()`

**`players_registry`** — opcjonalne wzbogacenie (zdjęcie / ranga / flaga)
- `player_name text PK` — musi być **dokładnie** taki jak w grze (RL Stats `Name`)
- `display_name text` (pretty nick do UI, opcjonalny)
- `photo_url text`
- `country_code text` (ISO-2, np. `pl`)
- `rank_name text` (np. `"Diamond I"` — zgodne z `rank-utils.ts`)
- `mmr int`
- `team_color text` (override koloru, opcjonalny)
- `notes text`
- `updated_at timestamptz default now()`

Rejestrujemy wszystkie tabele w `supabase_realtime` (`ALTER PUBLICATION ... ADD TABLE`).

**Kluczowa zasada**: dane gameplay (`match_metadata`, `players_live`, `active_camera`) są źródłem prawdy. `players_registry` to **LEFT JOIN** po `player_name` — brak dopasowania nie psuje overlaya, tylko ukrywa zdjęcie/rangę/flagę.

---

### 2. Hook + typy: `useLiveStats`

Plik `src/hooks/useLiveStatsV2.ts`:
- Subskrybuje 3 tabele (`postgres_changes` event `*`).
- Pobiera initial state przy mount.
- Zwraca:
  ```ts
  {
    match: MatchMetadata | null,
    players: PlayerLive[],          // posortowane: blue najpierw, potem orange
    blue: PlayerLive[], orange: PlayerLive[],
    activeCameraTarget: string | null,
    activePlayer: PlayerLive | null,           // join players_live × target_name
    activeRegistry: PlayerRegistry | null      // LEFT JOIN po player_name
  }
  ```
- `players_registry` ładowany jednorazowo + invalidacja przy zmianie (subskrypcja osobna, rzadko się zmienia).

Typy w `src/types/livestats.ts`.

---

### 3. Routy & strony

`src/App.tsx` — dopisać:
```
<Route path="/v2/overlay" element={<OverlayV2 />} />
<Route path="/v2/admin/players" element={<PlayersRegistryAdmin />} />
```

Stare routy bez zmian.

#### `src/pages/OverlayV2.tsx` (1920×1080, OBS-ready)

```text
┌──────────────────────────────────────────────────────────┐
│           [BLUE 2]  04:32  [ORANGE 1]   ← Scoreboard top │
│                                                          │
│ ┌──────┐                                       ┌──────┐  │
│ │ P1   │                                       │ P4   │  │
│ │ ████ │            (gameplay)                 │ ███  │  │
│ │ goal │                                       │ goal │  │
│ ├──────┤            ┌──────────────┐           ├──────┤  │
│ │ P2   │            │ PLAYER CARD  │           │ P5   │  │
│ │ ███  │            │ (active cam) │           │ ████ │  │
│ ├──────┤            └──────────────┘           ├──────┤  │
│ │ P3   │                                       │ P6   │  │
│ └──────┘                                       └──────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Body transparent** (jak obecne overlaye), `?obs=1` ukrywa ewentualne kontrolki debug.
- **Scoreboard top** — reuse stylu skew (`-15deg`) z obecnego TeamBanner / studio header. Score z `match_metadata.blue_score/orange_score`, timer z `match_metadata.timer`, `is_overtime` → akcent neonowy + napis „OT".
- **Boost Bars** — dwa pionowe stacki po bokach (lewa = team_num 0 / blue, prawa = team_num 1 / orange), 3 sloty każdy. Nick + pasek boostu (0–100, animowany shift), pod paskiem mini-statystyki (goals / assists / saves / demos — reużyć ikon z pamięci `player-stats-in-boost-bars`). Stany:
  - `is_supersonic` → glow + pulsujący gradient.
  - `is_demolished` → desaturacja + ikona.
- **Player Card V2** — komponent renderowany warunkowo gdy `activePlayer` jest niepusty:
  - tło: skewed panel w kolorze drużyny (blue/orange, override z `registry.team_color` jeśli jest).
  - **Nick**: `registry.display_name ?? activePlayer.player_name`.
  - **MMR**: z `registry.mmr` lub `players_live.mmr` (fallback) — duży watermark Rajdhani (jak w `studio-match-card-design`).
  - Drużyna: kolor blue/orange.
  - Live stats: goals, assists, saves, boost (z paskiem), demos.
  - Zdjęcie/ranga/flaga: tylko jeśli `registry` ma mecz po `player_name`. Brak rejestru → karta dalej działa, po prostu bez avatara/flagi/rangi.
  - Wejście/wyjście: Framer Motion (slide + skew), debounce 300 ms na zmiany `target_name`, żeby nie migało przy szybkich przełączeniach kamery.

#### `src/pages/PlayersRegistryAdmin.tsx` (`/v2/admin/players`)

Prosty CRUD na `players_registry`:
- Tabela: player_name, display_name, photo_url (preview), rank (RankIcon), MMR, country.
- Formularz dodaj/edytuj — pola jak w schemacie.
- Walidacja `player_name` (unikalny PK).
- Rank jako select 22 rang z `rank-utils.ts`.
- Spójne z designem Studio (ten sam ciemny motyw, skewy).

---

### 4. Komponenty (nowy folder, nie ruszamy starych)

```
src/components/v2/
  ScoreboardV2.tsx
  BoostBarV2.tsx          // pojedynczy pasek + nick + statsy
  BoostStackV2.tsx        // 3 paski (per drużyna) z layoutem lewo/prawo
  PlayerCardV2.tsx
  OvertimeBadge.tsx
src/hooks/
  useLiveStatsV2.ts
src/types/
  livestats.ts
```

Style: tailwind + obecne `glow-utils`, `gradient-utils`, `RankIcon`, ikony statystyk. Skewy `-15deg` zgodnie z konwencją projektu.

---

### 5. Kontrakt z botem Python (dokumentacja, nie kod)

Bot zapisuje przy każdym evencie `UpdateState`:

| Pole z `Data` | Tabela | Operacja |
|---|---|---|
| `Game.Teams[0].Score`, `Game.Teams[1].Score`, `Game.TimeSeconds`, `Game.bOvertime`, `match_guid` | `match_metadata` (id=1) | UPSERT |
| `Game.Target.Name` | `active_camera` (id=1) | UPSERT |
| `Players[]` (Name, TeamNum, Boost, Goals, Assists, Saves, Shots, Demolitions, bDemolished, bSupersonic) | `players_live` | UPSERT po `player_name` |

`timer` formatuje bot (`mm:ss`) — overlay nie liczy nic sam. Po końcu meczu bot powinien wyczyścić `players_live` (DELETE) lub overlay sam ignoruje wiersze starsze niż X sekund (do zdecydowania w trakcie integracji).

---

### 6. Zakres zmian — lista plików

**Nowe**:
- migracja SQL (4 tabele + RLS + realtime publication)
- `src/types/livestats.ts`
- `src/hooks/useLiveStatsV2.ts`
- `src/components/v2/{ScoreboardV2,BoostBarV2,BoostStackV2,PlayerCardV2,OvertimeBadge}.tsx`
- `src/pages/OverlayV2.tsx`
- `src/pages/PlayersRegistryAdmin.tsx`

**Edytowane**:
- `src/App.tsx` — 2 nowe routy
- `src/integrations/supabase/types.ts` — auto-regeneracja po migracji

**Niezmienione**: cały stary system (`Overlay.tsx`, `useBroadcast.tsx`, `game_state`, Studio, Relay, Creator).

---

### 7. Co świadomie pomijam (do następnej iteracji, jeśli zechcesz)

- Auth/role na `/v2/admin/players` — domyślnie zostawiam jak resztę (RLS dev mode, dostęp tylko przez znajomość URL). Mogę dorzucić guard po roli `admin` jeśli powiesz.
- Persystencja końcowych stat-ów meczu (historia) — `players_live` jest stanem live, nie historią.
- Edge function syncująca registry z MMRivals — jeśli zechcesz później, dorobimy.
