

## Plan: Przycisk "Przerzuć drużyny" w sekcji Kontrola meczu

### Co zostanie dodane
Nowy przycisk w `MatchControls` (sekcja "Kontrola meczu" na dashboardzie), który zamienia miejscami wszystkie dane drużyny A i drużyny B w sesji.

### Działanie
Po kliknięciu wywołuje `onUpdate` z zamienionymi polami:
- `team_a_name` ↔ `team_b_name`
- `team_a_color` ↔ `team_b_color`
- `team_a_logo` ↔ `team_b_logo`
- `team_a_id` ↔ `team_b_id`
- `team_a_series_score` ↔ `team_b_series_score`
- `team_a_game_score` ↔ `team_b_game_score`

### Zmiana techniczna

**Plik: `src/components/dashboard/MatchControls.tsx`**

- Import `ArrowLeftRight` z lucide-react
- Nowy przycisk w sekcji "Action Buttons" (obok Reset gry i Aktualizuj overlay):
```tsx
<Button variant="outline" size="sm" onClick={handleSwapTeams}>
  <ArrowLeftRight className="mr-2 h-4 w-4" />
  Przerzuć drużyny
</Button>
```
- Funkcja `handleSwapTeams` wywołuje `onUpdate` z zamienionymi wartościami wszystkich pól A↔B

### Zakres
- 1 plik: `src/components/dashboard/MatchControls.tsx`

