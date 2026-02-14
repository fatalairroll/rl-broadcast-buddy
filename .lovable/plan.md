

# Plan: Naprawienie kontroli łamania nazw drużyn

## Problem
Nazwy dwuwyrazowe (np. "BLUE DRAGONS") są automatycznie łamane na dwie linie, nawet gdy suwak "Znaki na linię" jest na 0 (brak łamania). Przyczyną jest:
1. Kontener `<span>` ma `maxWidth: 150px` (domyślna wartość), który wymusza zawijanie CSS niezależnie od ustawień `maxCharsPerLine`
2. Klasa `flex flex-col` powoduje, że nawet naturalny CSS wrap dzieli tekst na linie

## Rozwiazanie

Dodanie `white-space: nowrap` gdy `maxCharsPerLine` jest 0 (tryb "bez łamania"), oraz usunięcie `maxWidth` z kontenera tekstu, żeby nie ograniczał szerokości sztucznie. Szerokość nazwy powinna być kontrolowana przez `width` elementu (kontener nadrzędny), a nie przez `maxWidth` wewnątrz spana.

## Zmiany w plikach

### `src/pages/Overlay.tsx`

**Team A Name (linia ~183-194):**
- Dodanie `whiteSpace: config.teamAName.maxCharsPerLine <= 0 ? 'nowrap' : 'normal'` do stylu spana
- Usunięcie `maxWidth` ze spana (szerokość kontroluje kontener nadrzędny)

**Team B Name (analogiczna zmiana):**
- Ta sama logika dla drugiej drużyny

### `src/components/creator/OverlayPreview.tsx`

**Team A Name (linia ~178-189):**
- Dodanie `whiteSpace: config.teamAName.maxCharsPerLine <= 0 ? 'nowrap' : 'normal'`
- Usunięcie `maxWidth` ze spana

**Team B Name (analogiczna zmiana)**

### `src/components/creator/StyleEditor.tsx`

- Zmiana opisu suwaka "Znaki na linię": wartość 0 oznacza "bez łamania (jedna linia)", wartości >0 określają po ilu znakach łamać

## Efekt
- Suwak na 0: nazwa zawsze w jednej linii, bez względu na długość
- Suwak na np. 6: nazwa łamie się po ~6 znakach (po całych słowach)
- Użytkownik ma pełną kontrolę nad tym, kiedy nazwa się łamie
