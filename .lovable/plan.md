

# Plan: Polerowanie wizualne drabinki turniejowej

## Plik: `src/components/studio/BracketView.tsx`

### 1. Usunięcie kolorowych kresek przy wyniku (linie 296-297)
Usunąć dwa elementy `<div className="absolute left-0...">` (niebieska kreska) i `<div className="absolute right-0...">` (pomarańczowa kreska) z paska wyniku.

### 2. Jednolite tło kafelków meczowych (linia 261)
Zamienić gradient `linear-gradient(135deg, rgba(15,23,42,0.92)...)` na proste `rgba(0,0,0,0.6)`.

### 3. Usunięcie kolorowych border-left z pasków drużyn (linie 272, 306)
Usunąć `borderLeft: 3px solid BLUE/ORANGE` z pasków Team A i Team B.

### 4. Typografia — "Poprzednie rundy zakończone" (linia 198)
Zmienić kolor z `rgba(255,255,255,0.3)` na `#ffffff` i dodać `textShadow: '0 1px 4px rgba(0,0,0,0.7)'`.

### 5. Typografia — nagłówki rund (linie 214-225)
- Kolor tekstu: biały (`#ffffff`), `fontWeight: 700`
- Usunąć tło `rgba(255,255,255,0.04)` i `borderBottom`
- Dodać `best_of` do tekstu: pobrać `best_of` z pierwszego meczu w rundzie i wyświetlić np. `RUNDA 4 BO3`

### 6. Seedy — jaśniejszy kolor (linie 283, 317)
Zmienić `rgba(255,255,255,0.3)` na `rgba(255,255,255,0.6)`.

### 7. Zmniejszenie mb nagłówka rundy
Zmienić `mb-2` na `mb-0.5` w nagłówku rundy.

### 8. Zmniejszenie gap między rundami (linia 161)
Zmienić `gap-10` na `gap-5` w kontenerze flex.

### 9. Łączniki SVG — subtelne białe linie (linie 169-178)
- Kolor: zawsze `rgba(255,255,255,0.3)` (bez kolorów drużynowych)
- Grubość: `strokeWidth={1}`
- Usunąć glow/drop-shadow
- Uprościć stałe — usunąć `glow` z `LineData`

