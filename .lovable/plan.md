Plan naprawy obejmuje dwa niezależne problemy:

1. Wynik serii: stabilne centrowanie względem ekranu
- Przebuduję `SeriesScoreV2` tak, aby pozycja `offsetX=0` oznaczała zawsze punkt X=960 w scenie 1920x1080, niezależnie od długości BO i szerokości kropek.
- Zrezygnuję z używania `positionToStyle()` dla tego konkretnego komponentu, bo obecna implementacja ma `width: 0`, a przy anchorze `center` dodaje jeszcze `translateX(-50%)`. Dla elementu o zerowej szerokości to teoretycznie nie powinno przesuwać, ale w praktyce animacja/transform rodzica i absolutne dzieci dają niestabilne zachowanie.
- Zamiast tego komponent dostanie własny stały anchor:
  - `left: 960 + offsetX`
  - `top: 540 + offsetY`
  - bez `translateX(-50%)`
- Niebieskie kropki będą absolutnie po lewej stronie punktu, pomarańczowe po prawej.
- Etykieta BO będzie wycentrowana na punkcie anchor, ale nie będzie wpływać na położenie grup kropek.
- Dodam kontener z `overflow: visible`, `pointerEvents: none` i kontrolowanymi transformami, żeby zmiana BO1/BO3/BO5/BO7 nie przesuwała środka.
- Opcjonalnie dodam krótką podpowiedź w edytorze pozycji serii, że dla tego elementu `Anchor X=Środek` i `Offset X=0` oznacza środek ekranu.

2. Ikony rang w live: poprawne pobieranie i fallback
- Obecnie w bazie `players_live.mmr` jest puste (`null`) dla rzeczywistych graczy, więc fallback z live bota nie ma z czego wyliczyć rangi.
- Aktywna sesja ma natomiast wybrany turniej/mecz MMRivals i `player_pairings`, więc ranga/MMR powinny być brane z danych MMRivals, tak jak w Studio.
- Poprawię `useActivePlayerMmrInfo`, aby działał tak jak `MatchCard` w Studio:
  - najpierw bierze MMR zależny od trybu gry (`1v1`, `2v2`, `3v3`), najlepiej z danych turnieju/meczu,
  - jeżeli pole ranku z API jest nieprawidłowe (np. obecnie API zwraca `"v"`), ignoruje je,
  - wtedy wylicza nazwę rangi z MMR przez `getRankFromMmr()`.
- Dzięki temu live overlay będzie mógł wyświetlić ikonę nawet wtedy, gdy `players_live.mmr` jest `null`, pod warunkiem że gracz jest sparowany z zawodnikiem MMRivals.
- Dodatkowo dopasuję rozpoznawanie trybu gry do wartości turniejowych (`2v2OPEN`, `3v3`, itp.), zamiast zgadywać po liczbie graczy w drużynie, bo liczba może nie zawsze jednoznacznie oddawać tryb.

3. Ujednolicenie logiki ikon rang
- Wykorzystam istniejące `isValidRank`, `normalizeRankName` i `getRankFromMmr`, żeby overlay live zachowywał się tak samo jak Studio.
- W `PlayerCardV2` zostanie priorytet:
  1. MMRivals override z parowania aktywnego gracza,
  2. `players_registry`,
  3. `players_live.mmr`, jeżeli kiedyś bot zacznie je przesyłać.
- Tekst rangi nie będzie renderowany w karcie gracza — zostanie sama grafika.

Po wdrożeniu sprawdzę jeszcze, czy aktywny przypadek z obecnej bazy (`players_live.mmr = null`, ale aktywna sesja ma MMRivals pairings) powinien rozwiązać się do ikony rangi z MMRivals MMR.