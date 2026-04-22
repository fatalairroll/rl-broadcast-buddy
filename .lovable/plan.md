

## Plan: Obsługa check-in z MMRivals API

### Co zostanie dodane
Nowe pola check-in z API zostaną wczytane do typów i pokazane wizualnie na overlayach meczowych — dla każdej drużyny ikona ✓ + godzina check-inu, dla całego meczu wskaźnik gdy obie drużyny już potwierdziły gotowość.

### Zmiany w kodzie

**1. `src/types/studio.ts`** — rozszerzenie typów

```ts
interface TeamData {
  // ...istniejące pola
  checked_in?: boolean;
  checked_in_at?: string | null;
}

interface MatchData {
  // ...istniejące pola
  started_at?: string | null;
  both_teams_checked_in?: boolean;
}
```

Brak breaking changes — wszystkie pola opcjonalne.

**2. `src/components/studio/MatchCard.tsx`** (overlay "Next 3" / "Next match")

Dodać mały badge check-in w `TeamBanner` (obok nazwy drużyny):
- Jeśli `team.checked_in === true` → zielona kropka + ✓ + godzina (`HH:MM`) sformatowana z `checked_in_at`
- Jeśli `false`/brak → szara kropka + napis „Oczekuje"
- Po stronie A wyrównanie do prawej, po stronie B do lewej

Lokalizacja: w komponencie `TeamBanner` jako dodatkowa linia/element pod nazwą drużyny, w stylu spójnym z resztą (font-esports, uppercase, tracking).

**3. `src/components/studio/RecentMatchesTable.tsx`** (zakończone mecze)

Brak zmian — mecz `done` z definicji miał check-in, ta informacja nic nie wnosi.

**4. `src/components/studio/BracketView.tsx`** (drabinka)

Dodać dyskretną kropkę check-in (zielona/szara, 6×6 px) obok nazwy każdej drużyny w karcie meczu drabinkowego — tylko dla meczów w stanie `scheduled` (dla `done` nie pokazywać, bo redundantne).

### Helper formatowania

Dodać małą funkcję `formatCheckInTime(iso: string | null): string` (zwraca `HH:MM` w lokalnej strefie) — bezpośrednio w `MatchCard.tsx` lub w `src/lib/utils.ts`.

### Zakres
3 pliki:
- `src/types/studio.ts` (typy)
- `src/components/studio/MatchCard.tsx` (badge check-in w bannerach drużyn)
- `src/components/studio/BracketView.tsx` (kropka check-in obok nazw drużyn w drabince)

### Efekt wizualny
- Overlay "Next 3": pod nazwą każdej drużyny widać status „✓ 19:42" (zielony) lub „○ Oczekuje" (szary)
- Drabinka: obok nazwy drużyny w meczach zaplanowanych mała zielona/szara kropka pokazująca kto już zrobił check-in
- Wszystko w istniejącej stylistyce (skew, font-esports, tracking)

