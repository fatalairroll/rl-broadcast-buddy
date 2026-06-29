## Diagnoza

Przeglądarka **nie łączy się bezpośrednio** z RL Stats API (port 49123). Robi to lokalny skrypt Python (treść w `src/pages/Relay.tsx`), który zapisuje stan do bazy (`match_metadata`, `players_live`, …). Overlay i hooki czytają wyłącznie z bazy.

Obecny `useSeriesAutoTracker` zgaduje zwycięzcę po resecie wyniku `X:Y → 0:0` z 10-sek. debounce. To zawodne: punkt leci dopiero po starcie kolejnej gry, nie reaguje na `MatchDestroyed`. Python-relay już rozpoznaje `MatchEnded`/`MatchDestroyed` (linie ~867–897), ale **nie propaguje** `WinnerTeamNum` ani typu zdarzenia do bazy.

## Cel

Sterować serią BO zdarzeniami z RL Stats API:

- `MatchEnded` z `WinnerTeamNum ∈ {0,1}` → `+1` zwycięskiej drużynie (blue=0, orange=1; mapowanie na A/B przez dotychczasowe `resolveBlueIsTeamA`).
- `MatchEnded` bez prawidłowego `WinnerTeamNum` → **pomijamy całkowicie** (RL ranked nie ma remisów).
- `MatchDestroyed` → `0:0`.

Ścieżka „roster diff w turnieju → reset 0:0” pozostaje bez zmian.

## Plan

### 1) Migracja `match_metadata` — kanał zdarzeń

Nowe kolumny na singletonie (id=1):

- `last_event text` — `'MatchEnded' | 'MatchDestroyed' | null`
- `last_event_seq bigint NOT NULL DEFAULT 0` — monotoniczny licznik
- `last_winner_team_num smallint` — `0` | `1` | `NULL`
- `last_event_at timestamptz`

Tabela ma już realtime + `REPLICA IDENTITY FULL`, front dostanie zmiany natychmiast.

### 2) Python-relay (`src/pages/Relay.tsx`) — emit zdarzeń

W obsłudze eventów (linie ~867–897) ustawić `pending_match_event`:

```python
if name == "MatchEnded":
    w = data.get("WinnerTeamNum")
    winner = int(w) if w in (0, 1, "0", "1") else None
    pending_match_event = {
        "last_event": "MatchEnded",
        "last_winner_team_num": winner,
    }
    dirty_match = True

if name == "MatchDestroyed":
    pending_match_event = {
        "last_event": "MatchDestroyed",
        "last_winner_team_num": None,
    }
    dirty_match = True
```

W miejscu składania payloadu do `db_upsert_match` / `match_metadata.upsert`:

- jeśli `pending_match_event ≠ None` → wmerguj pola + `last_event_seq = local_seq + 1` + `last_event_at = "now()"`, zinkrementuj `local_seq`, wyczyść `pending_match_event` po sukcesie.
- pozostałe ticki **nie modyfikują** `last_event*` (nie wkładamy ich do payloadu — `upsert` nadpisze tylko podane kolumny, reszta zostaje).
- przy starcie skryptu raz odczytujemy bieżący `last_event_seq` z DB do `local_seq` (fallback `0`).

> **Uwaga dla użytkownika:** treść Python skryptu w `src/pages/Relay.tsx` to dokumentacja — żeby zadziałało, **trzeba skopiować nową wersję i uruchomić ją lokalnie**. Zaznaczę to w UI strony `/relay` (krótki banner „nowa wersja skryptu wymagana”).

### 3) `useLiveStatsV2` + typy

- `select` w `useLiveStatsV2.ts` rozszerzyć o `last_event, last_event_seq, last_winner_team_num, last_event_at`.
- `src/types/livestats.ts` (`LiveMatch`) — dodać pola.
- Typy Supabase regenerują się po migracji.

### 4) Hook `useSeriesAutoTracker.ts` — model zdarzeniowy

Wyciąć gałąź „score reset → +1” (`lastScoresRef`, debounce 10 s, blok porównujący `prev > 0 && now == 0`). Dodać:

```ts
const seq = live.match?.last_event_seq ?? 0;
const lastSeqRef = useRef<number>(seq); // init = aktualny seq → brak triggera przy mount

useEffect(() => {
  if (!session || session.series_auto_enabled === false) return;
  if (seq === lastSeqRef.current) return;
  lastSeqRef.current = seq;

  const ev = live.match?.last_event;
  if (ev === 'MatchDestroyed') {
    void updateSession({ team_a_series_score: 0, team_b_series_score: 0 });
    return;
  }
  if (ev === 'MatchEnded') {
    const w = live.match?.last_winner_team_num;
    if (w !== 0 && w !== 1) return; // brak winnera → pomijamy całkowicie
    const blueWon = w === 0;
    const blueIsA = resolveBlueIsTeamA(livePlayers, session, currentMatch);
    const winnerIsA = blueWon ? blueIsA : !blueIsA;
    const field = winnerIsA ? 'team_a_series_score' : 'team_b_series_score';
    const current = (winnerIsA ? session.team_a_series_score : session.team_b_series_score) ?? 0;
    void updateSession({ [field]: current + 1 });
  }
}, [seq, session, livePlayers, currentMatch, live.match, updateSession]);
```

Zachowujemy: roster-diff reset, init `lastTournamentSetRef`, reset refów na zmianę `mmr_match_id` (dorzucamy do tego `lastSeqRef = aktualny seq`, żeby zmiana meczu nie wywołała ponownie ostatniego zdarzenia).

## Pliki

- `supabase/migrations/<new>.sql` — 4 nowe kolumny w `match_metadata` (RLS/GRANT bez zmian — istnieją).
- `src/pages/Relay.tsx` — edycja Python-stringa + krótki banner „wymagana nowa wersja skryptu”.
- `src/hooks/useLiveStatsV2.ts`, `src/types/livestats.ts` — nowe pola.
- `src/hooks/useSeriesAutoTracker.ts` — refaktor.
- `src/integrations/supabase/types.ts` — autoregeneracja.