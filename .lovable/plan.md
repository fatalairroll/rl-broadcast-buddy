## Co potwierdziły logi

- TCP do `127.0.0.1:49123` działa, RL przesyła ~330 KB/s i 150+ eventów/s.
- Eventy które przychodzą: `ClockUpdatedSeconds`, `MatchCreated`, `UpdateState` (wszystkie z poprawnym JSON-em).
- W `UpdateState.Data` jest `MatchGuid`, `Game.Teams[0/1].Score`, `TimeSeconds`, `bOvertime`, `Arena`, `Ball.Speed`.
- **`Players: []` jest puste** — to ograniczenie oficjalnego API Psyonix: w prywatnym meczu z botami w trybie spectator offline pola pomocnicze (Players, Boost, Speed) NIE są wypełniane. To nie jest błąd naszego kodu.

## Cel

Mimo pustych `Players` chcę, żeby overlay V2 zaczął **już teraz** pokazywać:
- aktualny wynik drużyn (`blue_score` / `orange_score`),
- timer i status overtime,
- nazwę areny (na potem),

a kiedy użytkownik wejdzie jako spectator do prawdziwego meczu online, gracze pojawią się automatycznie w `players_live` bez żadnej dodatkowej zmiany.

## Co zmienię w `relay.py`

1. **Throttling wysyłek do Supabase**
   - Obecnie każdy z 150+ eventów/s próbuje robić upsert. To zatyka logi i Supabase.
   - Wyślę `match_metadata` **maks. 4 razy/s** (tylko gdy zmienił się `time_seconds`, `blue_score`, `orange_score` lub `is_overtime`) i `players_live` z tym samym throttle'em.
   - `active_camera` aktualizuję tylko gdy zmienia się `target_name`.

2. **Obsługa `ClockUpdatedSeconds` jako fallback dla timera**
   - Niektóre tryby gry nie wysyłają `UpdateState` z aktualnym `TimeSeconds`, ale ślą `ClockUpdatedSeconds`. Mapuję to na `match_metadata.time_seconds` + sformatowany `timer = M:SS`.

3. **Pomijanie pustych `Players` zamiast logować błędy**
   - Gdy `Players: []`, nie czyszczę `players_live` (żeby zachować ostatni stan z prawdziwego meczu) i loguję jednorazowy hint:  
     `[INFO] Players list empty — wejdź jako spectator do meczu z prawdziwymi graczami, żeby zobaczyć boost/speed/imiona.`

4. **Reset `players_live` tylko przy zmianie `MatchGuid` na **niepustą****
   - Obecny kod kasuje listę przy każdej zmianie GUID, nawet z pustego na pusty. Po poprawce przejście `"" → realGuid` wyzwala czyszczenie raz.

5. **Logi `[HB]` zamiast co 5 s pokazują co naprawdę poszło do Supabase**
   - Format: `[HB] eventów: 754 | DB: 12 match upserts, 0 player upserts, 0 camera | players_seen: 0`.
   - Dzięki temu od razu widać czy problem jest w "RL nie wysyła" czy "Supabase nie zapisuje".

## Co dostarczę

- Pełen, gotowy do wklejenia plik `relay.py` (cała zawartość — żadnych fragmentów).
- W aplikacji nie ruszam nic — `useLiveStatsV2`, `OverlayV2.tsx`, schemat Supabase zostają bez zmian, bo już teraz konsumują `match_metadata` poprawnie.

## Jak to zweryfikujesz

Po podmianie `relay.py` i restarcie:

1. **W Supabase Studio (Lovable Cloud)** otwórz tabelę `match_metadata`, wiersz `id=1` — powinieneś zobaczyć `time_seconds` zmieniający się w czasie i `blue_score` / `orange_score` rosnące, gdy boty strzelą.
2. **Overlay V2 (`/v2/overlay`)** — wynik i timer u góry zaczną się ruszać. Karty graczy zostaną puste do momentu wejścia do prawdziwego meczu online jako spectator.
3. **W konsoli relay** linia `[HB]` powinna pokazywać `DB: N match upserts` > 0.

## Uwaga końcowa o testach z botami

Jeśli chcesz przetestować pełen flow z graczami i kamerą (BoostBarV2, PlayerCardV2, kółko aktywnego gracza), musisz:
- albo zagrać **online** (Casual / Private z drugą osobą / Tournament) — wtedy Twoja postać będzie w `Players`,
- albo wejść w **replay z trybu Spectator** — wtedy wszyscy gracze i kamera będą uzupełnione,
- prywatny mecz z botami offline **nigdy nie wypełni `Players`** — to celowe ograniczenie Psyonix.

To nie jest coś co da się obejść kodem.
