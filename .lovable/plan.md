

# Plan: Rozsuwanie X dla wyników/serii/nazw + limit znaków w nazwie drużyny

## Problem 1: OffsetX nie rozsuwa elementów symetrycznie

Obecnie offsetX przesuwa elementy Team A i Team B w tym samym kierunku (oba w prawo lub oba w lewo). Użytkownik chce, żeby zwiększanie offsetX **rozsuwało** elementy od środka scoreboardu, a zmniejszanie zbliżało.

### Rozwiązanie

Negacja offsetX dla elementów po lewej stronie (Team A). Elementy Team B zachowują dodatni offsetX.

**Dotyczy 3 par elementów:**
- Score display: Team A score dostaje `-offsetX`, Team B score zostaje `+offsetX`
- Team A Name dostaje `-offsetX`, Team B Name zostaje `+offsetX`
- Series dots pod Team A dostają `-offsetX`, series dots pod Team B zostają `+offsetX`

### Zmiany w plikach

**`src/pages/Overlay.tsx`:**
- Linia 163: Team A Name - zmiana `config.teamAName.offsetX` na `-config.teamAName.offsetX`
- Linia 182: Team A Series - zmiana `config.seriesDisplay.offsetX` na `-config.seriesDisplay.offsetX`
- Linia 207: Team A Score - zmiana `config.scoreDisplay.offsetX` na `-config.scoreDisplay.offsetX`

**`src/components/creator/OverlayPreview.tsx`:**
- Linia 159: Team A Name - zmiana `config.teamAName.offsetX * 0.4` na `-config.teamAName.offsetX * 0.4`
- Linia 178: Team A Series - zmiana `config.seriesDisplay.offsetX * 0.4` na `-config.seriesDisplay.offsetX * 0.4`
- Linia 213: Team A Score - zmiana `config.scoreDisplay.offsetX * 0.4` na `-config.scoreDisplay.offsetX * 0.4`

**`src/components/creator/StyleEditor.tsx`:**
- Zmiana etykiet "Przesunięcie X" na "Rozsuwanie X" dla: scoreDisplay (linia 121), seriesDisplay (linia 329), teamAName/teamBName (linia 431)

---

## Problem 2: Kontrola łamania nazwy drużyny na linie

Użytkownik chce ustawić ile znaków mieści się w jednej linijce, zanim nazwa się "złamie" na drugą linię (widoczne na screenshocie: "BLUE DRAGONS" i "ORANGE PHOENIX" są w dwóch liniach).

### Rozwiązanie

Dodanie pola `maxCharsPerLine` do `TeamNameConfig`. Renderowanie nazwy drużyny z podziałem na linie w obu plikach (Overlay.tsx i OverlayPreview.tsx).

### Zmiany w plikach

**`src/types/broadcast.ts`:**
- Dodanie `maxCharsPerLine: number` do `TeamNameConfig` (domyślnie 0 = bez łamania)
- Ustawienie domyślnej wartości na 0 w `defaultOverlayConfig` dla obu drużyn

**`src/pages/Overlay.tsx`:**
- Zamiana prostego `{session?.team_a_name || 'Blue Team'}` na funkcję dzielącą tekst na linie po N znakach
- To samo dla Team B

**`src/components/creator/OverlayPreview.tsx`:**
- Ta sama logika podziału tekstu w podglądzie

**`src/components/creator/StyleEditor.tsx`:**
- Dodanie suwaka "Znaki na linię" (0-30) w edytorze nazwy drużyny (0 = bez łamania)

### Logika podziału tekstu

Funkcja pomocnicza `splitTeamName(name: string, maxChars: number)`:
- Jeśli `maxChars <= 0` lub nazwa jest krótsza - zwraca nazwę bez zmian
- Dzieli nazwę po słowach, kumulując znaki, i łamie linię gdy przekroczy limit
- Wynik renderowany jako `<span>` z oddzielnymi liniami (`<br />` lub flex column)

