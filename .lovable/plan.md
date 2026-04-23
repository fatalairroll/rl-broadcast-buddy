
## Plan: Check mark wewnątrz pasków z nazwami drużyn

### Cel
Na overlayu „Next Matches" dodać ikonkę ✓ (check mark) na zewnętrznych krańcach pasków z nazwami drużyn — wewnątrz banera, dla drużyn które mają `checked_in === true`.

- Drużyna A (lewa) → ikonka po **lewej** stronie banera (zewnętrzny kraniec)
- Drużyna B (prawa) → ikonka po **prawej** stronie banera (zewnętrzny kraniec)
- Tylko gdy drużyna ma check-in. Gdy brak — żadnej ikony (oczekujący status pozostaje pod banerem jak teraz).

### Zmiana w kodzie
Jeden plik: `src/components/studio/MatchCard.tsx`

W komponencie `TeamBanner`:
1. Zmienić wewnętrzny `<span>` z nazwą na flexbox (`display: flex`, `align-items: center`, `justify-content: space-between`).
2. Dodać warunkowo `<Check />` z `lucide-react` (już importowany w pliku) — kolor zielony (`#22c55e`), `size={18}`, `strokeWidth={3}`, z `text-shadow`/`drop-shadow` dla czytelności.
3. Pozycja zależna od `side`:
   - `side === 'a'` → ikona jako pierwszy element flex (po lewej, zewnętrzny kraniec), nazwa wyrównana do prawej
   - `side === 'b'` → ikona jako ostatni element flex (po prawej, zewnętrzny kraniec), nazwa wyrównana do lewej
4. Ikona dziedziczy `transform: skewX(5deg)` razem z nazwą (już jest w nadrzędnym spanie).

### Co zostaje bez zmian
- Banner pod-status (zielona kropka + godzina lub „Oczekuje") pozostaje pod banerem — to dwie różne informacje (ikona w banerze = szybki sygnał wizualny, pasek pod = szczegół z godziną).
- Skew, tła gradientowe, rozmiary banerów, alignment tekstu — bez zmian.
- Drabinka (`BracketView`) — bez zmian.

### Zakres
1 plik, 1 komponent (`TeamBanner`), kilka linii.
