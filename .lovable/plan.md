Tak i nie.

Mecz z botami prawie na pewno tłumaczy brak graczy, boosta, speeda i aktywnej kamery, bo Rocket League w takim trybie często wysyła `Players: []`.

Ale sam timer powinien dać się obsłużyć, jeśli gra wysyła eventy zegara. Sprawdziłem aktualny stan bazy: `match_metadata` nadal ma domyślne `timer = 5:00`, `time_seconds = 300`, `blue_score = 0`, `orange_score = 0`. Na screenie z relaya też widać `DB: match=0 players=0 camera=0`, czyli overlay nic nie pokazuje, bo relay odbiera eventy z gry, ale nie zapisuje żadnych danych do bazy.

## Co trzeba zrobić

1. **Poprawić `relay.py`, żeby timer zapisywał się niezależnie od listy graczy**
   - Jeżeli przychodzi `ClockUpdatedSeconds`, relay ma aktualizować `match_metadata.time_seconds` i `timer`.
   - Jeżeli przychodzi `UpdateState` z `Game.TimeSeconds`, relay ma robić to samo.
   - Brak `Players` nie może blokować zapisu timera i wyniku.

2. **Dodać tryb testowy dla meczu z botami**
   - Gdy `Players` jest puste, relay utworzy testowych zawodników, np. `BLUE BOT 1`, `BLUE BOT 2`, `ORANGE BOT 1`, `ORANGE BOT 2`.
   - Ich boost/speed/statystyki będą symulowane, żeby dało się testować Overlay V2.
   - W prawdziwym meczu online relay automatycznie użyje realnych graczy zamiast testowych.

3. **Dodać symulowaną aktywną kamerę w trybie testowym**
   - Relay będzie co kilka sekund przełączał aktywnego testowego gracza.
   - Dzięki temu da się sprawdzić `PlayerCardV2`, nie tylko scoreboard.

4. **Uprościć logi diagnostyczne**
   - Log `DB: match=... players=... camera=...` będzie jasno pokazywał, czy dane faktycznie zapisują się do bazy.
   - Jeśli timer nadal nie przychodzi z gry, relay pokaże to wprost.

## Efekt po zmianie

Po podmianie całego `relay.py` i uruchomieniu go ponownie:

- Overlay V2 zacznie odliczać timer, jeśli Rocket League wysyła dane zegara.
- W meczu z botami zobaczysz testowych graczy, boost bary i aktywną kartę gracza.
- W prawdziwym meczu online dane testowe zostaną zastąpione prawdziwymi danymi z gry.

## Plik do zmiany

- `src/pages/Relay.tsx` — zaktualizuję generator pobieranego/skopiowanego pliku `relay.py`, żeby zawierał poprawioną pełną wersję skryptu.

Nie trzeba zmieniać struktury bazy ani Overlay V2.