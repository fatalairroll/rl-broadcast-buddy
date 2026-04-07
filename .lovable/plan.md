

# Plan: Panel sterowania overlay'em w przeglądarce

## Cel

Dodać pionowy pasek przycisków (w stylu z referencji) bezpośrednio na stronie `/studio/render`, widoczny tylko w przeglądarce. Dzięki temu jeden link OBS obsługuje wszystkie tryby — przełączanie odbywa się z poziomu przeglądarki na komputerze streamera.

## Kluczowa idea

Przyciski są widoczne w przeglądarce, ale **ukryte w OBS**. OBS Browser Source nie obsługuje interakcji — przyciski będą widoczne tylko gdy strona jest otwarta w normalnej przeglądarce. Można to osiągnąć dwojako:
- Przycisk "Ukryj panel" chowający sidebar (domyślnie widoczny)
- Lub: panel zawsze widoczny, ale pozycjonowany poza obszarem overlay'a (np. z lewej krawędzi)

**Rekomendacja:** Panel domyślnie widoczny z lewej strony ekranu z przyciskiem toggle do chowania. W OBS streamer otwiera stronę w przeglądarce (nie w OBS), przełącza tryb — state jest współdzielony przez URL/state.

**Lepsze podejście:** `mode` staje się stanem wewnętrznym komponentu (`useState`) zamiast parametru URL. Początkowa wartość pochodzi z URL, ale potem zmienia się przyciskami. Dzięki temu jeden link OBS = jeden Browser Source, a streamer steruje z przeglądarki... 

Hmm, ale OBS Browser Source to osobna instancja — nie współdzieli stanu z przeglądarką. Trzeba inny mechanizm.

**Rozwiązanie:** Użyć `BroadcastChannel` API — przeglądarka i OBS Browser Source na tej samej domenie współdzielą kanał. Streamer otwiera ten sam URL w przeglądarce, klika przyciski, a OBS Browser Source nasłuchuje na `BroadcastChannel` i zmienia tryb.

**Problem:** OBS Browser Source to Chromium, ale izolowany — `BroadcastChannel` nie działa między OBS a normalną przeglądarką.

**Najlepsze rozwiązanie:** Panel przycisków jest częścią overlay'a — widoczny na stronie renderowej. W OBS streamer może z nim nie interagować, ale może otworzyć tę samą stronę w przeglądarce i użyć mechanizmu synchronizacji (np. przez Supabase Realtime lub localStorage polling). Ale to komplikuje.

**Najprostsze rozwiązanie:** Przyciski są na stronie `/studio/render`, po lewej stronie. Streamer dodaje do OBS **ten sam URL** jako Browser Source. Osobno otwiera ten URL w przeglądarce. Synchronizacja trybu między nimi odbywa się przez **Supabase Realtime** — klik w przeglądarce zapisuje nowy tryb do tabeli/kanału, OBS Browser Source nasłuchuje i się przełącza.

**Jeszcze prostsze:** Skoro streamer ma już `/studio` (panel konfiguracyjny) — wystarczy że z `/studio` wysyła komendy do `/studio/render` (OBS). Ale to wymaga kanału komunikacji.

**Najprostsze pragmatyczne:** Przyciski renderują się bezpośrednio na overlay'u. W OBS nie przeszkadzają bo streamer może je schować (toggle). Ale interakcja w OBS jest ograniczona... Streamer może klikać w OBS Browser Source jeśli włączy "Interact" w OBS!

**Finalne podejście:** Dodać sidebar z przyciskami na `/studio/render`. Streamer w OBS używa "Interact" do klikania. Mode staje się stanem wewnętrznym. Sidebar jest chowany przyciskiem toggle.

## Zmiany

### 1. Usunięcie trybu `next_match`

- `StudioMode` → `'next_3' | 'bracket' | 'recent'`
- Domyślny tryb: `next_3`
- Usunąć `next_match` z selektorów w `Studio.tsx`

### 2. `StudioRender.tsx` — mode jako stan wewnętrzny + sidebar

- `mode` inicjalizowany z URL params, ale potem zarządzany przez `useState`
- Dodać stan `sidebarOpen` (domyślnie `true`)
- Sidebar z lewej strony: 3 przyciski pionowo (jak na referencji)
  - **Następne mecze** → `next_3`
  - **Drabinka** → `bracket`
  - **Zakończone mecze** → `recent`
- Aktywny przycisk podświetlony (jasnoniebieski, jak na screenie)
- Przycisk toggle (strzałka) do chowania/pokazywania panelu
- Styl: ciemne tło, zaokrąglone rogi po prawej, przezroczysty gdy schowany

### 3. `Studio.tsx` — uproszczenie

- Usunąć opcję `next_match` z selecta
- URL generowany bez `mode` (lub z domyślnym `next_3`) — mode sterowany z overlay'a

### 4. Wizualny styl sidebara (na podstawie screena)

```text
┌──────────────┐
│   NASTĘPNE   │  ← aktywny: jasnoniebieski bg
│    MECZE     │
├──────────────┤
│   DRABINKA   │  ← nieaktywny: ciemny bg
├──────────────┤
│  ZAKOŃCZONE  │
│    MECZE     │
└──────────────┤
         [◀]   │  ← toggle button
```

- Szerokość: ~180px
- Pozycja: fixed, lewa krawędź, wycentrowany pionowo
- Font: uppercase, bold, mały rozmiar
- Animacja slide in/out

## Pliki

| Plik | Zmiana |
|------|--------|
| `src/types/studio.ts` | Usunąć `'next_match'` z `StudioMode` |
| `src/pages/StudioRender.tsx` | Mode jako stan, sidebar z 3 przyciskami, toggle |
| `src/pages/Studio.tsx` | Usunąć opcję next_match, uprościć |
| `src/hooks/useStudioData.ts` | Dostosować logikę do braku `next_match` |

