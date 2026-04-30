## Diagnoza błędu

`did not receive a valid HTTP response` pochodzi z biblioteki `websockets` — próbuje wykonać uścisk WebSocket (HTTP Upgrade), ale **oficjalne RL Stats API to surowy TCP socket emitujący linie JSON, a nie WebSocket**. To zupełnie inny protokół niż BakkesMod SOS.

Dodatkowo wcześniejszy skrypt celował w port `49122` (SOS), a oficjalne API używa **`49123`** i wymaga ręcznego włączenia w `DefaultStatsAPI.ini`.

## Cel

Przepisać `relay.py` tak, by:
1. Łączył się z oficjalnym RL Stats API jako **TCP klient** (nie WebSocket).
2. Parsował kopertę `{"Event": "...", "Data": {...}}` zgodnie z dokumentacją Psyonix.
3. Mapował event `UpdateState` na tabele `match_metadata`, `players_live`, `active_camera` w Lovable Cloud.
4. Obsługiwał reconnect, czyszczenie graczy między meczami i logował błędy.

Dodatkowo: dostarczyć użytkownikowi krótką instrukcję włączenia API w grze (edycja `.ini`).

## Co dostarczam

### 1. Nowy `relay.py` (gotowy copy-paste)

Zawartość skryptu:

- **Konfiguracja**: hardkodowane `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RL_HOST = "127.0.0.1"`, `RL_PORT = 49123`.
- **Połączenie TCP** przez `asyncio.open_connection(RL_HOST, RL_PORT)` z auto-reconnectem co 3 s przy `ConnectionRefusedError` / `ConnectionResetError`.
- **Parser strumieniowy**: czytanie linii (`reader.readline()`); jeśli RL wysyła kilka JSON-ów w jednej ramce, fallback na akumulator + `json.JSONDecoder.raw_decode` aby wyciąć kolejne obiekty.
- **Handler `UpdateState`**:
  - upsert do `match_metadata` (id=1): `match_guid`, `time_seconds`, `timer` (sformatowany `M:SS`), `is_overtime`, `blue_score = Game.Teams[0].Score`, `orange_score = Game.Teams[1].Score`.
  - upsert do `players_live` po `player_name`: `team_num`, `boost`, `speed`, `goals`, `shots`, `assists`, `saves`, `demos`, `is_demolished` (`bDemolished`), `is_supersonic` (`bSupersonic`).
  - upsert do `active_camera` (id=1): `target_name = Game.Target.Name` jeśli `Game.bHasTarget`, w przeciwnym razie `None`.
  - **Czyszczenie**: na każdy `UpdateState` zapamiętujemy zbiór bieżących `Name`; po zmianie `MatchGuid` (nowy mecz) wykonujemy `delete().neq('player_name','')` na `players_live`, żeby nie zostawały duchy z poprzedniego meczu.
- **Handler `GoalScored`** (opcjonalnie): log do konsoli (przyda się później do animacji).
- **Throttling**: `time_seconds` i `boost` zmieniają się szybko — nie blokujemy upserta, ale pomijamy duplikaty (porównanie z lokalnym cache `last_state`), żeby nie spamować Supabase 30+ requestami/s.
- **Logging**: `print` z prefixami `[RL]`, `[DB]`, `[ERR]`.

### 2. Instrukcja włączenia API w grze

W odpowiedzi czatu (nie w kodzie) podam użytkownikowi:

- Ścieżkę pliku: `<Steam>\steamapps\common\rocketleague\TAGame\Config\DefaultStatsAPI.ini` (analogicznie dla Epic).
- Wymagane ustawienia:
  ```
  PacketSendRate=30
  Port=49123
  ```
- Uwagę: zmiany wymagają **restartu Rocket League**.
- Informację, że API działa **dla spectatora lub gracza w danej drużynie** — niektóre pola (`Boost`, `Speed`, `bSupersonic`) są oznaczone `SPECTATOR` i pojawią się tylko dla gracza obserwującego mecz w trybie spectator.

### 3. Brak migracji bazy

Sprawdzony schemat `match_metadata`, `players_live`, `active_camera` pokrywa wszystkie pola, które potrafi dostarczyć oficjalne API. Nie potrzebujemy żadnych ALTER-ów.

## Mapowanie pól (referencja)

```text
RL Stats API UpdateState        →   Supabase
─────────────────────────────────────────────────────────
Data.MatchGuid                  →   match_metadata.match_guid
Data.Game.TimeSeconds           →   match_metadata.time_seconds + timer (M:SS)
Data.Game.bOvertime             →   match_metadata.is_overtime
Data.Game.Teams[0].Score        →   match_metadata.blue_score
Data.Game.Teams[1].Score        →   match_metadata.orange_score
Data.Game.bHasTarget+Target.Name→   active_camera.target_name
Data.Players[i].Name            →   players_live.player_name (PK)
Data.Players[i].TeamNum         →   players_live.team_num
Data.Players[i].Boost           →   players_live.boost
Data.Players[i].Speed           →   players_live.speed
Data.Players[i].Goals/Shots/... →   players_live.goals/shots/...
Data.Players[i].Demos           →   players_live.demos
Data.Players[i].bDemolished     →   players_live.is_demolished
Data.Players[i].bSupersonic     →   players_live.is_supersonic
```

## Po zatwierdzeniu

Wkleję pełen skrypt `relay.py` w odpowiedzi (gotowy do skopiowania), a w samej aplikacji **nic się nie zmieni** — overlay V2 (`/v2/overlay`) i tabele Supabase już są gotowe na te dane. Po uruchomieniu poprawionego skryptu i włączeniu Stats API w `.ini`, overlay zacznie się aktualizować automatycznie.