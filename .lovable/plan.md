

## Sprawdzenie: check-in w API MMRivals

### Wynik analizy
Przejrzałem wszystkie odpowiedzi z endpointu `overlay-data` (https://tvmieplfcvgmfcjaxpto.supabase.co/functions/v1/overlay-data). API obsługuje tylko 4 tryby: `next_match`, `next_3`, `bracket`, `tournaments`.

**Pełna lista pól zwracanych przez API:**
- **Tournament**: `name`, `mode`, `status`
- **Match**: `match_id`, `round_index`, `match_index`, `best_of`, `state` (`scheduled`/`in_progress`/`done`), `score_a`, `score_b`, `winner_team_id`, `scheduled_at`, `team_a`, `team_b`
- **Team**: `team_id`, `name`, `avg_mmr`, `seed`, `players`
- **Player**: `discord_id`, `nick`, `nick_in_game`, `rlstats_url`, `avatar`, `mmr_1v1/2v2/3v3`, `rank_1v1/2v2/3v3`

**Brak jakiegokolwiek pola** związanego z check-inem (sprawdzone klucze: `check`, `checkin`, `check_in`, `ready`, `confirmed`, itp.). Pole `scheduled_at` jest dostępne, ale w obecnym turnieju zawsze ma wartość `null`.

### Wniosek
**Nie da się tego zrobić po stronie naszej aplikacji** — endpoint `overlay-data` po prostu nie eksportuje danych o check-inie graczy/drużyn ani timestampach jego wykonania.

### Możliwe ścieżki dalej

1. **Rozszerzyć API MMRivals** (po stronie właściciela MMRivals) — dodać do odpowiedzi `team_a`/`team_b` pola np. `checked_in: boolean` i `checked_in_at: timestamp`, albo nowy tryb `mode=checkin` zwracający listę drużyn z czasami check-inu. To wymaga zmian po stronie MMRivals — nie mamy dostępu do tego repo.

2. **Bezpośredni dostęp do bazy MMRivals** — gdyby udostępniono nam connection string/service role key do projektu Supabase MMRivals (`tvmieplfcvgmfcjaxpto`), moglibyśmy z naszej edge function odpytywać tabelę check-inów bezpośrednio. Wymaga uzgodnienia z właścicielem.

3. **Własny tracking check-in w naszej Cloud** — zbudować w naszym dashboardzie ręczne oznaczanie check-inu drużyn (kto się zgłosił, o której). Niezależne od MMRivals, ale wymaga ręcznego klikania przez admina meczu.

### Rekomendacja
Najszybsza i najczystsza ścieżka to **opcja 1** — poproś właściciela MMRivals o dodanie pól `checked_in` i `checked_in_at` w endpoincie `overlay-data` (w obiektach `team_a`/`team_b` w trybach `bracket`/`next_match`/`next_3`). Gdy te pola zaczną się pojawiać w odpowiedzi, dorobimy ich obsługę w overlay'ach (np. ikonka „✓ checked-in 19:42” na karcie meczu). Chcesz, żebym przygotował opcję 3 (własny tracking) jako tymczasowe obejście, czy czekamy aż MMRivals wystawi te dane?

