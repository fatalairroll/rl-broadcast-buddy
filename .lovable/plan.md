

# Plan: Studio — Overlay turniejowy z danymi MMRivals

## Podsumowanie

Tworzymy nowy moduł "Studio" z trzema widokami:
- `/studio` — panel konfiguracyjny (wybór turnieju, trybu, generowanie linku OBS)
- `/studio/render` — przezroczysty widok do OBS z animacjami
- Polling edge function co 5s zamiast Realtime (API MMRivals to REST endpoint, nie Supabase Realtime)

## Architektura

```text
/studio (Config Panel)
  ├── Wybór turnieju (GET ?mode=tournaments)
  ├── Wybór trybu (next_match / next_3 / bracket)
  ├── Ilość meczy (1-5, dropdown)
  ├── Podgląd live
  └── Generowanie linku OBS → /studio/render?tournament_id=...&mode=...&key=...

/studio/render?tournament_id=T-XXX&mode=next_match&count=3&key=MY_SECRET
  ├── bg-transparent
  ├── Polling co 5s → overlay-data endpoint
  ├── Framer Motion animacje (slide-in/out)
  └── Karty meczy z MMR, rangami, nickami
```

## Zadania

### 1. Typy i API client (`src/types/studio.ts`, `src/lib/mmrivals-api.ts`)

Zdefiniować typy TypeScript dla odpowiedzi API:
- `Tournament` — id, name, mode, status, start_at, banner_url
- `MatchData` — match_id, round_index, best_of, state, score_a/b, team_a/b
- `TeamData` — team_id, name, avg_mmr, seed, players[]
- `PlayerData` — nick, avatar, mmr_1v1/2v2/3v3, rank_1v1/2v2/3v3

API client: prosty wrapper wokół `fetch()` z obsługą błędów (401, 400, 404, 429).

```typescript
const API_URL = "https://tvmieplfcvgmfcjaxpto.supabase.co/functions/v1/overlay-data";
const API_KEY = "kXS6cVkTpJM2Qti";

export async function fetchTournaments() { ... }
export async function fetchMatches(tournamentId, mode, count?) { ... }
```

### 2. Hook `useStudioData` (`src/hooks/useStudioData.ts`)

- Przyjmuje: `tournamentId`, `mode`, `count`, `enabled`
- Polling co 5 sekund (setInterval + fetch)
- Auto-advance: gdy mecz zmieni `state` na `finished`, automatycznie pobiera kolejny
- Zwraca: `{ tournament, matches, isLoading, error }`

### 3. Strona konfiguracyjna `/studio` (`src/pages/Studio.tsx`)

Panel z:
- **Lista turniejów** — dropdown pobierany z `mode=tournaments`
- **Tryb wyświetlania** — radio/select: Next Match, Next Matches, Bracket
- **Ilość meczy** — dropdown 1-5 (widoczny tylko dla trybu next_match/next_3)
- **Podgląd live** — osadzony iframe z `/studio/render?...`
- **Link OBS** — kopiowany przyciskiem do schowka
- **Weryfikacja ?key=** — pole na klucz streamera do URL

### 4. Widok renderowania `/studio/render` (`src/pages/StudioRender.tsx`)

- Parametry URL: `tournament_id`, `mode`, `count`, `key`
- Walidacja `key` — porównanie z hardcoded wartością (lub pobraną z configu)
- Tło: `bg-transparent` (overlay-transparent class)
- **Polling** co 5s za pomocą `useStudioData`

Tryby wizualne:
- **Next Match**: Karta meczu — nazwy drużyn, loga, gracze z MMR i ikonami rang, avg MMR drużyny, wynik serii (best_of)
- **Next Matches (1-5)**: Lista kart meczy w kolumnie
- **Bracket**: Drabinka turniejowa (siatka rund → mecze)

Animacje (Framer Motion — już zainstalowany):
- `AnimatePresence` + `motion.div` z `initial/animate/exit`
- Slide-in z boku przy nowym meczu, fade-out przy zakończonym

### 5. Komponenty wizualne (`src/components/studio/`)

| Komponent | Opis |
|---|---|
| `MatchCard.tsx` | Karta meczu: drużyny, gracze, MMR, rangi, wynik |
| `PlayerRow.tsx` | Wiersz gracza: avatar, nick, MMR, ikona rangi |
| `BracketView.tsx` | Drabinka turniejowa (siatka rund) |
| `RankIcon.tsx` | Ikona rangi RL (mapowanie nazwy rangi na kolor/emoji) |

Styl: ciemne karty (`bg-slate-900/90`), border glow, rangi RL jako kolorowe badge'e.

### 6. Routing (`src/App.tsx`)

Dodać dwie nowe trasy:
```typescript
<Route path="/studio" element={<Studio />} />
<Route path="/studio/render" element={<StudioRender />} />
```

### 7. Ikony rang Rocket League

Mapowanie nazw rang (np. "Diamond II") na kolory i krótkie etykiety. Bez zewnętrznych assetów — kolorowe badge'e z tekstem.

## Bezpieczeństwo

- Klucz API (`kXS6cVkTpJM2Qti`) zapisany jako stała w `mmrivals-api.ts` (publiczny klucz, widoczny w URL)
- Parametr `?key=` w `/studio/render` — weryfikacja po stronie klienta, żeby losowa osoba nie mogła wyświetlić overlaya bez znajomości klucza

## Pliki do utworzenia/zmiany

| Plik | Akcja |
|---|---|
| `src/types/studio.ts` | Nowy — typy API |
| `src/lib/mmrivals-api.ts` | Nowy — fetch wrapper |
| `src/hooks/useStudioData.ts` | Nowy — polling hook |
| `src/pages/Studio.tsx` | Nowy — config panel |
| `src/pages/StudioRender.tsx` | Nowy — render view |
| `src/components/studio/MatchCard.tsx` | Nowy |
| `src/components/studio/PlayerRow.tsx` | Nowy |
| `src/components/studio/BracketView.tsx` | Nowy |
| `src/components/studio/RankIcon.tsx` | Nowy |
| `src/App.tsx` | Zmiana — dodanie 2 tras |

