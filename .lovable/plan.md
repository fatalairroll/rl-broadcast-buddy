## Cel

Bot Python liczy wszystkie statystyki meczu i zapisuje gotowy rekord do nowej tabeli `match_results`. Frontend tylko subskrybuje tabelę i wyświetla dane. Frontend nie agreguje już niczego.

## 1) Migracja bazy

Nowa tabela `public.match_results`:

```sql
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_guid text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Public RLS (zgodnie z konwencją projektu — dev mode)
CREATE POLICY "Public read match_results" ON public.match_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert match_results" ON public.match_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update match_results" ON public.match_results FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete match_results" ON public.match_results FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER trg_match_results_updated_at
  BEFORE UPDATE ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;
ALTER TABLE public.match_results REPLICA IDENTITY FULL;
```

Jednocześnie wycofujemy nieużywane kolumny z `players_live` (już nie potrzebne po stronie aplikacji):

```sql
ALTER TABLE public.players_live
  DROP COLUMN IF EXISTS is_on_ground,
  DROP COLUMN IF EXISTS last_goal_speed;
```

(Bot przestanie je wysyłać — patrz sekcja Relay.)

## 2) Kontrakt JSONB `data`

Bot zapisuje (upsert po `match_guid`) rekord z polem `data` w formacie:

```json
{
  "winners": {
    "fastestShot":    { "player_name": "...", "value": 142, "unit": "km/h" },
    "mostDemos":      { "player_name": "...", "value": 3,   "unit": "count" },
    "mostAir":        { "player_name": "...", "value": 187, "unit": "sec" },
    "mostGround":     { "player_name": "...", "value": 95,  "unit": "sec" },
    "fastestAvg":     { "player_name": "...", "value": 78,  "unit": "km/h" },
    "mostSupersonic": { "player_name": "...", "value": 42,  "unit": "sec" }
  }
}
```

Dowolny `winner` może być `null`. Frontend nie robi konwersji jednostek — bot wysyła już finalne wartości.

## 3) Frontend — co usuwamy

- `src/hooks/usePostMatchStats.ts` — DELETE (cała agregacja w locie znika).
- `is_on_ground`, `last_goal_speed` z `src/types/livestats.ts` (`PlayerLive`).
- Te same pola z `src/lib/v2-mock-data.ts`.
- Z `src/pages/Relay.tsx` usuwamy mapowanie `bOnGround` i logikę `last_goal_speed_by_player` (bot będzie pisał do `match_results`, nie do `players_live`).

## 4) Frontend — nowy hook `useMatchResult`

`src/hooks/useMatchResult.ts`:
- Wejście: `matchGuid: string | null`.
- Pobiera `match_results` po `match_guid` (`maybeSingle`).
- Subskrybuje realtime channel `match_results` (`postgres_changes` event `*`, filter `match_guid=eq.<guid>`) — aktualizuje stan na INSERT/UPDATE.
- Reset gdy `matchGuid` się zmienia.
- Zwraca `winners | null` bezpośrednio z `data.winners`.

## 5) `PostMatchStats.tsx`

- Props zmieniają się: zamiast `winners` z hooka liczącego — `winners: PostMatchWinners | null` z `useMatchResult`.
- Typ `PostMatchWinners` przenosimy do `src/types/livestats.ts` (lub nowy `src/types/matchResult.ts`) — usuwamy zależność od skasowanego hooka.
- Render pozostaje identyczny (ten sam UI, ten sam `style: PostMatchStatsStyle`).
- Jeśli `winners === null` — komponent nie renderuje nic (czeka na wpis bota).

## 6) `OverlayV2.tsx` — integracja

- Usuwamy `usePostMatchStats(...)`.
- Dodajemy `const result = useMatchResult(match?.match_guid ?? null);`.
- Dotychczasowa logika `showRecap` (trigger 2 s po `is_active: true → false`, auto-hide po `delayMs + durationMs`) zostaje bez zmian.
- Dodatkowy warunek render: `{showRecap && result && <PostMatchStats winners={result.winners} ... />}`.
- Jeśli bot jeszcze nie wpisał wyniku w momencie triggera — komponent pojawi się automatycznie gdy realtime dostarczy rekord (do końca okna `durationMs`).

## 7) Relay (`src/pages/Relay.tsx`) — zmiana skryptu Pythona

W zakładce `/relay` aktualizujemy snippet bota:

- Usuwamy z payloadu `players_live` pola `is_on_ground` i `last_goal_speed`.
- Dodajemy w bocie agregację per-mecz (in-memory w bocie):
  - `air_ms`, `ground_ms`, `supersonic_ms` per gracz na bazie ticków `bOnGround` / `is_supersonic`.
  - `speed_sum`, `speed_samples` per gracz.
  - `max_demos` per gracz.
  - `goal_speed_max` per gracz (na evencie `GoalScored` zapis `GoalSpeed` strzelcowi).
- Reset agregatów przy `MatchCreated/Initialized` lub zmianie `match_guid`.
- Na evencie `MatchEnded`/`PodiumStart` bot wybiera zwycięzców per kategoria, konwertuje jednostki (uu/s → km/h: `*0.036`, ms → s) i robi:

```python
sb.table("match_results").upsert({
    "match_guid": match_guid,
    "data": {"winners": winners_dict},
}, on_conflict="match_guid").execute()
```

- W `Relay.tsx` aktualizujemy też status panel, jeśli pokazuje listę kolumn `players_live` (kosmetyka).

## 8) Creator — bez zmian funkcjonalnych

`PostMatchStatsStyle` (visibility per wiersz, kolory, fonty, `delayMs`, `durationMs`) zostaje. Edytor w Kreatorze działa dalej tak samo — to czysto wizualny config.

## Pliki

- `supabase/migrations/<ts>_match_results_table.sql` (nowa tabela, RLS, realtime, drop kolumn z `players_live`)
- `src/hooks/useMatchResult.ts` (nowy)
- `src/hooks/usePostMatchStats.ts` (DELETE)
- `src/components/v2/PostMatchStats.tsx` (zmiana propsów)
- `src/pages/OverlayV2.tsx` (zamiana hooka)
- `src/types/livestats.ts` (usunięcie 2 pól z `PlayerLive`, opcjonalnie `PostMatchWinners`)
- `src/lib/v2-mock-data.ts` (usunięcie 2 pól z mocków)
- `src/pages/Relay.tsx` (snippet Pythona: agregacja w bocie + zapis do `match_results`)

## Założenia

- Bot wysyła wartości w **finalnych** jednostkach (km/h, sekundy, count). Frontend nic nie konwertuje.
- Klucz unikalny to `match_guid`; jeśli bot powtórzy upsert, rekord się nadpisze — frontend dostanie UPDATE i pokaże najnowsze dane.
- Brak rekordu w `match_results` przy końcu meczu = karta się nie pokazuje (do momentu aż realtime dostarczy wpis lub upłynie `durationMs`).
