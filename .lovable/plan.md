
Plan: włączanie autoscrolla drabinki automatycznie zawsze wtedy, gdy jej wysokość przekracza wysokość viewportu, tak aby overlay nie wymagał ręcznego scrollowania.

1. Diagnoza problemu
- Obecnie `BracketView` ma kontener z `overflowY: auto`, więc zachowuje się jak ręcznie przewijalny panel.
- Autoscroll istnieje, ale jest liczony inkrementalnie i wygląda na zbyt mało deterministyczny / zbyt mało zauważalny, przez co przy overflow użytkownik nadal musi używać myszki.

2. Co zmienię w `src/components/studio/BracketView.tsx`
- Dodam jawne wykrywanie overflow:
  - porównanie `outerRef.clientHeight` z rzeczywistą wysokością zawartości
  - stan typu `hasOverflow` / `maxScroll`
  - przeliczenie po zmianie meczów, po resize okna i po zmianie layoutu
- Zmienię kontener z trybu „manual scroll area” na „viewport dla animacji”:
  - ukryję ręczne przewijanie (`overflowY: hidden`)
  - scroll pozycji będzie sterowany wyłącznie programowo
- Przepiszę autoscroll na logikę opartą o czas rzeczywisty:
  - ping-pong: dół → góra
  - start tylko jeśli `maxScroll > 0`
  - ruch liczony z `deltaTime`, nie „na sztywno per frame”
  - dodam krótką pauzę na górze i na dole, żeby było czytelniej w overlayu
- Utrzymam obecną geometrię drabinki, linie SVG i stałe odstępy między boxami — bez cofania ostatnich poprawek layoutu.

3. Oczekiwany efekt
- Jeśli drabinka mieści się w ekranie: brak ruchu.
- Jeśli drabinka wychodzi poza ekran: autoscroll włącza się sam.
- Overlay nie wymaga już scrollowania myszką.
- Scroll jest widoczny i stabilny niezależnie od liczby meczów.

4. Szczegóły techniczne
- Plik do edycji: `src/components/studio/BracketView.tsx`
- Kluczowa zmiana:
```text
measure overflow -> if maxScroll > 0 start RAF loop -> update scrollTop by time
else keep scrollTop = 0 and no animation
```
- Dodatkowo podepnę przeliczenia do:
  - `visibleRounds`
  - `ResizeObserver` dla kontenera
  - resize viewportu
- Zachowam:
  - `H_GAP = 60`
  - SVG connector layer pod kafelkami
  - glassmorphism i skew kart
  - stałe odstępy między wrapperami meczów
