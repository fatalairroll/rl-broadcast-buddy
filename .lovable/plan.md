Potwierdziłem dwie rzeczy:

1. W samym Overlay V2 nie ma zahardcodowanych nazw `BLUE BOT 1`, `BLUE BOT 2`, `ORANGE BOT 1`, `ORANGE BOT 2`. Komponent `/v2/overlay` pobiera listę wyłącznie z tabeli `players_live` przez `useLiveStatsV2`.
2. Te 4 wpisy nadal siedzą w bazie jako stare rekordy. Mają `updated_at` ok. 15:34, a prawdziwi gracze są nowsi. Dlatego overlay je pokazuje.

Problem wygląda na to, że obecne czyszczenie w wygenerowanym `relay.py` nie usuwa ich skutecznie — najpewniej przez składnię `.not_.in_(...)` w pythonowym kliencie albo dlatego, że czyszczenie dzieje się tylko po udanym upsercie i może być pomijane/throttlowane.

Plan naprawy:

1. Poprawić wygenerowany `relay.py` w `src/pages/Relay.tsx`
   - Zastąpić aktualne `prune_stale_players(...).not_.in_(...)` bezpieczniejszą logiką:
     - pobierz aktualne `player_name` z `players_live`,
     - porównaj z nazwami graczy z bieżącego snapshota RL,
     - usuń rekordy, których nie ma w snapshotcie, pojedynczymi `.delete().eq("player_name", name)`.
   - Dzięki temu stare wpisy typu `BLUE BOT 1` i `ORANGE BOT 1` znikną niezależnie od problemów z operatorem `not in`.

2. Dodać natychmiastowe czyszczenie przy starcie/zmianie meczu
   - W eventach `MatchCreated` / `MatchInitialized` wyczyścić `players_live`, żeby nowy mecz/replay zaczynał z pustą listą.
   - Potem pierwsze `UpdateState` wstawi tylko realnych graczy obecnych w tym meczu.

3. Dodać awaryjne filtrowanie po świeżości w hooku Overlay V2
   - W `useLiveStatsV2` odfiltrować ekstremalnie stare wpisy z `players_live` na initial load i realtime state, np. starsze niż kilka minut względem najnowszego `updated_at` w tej samej tabeli.
   - To zabezpieczy overlay przed zalegającymi rekordami nawet wtedy, gdy relay chwilowo nie zdąży ich usunąć.
   - Nie będzie to filtrowanie konkretnych nazw botów, tylko ogólna ochrona przed stale data.

4. Jednorazowo wyczyścić obecne stare rekordy z bazy
   - Usunąć z `players_live` obecne rekordy: `BLUE BOT 1`, `BLUE BOT 2`, `ORANGE BOT 1`, `ORANGE BOT 2`.
   - To jest operacja na danych, nie migracja schematu.

Po wdrożeniu trzeba będzie pobrać/skopiować nowy `relay.py` ze strony `/relay` i uruchomić go ponownie. Overlay V2 powinien wtedy pokazywać tylko graczy faktycznie przychodzących z aktualnego meczu/replaya.