## Diagnoza

Na screenie relay łączy się poprawnie z lokalnym API gry:

```text
[RL] Polaczono z RL Stats API na 127.0.0.1:49123
```

Czyli problem nie jest już w porcie ani transporcie TCP. Błąd:

```text
[ERR] handle_event: 'str' object has no attribute 'get'
```

oznacza, że przychodzi prawdziwy event z Rocket League, ale jedna z jego części jest nadal stringiem zamiast obiektem. Obecny skrypt rozpakowuje tylko cały payload, ale nie rozpakowuje osobno pola `Data`. W praktyce API potrafi wysłać np. event jako słownik, gdzie `Data` jest JSON-em zapisanym w stringu. Wtedy `handle_event()` przekazuje string do `handle_update_state()`, a ten próbuje wykonać `data.get(...)`.

## Plan naprawy

1. **Dodać uniwersalne rozpakowywanie JSON-stringów w `relay.py`**
   - W template skryptu na `/relay` dodam helper typu `decode_nested_json(value, max_depth=5)`.
   - Helper będzie rozpakowywał wartości typu `str`, `bytes`, `bytearray`, jeśli zawierają JSON.
   - Użyjemy go nie tylko dla całego eventu, ale też dla `evt["Data"]` / `evt["data"]`.

2. **Uodpornić `handle_event()` na nietypowe kształty eventów**
   - Po pobraniu `Data` skrypt spróbuje ją zdekodować.
   - Jeśli po dekodowaniu `Data` nadal nie jest obiektem, event zostanie pominięty z czytelnym komunikatem diagnostycznym, zamiast spamować wyjątkiem.
   - `GoalScored`, `ClockUpdatedSeconds`, `UpdateState` i replay events będą działały tylko na zwalidowanym `dict`.

3. **Uodpornić `handle_update_state()` i listę graczy**
   - Dodać zabezpieczenia, żeby `Players`, `Game`, `Teams`, `Target` były sprawdzane typami przed `.get()`.
   - Jeśli pojedynczy gracz w `Players` też przyjdzie jako JSON-string, skrypt spróbuje go zdekodować.
   - Dzięki temu relay nie wywali obsługi całego eventu przez jeden nietypowy wpis.

4. **Dodać krótki diagnostyczny podgląd pierwszych eventów**
   - Dodam licznik typu `raw_debug_printed`, który pokaże 1–3 pierwsze rozpoznane eventy i typ pola `Data`.
   - To pomoże szybko potwierdzić, czy API wysyła `UpdateState` oraz ile graczy jest w `Players`.
   - Logi będą krótkie i nie będą zalewać konsoli.

5. **Zaktualizować stronę `/relay`**
   - Podmienię generowany `relay.py` w `src/pages/Relay.tsx`.
   - Dodam informację, że jeśli ktoś widzi błąd `str object has no attribute get`, musi ponownie pobrać najnowszy skrypt z `/relay`.

## Pliki do zmiany

- `src/pages/Relay.tsx`
  - zmiana template stringa z Pythonem,
  - mała aktualizacja instrukcji diagnostycznej.

## Bez zmian

- Nie ruszamy bazy danych.
- Nie zmieniamy tabel `players_live`, `match_metadata`, `active_camera`.
- Nie wracamy do SOS/BakkesMod.
- Nie dodajemy dummy/animowanych danych.

## Oczekiwany efekt

Po pobraniu nowego `relay.py` i uruchomieniu go na replayu powinno zniknąć:

```text
[ERR] handle_event: 'str' object has no attribute 'get'
```

Zamiast tego heartbeat powinien zacząć pokazywać realne eventy i graczy, np.:

```text
[HB] mode=replay events=+... players_seen=10 | DB: match=+... players=+...
```

A overlay V2 zacznie dostawać realne dane z meczu/replaya.