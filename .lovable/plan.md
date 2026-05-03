## PostMatchStats — wariant B (pełny)

Komponent podsumowania meczu wyświetlający się 2 s po przejściu `match_metadata.is_active` z `true` na `false`. Dane agregowane na żywo z `players_live` (z nowymi kolumnami `is_on_ground` i `last_goal_speed`).

### 1) Migracja bazy

Dodaję dwie kolumny do `players_live`:

```sql
ALTER TABLE public.players_live
  ADD COLUMN is_on_ground boolean NOT NULL DEFAULT true,
  ADD COLUMN last_goal_speed real NOT NULL DEFAULT 0;
```

- `is_on_ground` — bot wpisuje aktualny stan `bOnGround` w każdym tickerze.
- `last_goal_speed` — bot na evencie `GoalScored` wpisuje `GoalSpeed` (uu/s lub km/h — patrz Założenia) w rekord strzelca; pozostali gracze zachowują swoją starą wartość. Frontend reaguje na wzrost `goals` przy danym graczu i zapisuje `last_goal_speed` jako kandydata na "najszybszy strzał".

Brak wpływu na istniejące inserty (defaulty pokrywają stare wiersze).

### 2) `src/types/livestats.ts`

W `PlayerLive` dodaję:
```ts
is_on_ground: boolean;
last_goal_speed: number;
```
Aktualizuję mocki w `src/lib/v2-mock-data.ts` (`is_on_ground: true`, `last_goal_speed: 0`).

### 3) `src/hooks/usePostMatchStats.ts` (nowy)

Wejście: `players: PlayerLive[]`, `match: MatchMetadata | null`.

Stan agregatów w `useRef<Map<string, RunningStats>>`:
```
{ maxDemos, prevGoals, goalSpeedMax, speedSum, speedSamples,
  supersonicMs, airMs, groundMs, lastTs }
```

Logika (efekt na zmianę `players`):
- Dla każdego gracza: `delta = clamp(now - lastTs, 0, 2000)`.
- `is_supersonic` -> `supersonicMs += delta`.
- `is_on_ground ? groundMs += delta : airMs += delta`.
- `speedSum += speed; speedSamples++`.
- Jeśli `goals > prevGoals` -> `goalSpeedMax = max(goalSpeedMax, last_goal_speed)`; `prevGoals = goals`.
- `maxDemos = max(maxDemos, demos)`.

Reset całej mapy gdy zmieni się `match.match_guid` lub `is_active` przejdzie z `false` na `true`.

Zwraca `winners`:
```
fastestShot   { player_name, value: km/h }
mostDemos     { player_name, value: count }
mostAir       { player_name, value: seconds }
mostGround    { player_name, value: seconds }
fastestAvg    { player_name, value: km/h }
mostSupersonic{ player_name, value: seconds }
```
Każde pole `null` jeśli brak danych.

### 4) `src/components/v2/PostMatchStats.tsx` (nowy)

Props: `winners`, `registryMap`, `pairings` (z `useBroadcast`).

Layout (na stage 1920x1080):
- Wrapper: `absolute inset-0 flex items-center justify-center pointer-events-none z-50`.
- Karta: `w-[760px] rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 shadow-2xl`.
- Nagłówek: `MATCH RECAP` (Rajdhani, tracking-widest), pod nim cienki gradient `from-[#3B82F6] via-white/40 to-[#F97316]`.
- 6 wierszy w gridzie `[icon 32] [achievement] [player+avatar] [value]`:
  - 🚀 Najszybszy strzał — `${value} km/h`
  - 💥 Zniszczenia — `${value} Demos`
  - ✈️ Czas w powietrzu — `${value} sec`
  - 🚜 Czas na ziemi — `${value} sec`
  - ⚡ Najszybszy na boisku — `${value} km/h`
  - 🔥 Supersonic control — `${value} sec`
- Avatar 28 px (`Avatar` z `photo_url` jeśli pairing rozwiąże się przez `players_registry`); fallback inicjały.
- Animacja: stan `mounted` ustawiany przez `setTimeout(2000)` po triggerze; klasy `animate-fade-in animate-scale-in` (już są w tailwindzie).

### 5) `src/pages/OverlayV2.tsx` — integracja

- `useRef<boolean>` z poprzednim `is_active`. Gdy `prev=true` i `current=false` -> `setShowRecap(true)` + zaplanować ukrycie po 12 s.
- Reset gdy `match_guid` się zmieni lub `is_active` wróci na `true`.
- Render `<PostMatchStats ... />` warunkowo poza `transition-opacity` wrapperem (żeby był widoczny gdy reszta gaśnie).

### Pliki

- `supabase/migrations/<timestamp>_postmatch_stats_columns.sql` (migracja)
- `src/types/livestats.ts` (rozszerzenie typu)
- `src/lib/v2-mock-data.ts` (uzupełnienie mocków)
- `src/hooks/usePostMatchStats.ts` (nowy)
- `src/components/v2/PostMatchStats.tsx` (nowy)
- `src/pages/OverlayV2.tsx` (integracja)

### Założenia

- **Jednostki prędkości**: zakładam, że bot wysyła `speed` i `last_goal_speed` w `uu/s`. Konwersja do km/h: `* 0.036`. Jeśli bot już wysyła km/h — usuniemy mnożnik (jedna stała w hooku).
- **Czas**: agregacja po stronie klienta, więc dokładność zależy od częstotliwości updateów `players_live` (typowo ~10 Hz). Przy clampie delta do 2000 ms krótkie rozłączenia nie zafałszują wyników.
- Karta znika po 12 s; mogę wystawić to jako konfig jeśli potrzebujesz.
