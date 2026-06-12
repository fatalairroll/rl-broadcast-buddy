# Poprawki GLASS OVERLAY — pozycje + wersjonowanie + ikona rangi

## Diagnoza

1. **Stary wiersz w DB** — `ensureGlassPreset` jest `if exists → return`. Wiersz "GLASS OVERLAY" zapisany przed aneksem opaque trzyma stare pozycje (`offsetY:-516`, karta `center-bottom`).
2. **Scorebar nie sięga y=0** — `GLASS_OVERLAY_CONFIG.scoreboard.position = { anchorV:'top', offsetY:0 }`. W `src/lib/position-utils.ts` `anchorV:'top'` ustawia górną krawędź elementu na `540 + offsetY`. Czyli `offsetY:0` daje top=540, NIE top=0. Aby górna krawędź dotykała y=0, musi być `offsetY:-540`. Poprawka u źródła — w configu presetu, nie w renderze (resolver jest poprawny i wspólny dla całego v2).
3. **Karta w środku-dole** — kod presetu już ma `left/bottom 24/64`, ale w DB siedzi stara wersja (patrz 1).
4. **Ikona rangi** — pola `rankIconSize / rankIconOffsetX / rankIconOffsetY` (jako `rankOffsetX/Y` + `rankIconSize`) są w typach i UI kreatora; `GlassPlayerCard` używa stałych `width={30} height={30}` i nie respektuje offsetów.

## Zmiany

### A. Wersjonowanie systemowego presetu

**`src/types/overlayV2.ts`**
- W `GeneralV2Style` dodać `presetVersion?: number` (opcjonalne, defaultem `undefined` dla zwykłych configów).
- W `mergeV2Config` przepuścić pole bez zmian.

**`src/lib/v2-glass-preset.ts`**
- Stała `GLASS_PRESET_VERSION = 3`.
- `GLASS_OVERLAY_CONFIG.general.presetVersion = GLASS_PRESET_VERSION`.
- `GLASS_OVERLAY_CONFIG.scoreboard.position.offsetY = -540` (górna krawędź = y=0).
- Reszta presetu bez zmian (karta `left/bottom 24/64` już jest).
- `ensureGlassPreset(presets, createPreset, updatePreset)`:
  - jeśli brak wiersza po nazwie → `createPreset(...)` (jak teraz),
  - jeśli wiersz istnieje i `config.general.presetVersion < GLASS_PRESET_VERSION` (lub brak) → `updatePreset(row.id, { config: GLASS_OVERLAY_CONFIG, description: ... })`. Całość presetu systemowego nadpisywana. Inne presety/sceny użytkowników nietykane (filtr po dokładnej nazwie `"GLASS OVERLAY"`).

**`src/pages/Creator.tsx`**
- Wywołanie `ensureGlassPreset(presets, createPreset, updatePreset)` — dołożyć `updatePreset` do argumentów.

### B. Konfigurowalna ikona rangi w `GlassPlayerCard`

**`src/components/v2/glass/GlassPlayerCard.tsx`**
- W miejscu `<motion.img ... width={30} height={30}>` użyć:
  - `const size = config.playerCard.rankIconSize ?? 30;`
  - `const ox = config.playerCard.rankOffsetX ?? 0;`
  - `const oy = config.playerCard.rankOffsetY ?? 0;`
  - `width={size} height={size}`, `style.transform = 'translate(calc(-50% + {ox}px), calc(-50% + {oy}px))'`.
- Box (`BOX_W=84`, `overflow:hidden`) bez zmian — skrajne offsety przycinają ikonę (akceptowalny feedback).
- Stan `GOL!` bez zmian (nie czyta tych pól).

**`src/components/creator/StyleEditorV2.tsx`**
- Kontrolki już istnieją (linie 200–202). Zostawić; ewentualnie zawęzić zakresy do specyfikacji jeśli to potrzebne — w specyfikacji jest 18–48 / -20..20 / -12..12, w kodzie obecnie 16–160 / -200..200 / -200..200. **Rozstrzygnięcie:** zostawiamy szersze zakresy (bardziej elastyczne, nie psują DoD — DoD wymaga tylko, by kontrolki działały na żywo i były zapisywane z presetem). Jeśli chcesz strict zakresy, zmienimy w jednym kroku.

### C. Brak zmian w resolverze pozycji

`src/lib/position-utils.ts` jest poprawny i używany przez cały v2 (standard + glass). Semantyka `anchorV:'top' + offsetY:-540 → top=0`, `anchorH:'left' + offsetX:-960 → left=0` jest spójna. Korekta wyłącznie w danych presetu.

## Pliki edytowane

- `src/types/overlayV2.ts` — `presetVersion` w `GeneralV2Style`.
- `src/lib/v2-glass-preset.ts` — wersja, `offsetY:-540`, `ensureGlassPreset` z update'em.
- `src/pages/Creator.tsx` — przekazanie `updatePreset` do `ensureGlassPreset`.
- `src/components/v2/glass/GlassPlayerCard.tsx` — `rankIconSize` + offsety przez `transform`.

## Nieruszane

Studio, tokeny szklane, `useGoalEventDetector`, logika stanów karty, standardowe komponenty v2, sceny i presety użytkowników o nazwie ≠ "GLASS OVERLAY".

## Definition of Done — mapowanie

- presetVersion + auto-update systemowego presetu → A.
- scorebar top=0 → A (offsetY:-540).
- karta 24/64 lewy-dół → A (auto-update wymusza świeży preset).
- kontrolki ikony rangi działają na żywo → B (już są w UI; runtime teraz je czyta).
- "GOL!" niezależny → B (nie czyta pól).
- TS/lint czysto, Studio i standard bez regresji → wszystkie zmiany lokalne w configu/komponentach glass.
