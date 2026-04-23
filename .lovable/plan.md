
## Plan: Check mark również w meczach z kolejki „Wkrótce"

### Cel
Ikonki ✓ check-in mają być widoczne dla **wszystkich** wyświetlanych drużyn z check-inem — zarówno w głównym meczu (już działa), jak i w kolejnych meczach pokazywanych pod nim w komponencie `UpcomingQueueRow` (obecnie tam ich brak).

### Zmiana w kodzie
Jeden plik: `src/components/studio/MatchCard.tsx`, jeden komponent: `UpcomingQueueRow`.

W komórkach z nazwami drużyn (linie ~333-335 dla A, ~348-350 dla B) dodać warunkowo ikonę `<Check />`:

- **Drużyna A (lewa)**: ikona po **lewej** stronie nazwy (zewnętrzny kraniec), nazwa zostaje wyrównana do prawej. Layout: `flex items-center justify-end gap-2` z ikoną jako pierwszy element.
- **Drużyna B (prawa)**: ikona po **prawej** stronie nazwy (zewnętrzny kraniec), nazwa wyrównana do lewej. Layout: `flex items-center justify-start gap-2` z ikoną jako ostatni element.

Stylistyka ikony spójna z banerem głównego meczu, ale **mniejsza** żeby pasowała do węższego paska kolejki:
- `size={14}`, `strokeWidth={3}`, `color="#22c55e"`
- `filter: drop-shadow(0 1px 2px rgba(0,0,0,0.7)) drop-shadow(0 0 4px rgba(34,197,94,0.5))`

Warunki widoczności: `match.team_a?.checked_in === true` / `match.team_b?.checked_in === true` (gdy `false`/brak — nic, zachowanie identyczne jak w `TeamBanner`).

### Co zostaje bez zmian
- `TeamBanner` (główny mecz) — bez zmian, działa już poprawnie.
- `BracketView`, `RecentMatchesTable` — bez zmian.
- Layout/szerokość paska kolejki, skew, gradient — bez zmian.

### Zakres
1 plik, 1 komponent (`UpcomingQueueRow`), 2 miejsca w JSX.
