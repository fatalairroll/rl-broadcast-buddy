Przyczyna wygląda tak: kod relay w repo ma już `WRITE_INTERVAL_S = 0.1`, ale aktualne rekordy `players_live` w bazie stoją na jednym timestampie, więc w tej chwili overlay nie dostaje nowych klatek live. Jeśli po stronie PC relay jest uruchomiony ze świeżo pobranego pliku, problem może nadal być widoczny, bo boost z RL Stats API przychodzi jako dyskretne snapshoty, a overlay tylko tweenował szerokość paska do kolejnej wartości.

Plan naprawy:

1. Dodać w overlay lokalne wygładzanie boosta niezależne od częstotliwości bazy
   - Boost bar będzie animował wartość co klatkę (`requestAnimationFrame`) do ostatniej otrzymanej wartości.
   - Przy spadku boosta użyjemy płynnego „drain”, a przy wzroście szybkie, ale nadal płynne dogonienie wartości.
   - Dzięki temu nawet przy update co 100–250 ms pasek nie będzie wyglądał jak skok 80 → 54 → 33.

2. Zmienić `BoostBarV2` tak, żeby pasek i liczba korzystały z wygładzonej wartości
   - Pasek przestanie polegać wyłącznie na Framer Motion tween między rzadkimi snapshotami.
   - Liczba boosta może pozostać zaokrąglona, ale liczona z tej samej wygładzonej wartości, żeby nie migała brutalnie.

3. Dodać prostą diagnostykę do wygenerowanego `relay.py`
   - Heartbeat będzie pokazywał efektywną liczbę flushy / zapisów graczy na 5 sekund.
   - To pozwoli od razu zobaczyć, czy faktycznie działa nowo pobrany relay z `0.1s`, czy nadal stary plik.

4. Zaktualizować opis na stronie `/relay`
   - Jasno dopisać, że po zmianie trzeba pobrać nowy `relay.py` i zrestartować proces.
   - Dodać oczekiwany wynik: przy 6 graczach powinno być około 60 zapisów graczy/s w logach, a nie pojedyncze aktualizacje.

Efekt: nawet jeśli backend/realtime czasem dostarczy próbki nierówno, boost bary powinny wizualnie płynąć zamiast przeskakiwać.