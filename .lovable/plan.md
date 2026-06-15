## Krok 1b — auto-przypisanie meczu przy 100% pewności (rev 2)

### 1. Migracja DB

```sql
ALTER TABLE public.broadcast_sessions
  ADD COLUMN IF NOT EXISTS match_auto_apply_enabled boolean NOT NULL DEFAULT true;
```

### 2. Typy — `src/types/broadcast.ts`

Dodać `match_auto_apply_enabled?: boolean` do `BroadcastSession`.

### 3. `src/lib/match-suggestion.ts`

- **Lokalny** `minPlayersForMode(mode?: string): number` (niezależny od `tournament-roster.ts`): `3v3 → 6`, `2v2 → 4`, `1v1 → 2`, default `2`.
- Rozszerzyć `applyMatchFromBracket(..., opts?: { toastTitle?: string })`. Default tytuł: `'Wczytano mecz z MMRivals'`.
- Dodać `countExactMatches(livePlayerNames, match)`: jak `countMatchedPlayers`, ale akceptuje tylko proposals ze `score === 0` (twarde dopasowania).
- Dodać `isFullConfidenceMatch({ suggestions, top, tournamentMode, livePlayerNames })`:
  - `suggestions.length === 1`
  - `top.matchedPlayers === flattenMatchPlayers(top.match).length` (pełny roster z drabinki w lobby)
  - `top.matchedPlayers >= minPlayersForMode(tournamentMode)`
  - `countExactMatches(livePlayerNames, top.match) === top.matchedPlayers` (wszystkie dopasowania exact, żadnego fuzzy)

### 4. `src/components/creator/MmrivalsMatchPicker.tsx`

- Import `Switch` z `@/components/ui/switch`, `isFullConfidenceMatch`.
- W nagłówku karty obok tytułu „MMRivals" mały `Switch` + label **„Auto (100%)"**; `checked = session?.match_auto_apply_enabled !== false`; `onCheckedChange(v) => updateSession({ match_auto_apply_enabled: v })`. „Odepnij" zostaje obok.
- `lastAutoAppliedMatchIdRef = useRef<string | null>(null)`.
- `useEffect` na `[suggestions, debouncedLiveNames, session?.mmr_match_id, session?.match_auto_apply_enabled, tournamentId, tournamentMode]`:
  - guards: brak sesji, toggle OFF, `mmr_match_id` ustawione, brak `tournamentId`, brak sugestii → return.
  - `top = suggestions[0]`; jeśli `!isFullConfidenceMatch({ suggestions, top, tournamentMode, livePlayerNames: debouncedLiveNames })` → jeżeli ref niepusty, wyzeruj (lobby się rozpadło) i return.
  - jeśli `lastAutoAppliedMatchIdRef.current === top.match.match_id` → return.
  - `applyMatchFromBracket(top.match, debouncedLiveNames, session, updateSession, toast, { toastTitle: 'Auto: przypisano mecz' })`.
  - `setSelectedRound(top.match.round_index ?? null)`.
  - `lastAutoAppliedMatchIdRef.current = top.match.match_id`.
- Reset `lastAutoAppliedMatchIdRef`:
  - `useEffect([session?.mmr_match_id])` → gdy `null`, wyzeruj.
  - `useEffect([tournamentId])` → wyzeruj.
- **Badge „Przypisano automatycznie — możesz zmienić ręcznie"**: pokazywany gdy `session?.mmr_match_id` **jest ustawione** ORAZ `lastAutoAppliedMatchIdRef.current === session.mmr_match_id`. Umiejscowienie: pod sekcją „Mecz" (pod dropdown), nad sekcją „Parowanie graczy". Aby ref wymusił re-render, lustrzane `useState<string | null>` (`autoAppliedDisplayId`) aktualizowane razem z refem.

### 5. Pliki nietykane

- `BroadcastControlsPanel.tsx` — toggle jest w pickerze.
- `useSeriesAutoTracker.ts`, `tournament-roster.ts`, `player-matching.ts`, Relay, Studio, RankClash, overlay-data.

### 6. DoD

- 2v2 (4/4 exact w lobby, 1 kandydat) → auto-apply BO + seria z drabinki, bez klika.
- 2 kandydaci LUB choć 1 fuzzy match → tylko sugestie + ręczne „Zastosuj".
- Komentator extra w lobby nie blokuje.
- Toggle OFF → wyłącznie ręcznie.
- „Odepnij" → po spełnieniu warunków znów auto-apply.
- Badge widoczny tylko gdy mecz jest auto-przypisany (`mmr_match_id` ustawione), nigdy w sekcji sugestii.
- TS/lint czysto.
