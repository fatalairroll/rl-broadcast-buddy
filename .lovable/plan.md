# FAZA 5 — Dorównanie kreatora do funkcji dashboardu

Cel: po tej fazie `/creator` pokrywa 100% funkcji `/dashboard`. Dashboard zostaje nietknięty i działa równolegle.

## Uwagi do dwóch sygnałów

1. **Przycisk „Overlay" w nagłówku kreatora zostaje.** W przeciwieństwie do dashboardu (gdzie był redundantny i usunięto go w Fazie 1), w kreatorze otwiera `/v2/overlay` w nowej karcie — jest to praktyczne źródło URL-a do wklejenia w OBS. Inna rola, zostawiamy. Nowe akcje (`RelayStatus`, link `Relay`) dokładamy obok niego w prawym pasku.

2. **`createSession` — domyślna nazwa „Nowa transmisja" tylko jako fallback.** Skoro pole nazwy sesji i tak dodajemy w panelu (2b), przycisk „Utwórz nową transmisję" przyjmuje lokalny stan nazwy z input-a obok („Nazwa nowej transmisji", placeholder „np. Finał – RLCS"). Jeśli pole puste → fallback `'Nowa transmisja'`. Po sukcesie czyścimy lokalny input. Brak dodatkowego kroku „utworzyłem → teraz zmień nazwę".

## Zmiany w plikach

### 1. `src/pages/Creator.tsx` — nagłówek
- Dodać `<RelayStatus />` w prawym pasku akcji (po lewej od `Tabs` Mock/Live lub przed `Overlay`), import z `@/components/dashboard/RelayStatus`.
- Dodać przycisk `Relay` (ikona `Settings`) obok przycisku `Overlay` → `navigate('/relay')`.
- Przycisk `Overlay` zostaje (vide uwaga 1). Reszta layoutu bez zmian. Przycisk powrotu `Dashboard` także zostaje (wygaszanie to inna faza).

### 2. `src/components/creator/BroadcastControlsPanel.tsx` — rozbudowa
Wszystkie operacje przez istniejący `useBroadcast` (`updateSession`, `createSession`, `resetGameScore`). Ręczne pola nazw zostają.

a) **Brak sesji** — zastąpić obecny komunikat „Utwórz w Dashboardzie" mini-formularzem:
```
<Input value={newSessionName} onChange=... placeholder="np. Finał – RLCS" />
<Button onClick={handleCreate}><Plus/> Utwórz nową transmisję</Button>
```
gdzie:
```
const handleCreate = async () => {
  const name = newSessionName.trim() || 'Nowa transmisja';
  const { error } = await createSession(name);
  if (error) toast({ variant:'destructive', title:'Błąd', description: error.message });
  else { toast({ title:'Utworzono sesję' }); setNewSessionName(''); }
};
```
Wymaga wyciągnięcia `createSession` i `resetGameScore` z `useBroadcast()` w komponencie.

b) **Nazwa sesji/rundy** — nowe pole na górze pierwszej karty (przed nazwami drużyn), wzorzec lokalnego mirrora identyczny jak dla `nameA/nameB` (zapis na `onBlur` → `updateSession({ name })`). Placeholder „np. Finał – RLCS".

c) **Kolor i logo drużyn** — pod każdym `Input` nazwy dodać:
  - Color picker (port wzorca z `TeamEditor.tsx:78-124`: `Popover` + `colorPresets` + `Input type="color"` + hex input). Wywołuje `updateSession({ team_a_color | team_b_color })`. Stała `colorPresets` lokalnie w pliku panelu.
  - Pole `Input` URL logo (port z `TeamEditor.tsx:126-149`) z miniaturką po prawej, `onBlur` → `updateSession({ team_a_logo | team_b_logo })`. Lokalny mirror w `useState` analogicznie do nazw.

d) **Reset wyniku gry** — w grupie przycisków akcji dodać przycisk „Reset gry (0:0)" wywołujący `resetGameScore` (z `useBroadcast`), z `confirm` opcjonalnym.

e) **`clearManualData`** — zostawiamy bez zmian (nie czyści koloru ani logo świadomie; logo czyścimy pustym inputem → blur → `null`).

### 3. Brak innych zmian
- `useBroadcast`, `BroadcastSession`, schema, `useTeams`, pola `team_a_id`/`team_b_id` — nietknięte.
- Dashboard (`src/pages/Dashboard.tsx`, `src/components/dashboard/*`) — nietknięty.
- `RelayStatus` — osadzony, nie przepisywany.
- GLASS OVERLAY, `OverlayV2`, `useSeriesAutoTracker`, `applyMatchFromBracket` — bez zmian.
- Redirecty Auth/`App.tsx` do `/dashboard` — nietknięte (osobna faza wygaszenia).

## Definition of Done

- [ ] Z `/creator` można utworzyć sesję (z nazwą z pola lub fallback) bez wchodzenia w `/dashboard`.
- [ ] Kolor drużyn, URL logo, reset gry, nazwa sesji — działają w kreatorze.
- [ ] `RelayStatus` widoczny w nagłówku kreatora; przycisk `Relay` prowadzi do `/relay`; `Overlay` zachowany.
- [ ] Ręczne nazwy drużyn nadal działają.
- [ ] `useTeams` i `team_a/b_id` bez zmian (grep potwierdza).
- [ ] Dashboard w pełni działa równolegle.
- [ ] E2E: utwórz sesję w kreatorze → ustaw drużyny/kolory/logo/serię → `/v2/overlay` pokazuje poprawne dane.
- [ ] GLASS OVERLAY niezmieniony, TS/lint czysto.
