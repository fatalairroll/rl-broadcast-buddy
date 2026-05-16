Zmierzyłem realne tempo zapisów do bazy: nowe rekordy wchodzą co ~400–800 ms (czyli ~1,5–2,5 Hz), a wszystkie 6 wpisów graczy ma identyczny `updated_at`. To potwierdza Twoją obserwację — nie jest to płynny strumień, tylko paczka „wszyscy gracze naraz, raz na ~0,5–1 s".

Dwie niezależne przyczyny:

1. Relay na PC nie wysyła tak szybko, jak ustawiono w repo
   - W kodzie `relay.py` w repo `WRITE_INTERVAL_S = 0.1` (10 Hz).
   - W bazie widać realnie ~2 Hz, czyli proces na PC działa ze starym throttle. Najpewniej nie został pobrany / zrestartowany nowy plik, albo Supabase rate-limit dla anon przycina UPSERTy.

2. Wygładzanie w overlay było zbyt zachowawcze
   - Aktualne tempo (~120–140 %/s) goni snapshot ~700–800 ms, więc pasek wyraźnie „spóźnia się" za rzeczywistością.
   - Przy interwałach 500–1000 ms i dużych skokach (np. 100 → 20) widać równoczesny start animacji u wszystkich graczy — co czyta się jako „wszyscy się odświeżają razem".

Plan naprawy (bez ruszania `relay.py`, bo nie chcesz/nie musisz):

A. Przyspieszyć i odporniejsze wygładzanie po stronie `BoostBarV2`
   - Zwiększyć szybkość gonienia targetu (np. 220 %/s w górę, 160 %/s w dół) — pasek dogania snapshot w ~300–500 ms zamiast ~700–800 ms.
   - Dodać proste „dryfowanie w dół" pomiędzy snapshotami (~20–30 %/s), jeśli gracz aktualnie spada — żeby między batchami pasek nie stał, tylko sensownie schodził, a po nadejściu paczki delikatnie się korygował. Dla gracza, który właśnie zbiera boost, dryf się nie aktywuje, bo target będzie wyższy.

B. Rozsynchronizować start animacji
   - Każdy pasek dostanie niewielkie losowe „phase offset" (0–80 ms) startujące rAF, żeby równoczesne snapshoty u 6 graczy nie wyglądały jak jeden wspólny skok.

C. Diagnostyka źródła wąskiego gardła (tylko log, nic nie zmienia)
   - Dodać w overlay (tylko w trybie deweloperskim / `?debug=1`) prosty licznik „events/s" i „last gap ms" dla `players_live`. Zobaczysz w konsoli, czy realnie idzie 2 Hz czy 10 Hz — to jednoznacznie pokaże, czy bot na PC działa już z nowym plikiem.

Co Ty robisz po mojej stronie: nic. Overlay sam pociągnie nowe wartości i wygląd po przeładowaniu. Jeśli po tych zmianach nadal czujesz „klatkowanie", to jednoznacznie znaczy, że relay na PC trzeba pobrać ponownie z `/relay` i zrestartować — wtedy chętnie wrócimy do tematu.