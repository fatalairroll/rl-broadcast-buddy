

# Plan: Integracja Twitch Poll z kolejką meczów

## Przegląd

Dodanie funkcjonalności tworzenia ankiety na Twitchu na podstawie aktualnej kolejki meczów, z wyświetlaniem wyników głosowania w overlayuu obok nazw drużyn niebieskich.

## Architektura

```text
StudioRender (sidebar)          Edge Function              Twitch API
  [Rozpocznij ankietę] ──────> /twitch-poll (POST) ──────> POST /helix/polls
                                                            
  Poll results (poll)  <────── /twitch-poll (GET)  <────── GET /helix/polls
```

## Zmiany

### 1. Sekrety — zapisanie Twitch credentials
Zapisać jako sekrety edge function:
- `TWITCH_CLIENT_ID` = `cxtcg4pkkejc9c4eodf0htj6alz27y`
- `TWITCH_OAUTH_TOKEN` = `gdt1gl3ufc1ktz4qvqe5kaqbbnno0f`
- `TWITCH_BROADCASTER_ID` = `857517052`

### 2. Edge Function `supabase/functions/twitch-poll/index.ts`

**POST** — tworzy ankietę:
- Przyjmuje `{ matches: Array<{round_index, match_index}>, duration?: number }`
- Buduje pytanie: `"Który mecz chcesz obejrzeć na streamie?"`
- Opcje: `"Runda X Mecz Y"` dla każdego meczu
- Wywołuje `POST https://api.twitch.tv/helix/polls` z headerami `Client-Id` i `Authorization: Bearer`
- Zwraca `poll_id`

**GET** `?poll_id=xxx` — pobiera wyniki ankiety:
- Wywołuje `GET https://api.twitch.tv/helix/polls?broadcaster_id=...&id=...`
- Zwraca listę choices z `votes` i obliczonym `percentage`

### 3. `src/pages/StudioRender.tsx` — przycisk + stan ankiety

- Dodać stan: `activePollId`, `pollResults` (mapa match_index → percentage)
- W sidebarze: po najechaniu na przycisk "Następne mecze" wysuwa się dodatkowy przycisk "Rozpocznij ankietę" (BarChart3 icon)
- Po kliknięciu: wywołuje edge function POST z listą meczów z kolejki
- Po aktywacji: polluje GET co 5s, aktualizuje `pollResults`
- Przekazuje `pollResults` do `MatchCard` jako prop

### 4. `src/components/studio/MatchCard.tsx` — wyświetlanie wyników

- `MatchCard` przyjmuje nowy prop `pollResults?: Record<string, number>` (klucz: `"R{round}_M{match}"`, wartość: procent)
- W `TeamBanner` strony A (niebieskiej): po lewej stronie nazwy drużyny dodać ikonę `BarChart3` + wartość `XX%`
- Ikona i procent wyświetlane tylko gdy `pollResults` zawiera dane dla danego meczu
- Styl: biały tekst, mała czcionka, ikona 14px, lekki glow niebieski

- `UpcomingQueueRow` analogicznie: po lewej stronie nazwy team A dodać `XX%` gdy wyniki istnieją

### 5. Typy — `src/types/studio.ts`
- Dodać `PollResults = Record<string, number>` (klucz format `"R{round}_M{match}"`)

## Szczegóły techniczne

- Edge function używa `verify_jwt = false` (publiczny endpoint)
- Twitch API wymaga `Client-Id` header + `Authorization: Bearer <token>`
- Ankieta domyślnie 120 sekund
- Polling wyników co 5s, zatrzymuje się gdy status ankiety = `TERMINATED` lub `ARCHIVED`

