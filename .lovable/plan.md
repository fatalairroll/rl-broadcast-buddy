
Plan: poprawa drabinki tak, żeby nie nakładała meczów i zawsze przewijała się, gdy treść jest wyższa od ekranu.

1. Naprawa logiki pionowego układu
- Zostawię liczenie wysokości kontenerów po absolutnym numerze rundy, żeby ukrycie wcześniejszych rund nie zmieniało geometrii.
- Zmienię układ kolumn tak, aby każdy wrapper meczu miał:
  - dynamiczną wysokość z `getContainerHeight(absoluteRoundIndex)`
  - stały odstęp od poprzedniego wrappera (`marginTop: BASE_GAP` dla wszystkich poza pierwszym)
- Dzięki temu odstępy między boxami będą zawsze stałe, a jednocześnie kolejne rundy pozostaną idealnie wyśrodkowane względem poprzednich.
- To usunie obecny problem: brak realnego odstępu w kolumnach powoduje ściskanie i wizualne nakładanie się meczów.

2. Ustalenie rzeczywistej wysokości kafelka
- Dopasuję sam `BracketMatchCard` do stałej wysokości zgodnej z matematyką layoutu (`MATCH_HEIGHT`).
- Ujednolicę wysokości 3 pasów wewnątrz kafelka (team A / score / team B), żeby karta nie była wyższa niż zakłada algorytm.
- To jest kluczowe przy dużej liczbie meczów: matematyka kontenerów musi odpowiadać realnemu DOM.

3. Naprawa autoscrolla
- Zmienię zewnętrzny kontener na faktycznie przewijalny w pionie (`overflow-y: auto`, scrollbary ukryte wizualnie).
- Zastąpię obecną prędkość „px na klatkę” ruchem liczonym względem czasu i wysokości treści:
  - jeśli `maxScroll <= 0` → brak scrolla
  - jeśli `maxScroll > 0` → pełny przejazd w dół w stałym czasie, potem płynny powrót
- Dzięki temu scroll będzie zauważalny i przewidywalny niezależnie od wysokości drabinki. Obecnie jest zbyt wolny dla dużych układów i sprawia wrażenie, że nie działa.

4. Zachowanie łączników i warstw
- Zostawię `H_GAP = 60` między kolumnami.
- Linie SVG pozostaną absolutną warstwą `z-index: 0`, a kafelki `z-index: 1`.
- Łączniki dalej będą szły od środka prawej krawędzi meczu do środka lewej krawędzi następnego meczu, w układzie H → V → H.
- Po zmianie pionowego spacingu przeliczanie linii będzie dalej działało, ale na poprawnych pozycjach.

5. Bez zmian w stylistyce, tylko korekta geometrii
- Zachowam glassmorphism, safe area, białe nagłówki rund i kolorowe kreseczki poza divem prostującym tekst.
- Jeśli będzie trzeba, delikatnie zwiększę `BASE_GAP` (np. z 8 do 10–12), ale tylko po to, żeby przy dużej liczbie meczów boxy miały czytelny, stały oddech.

Plik do edycji
- `src/components/studio/BracketView.tsx`

Szczegóły techniczne
- Obecny błąd nie wynika z samej idei `getContainerHeight`, tylko z tego, że:
  1. kolumny nie mają realnego, stałego odstępu między wrapperami,
  2. karta nie ma twardo wymuszonej wysokości zgodnej z `MATCH_HEIGHT`,
  3. autoscroll używa stałej wartości na klatkę zamiast prędkości zależnej od wysokości treści.
- Po poprawce geometria będzie spójna: matematyka layoutu = rzeczywisty rozmiar kart = poprawne scrollowanie.
