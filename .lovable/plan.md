## Diagnoza

Na screenie `relay.py` cały czas stoi na:

```text
[WS] Laczenie z ws://127.0.0.1:49123 ...
events=+0 ... brak danych z RL
```

To oznacza, że skrypt nie ustanawia poprawnego połączenia z lokalnym API gry. Po sprawdzeniu oficjalnej dokumentacji i istniejących bibliotek widać ważny niuans: dokumentacja nazywa to „web socket”, ale w aktualnych buildach Rocket League endpoint na `49123` może działać jako zwykły lokalny TCP stream z JSON-em, bez handshake WebSocket. Nasz skrypt po ostatniej zmianie próbuje wyłącznie WebSocket (`websocket-client`), więc może nigdy nie dostać eventów.

## Plan naprawy

1. **Zamienić transport w `relay.py` na odporny klient TCP**
   - Połączyć się przez zwykły `socket.create_connection((127.0.0.1, 49123))`.
   - Czytać ciąg bajtów z portu `49123`.
   - Parsować kolejne wiadomości JSON z bufora przy pomocy `json.JSONDecoder().raw_decode(...)`, zamiast zakładać WebSocket albo newline-delimited JSON.
   - Dodać reconnect co kilka sekund, gdy gra nie działa albo API jeszcze nie jest aktywne.

2. **Zostawić aktualny mapping danych z oficjalnego API**
   - `UpdateState.Data.Players[]` dalej zapisuje `players_live`.
   - `UpdateState.Data.Game.Teams[]` dalej zapisuje wynik.
   - `UpdateState.Data.Game.Target` dalej zapisuje aktywną kamerę.
   - `ClockUpdatedSeconds`, `GoalReplayStart/End`, `MatchPaused/Unpaused`, `ReplayCreated` zostają obsłużone tak jak teraz.

3. **Poprawić logi diagnostyczne**
   - Zamiast `[WS]` używać `[RL]` / `[TCP]`, żeby było jasne, że to nie BakkesMod/SOS i nie klasyczny WebSocket.
   - Po udanym połączeniu logować: „Połączono z RL Stats API na 127.0.0.1:49123”.
   - Jeżeli port odmawia połączenia, komunikat będzie sugerował dokładnie:
     - sprawdź ścieżkę `TAGame/Config/DefaultStatsAPI.ini`,
     - `PacketSendRate > 0`,
     - restart Rocket League,
     - uruchom mecz/replay.

4. **Zaktualizować instrukcję na `/relay`**
   - Usunąć wymóg `websocket-client`, bo nie będzie już potrzebny.
   - Instalacja będzie:
     ```text
     pip install supabase requests
     ```
   - Dodać krótką notkę, że skrypt używa oficjalnego RL Stats API na porcie `49123` przez lokalny TCP stream.

## Pliki do zmiany

- `src/pages/Relay.tsx`
  - podmiana template stringa `getRelayScript()` w części transportu,
  - korekta tekstów instalacyjnych.

## Bez zmian

- Nie ruszamy bazy danych.
- Nie ruszamy overlayu `/v2/overlay` ani hooka `useLiveStatsV2`.
- Nie wracamy do SOS Plugin/BakkesMod.
- Nie przywracamy dummy botów.

## Efekt po wdrożeniu

Po pobraniu nowego `relay.py` i uruchomieniu go podczas meczu lub replaya powinieneś zobaczyć w konsoli:

```text
[RL] Polaczono z RL Stats API na 127.0.0.1:49123
[HB] mode=... events=+... players_seen=...
```

A overlay powinien zacząć dostawać realnych graczy z replaya/meczu, zamiast stać na pustych danych.