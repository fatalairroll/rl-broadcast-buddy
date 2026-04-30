## Problem

Po wczorajszej zmianie semantyki `positionToStyle` (offsetX/Y są teraz względem środka ekranu, nie krawędzi), **wszystkie presety zapisane wcześniej w bazie** zawierają wartości z poprzedniego układu (offset od krawędzi). Skutek:

- **Kreator** wygląda OK, dopóki używasz świeżych defaultów.
- **/v2/overlay i OBS** ładują z DB stare wartości – scoreboard ląduje na środku ekranu zamiast u góry, paski boosta zlepiają się w środku zamiast po bokach, karta gracza spada do środka.

Konkretnie preset **Default V2** (is_default=true) zawiera m.in.:
- `scoreboard.position.offsetY = 24` (nowo: 24px **poniżej** środka; powinno: -516, czyli 24px od góry ekranu)
- `boostBar.positionLeft.offsetX = 32` (nowo: 32px na prawo od środka; powinno: -928, czyli 32px od lewej krawędzi)
- `boostBar.positionRight.offsetX = 95` (powinno: 928)
- `playerCard.position.offsetY = -1` (powinno: 480, czyli 60px od dołu ekranu)
- `seriesScore.position = NULL` (brak; defaulta podstawia merge)

## Rozwiązanie

Migracja SQL przeliczająca `position` we wszystkich istniejących wierszach `overlay_presets_v2` ze starego układu (offset = piksele od krawędzi wskazanej przez anchor) do nowego (offset = piksele od środka ekranu, z anchorem decydującym, który punkt elementu jest tam glued).

### Reguły konwersji

Stage = 1920×1080. Dla każdej pozycji `{anchorH, anchorV, offsetX, offsetY}`:

```text
Horizontal:
  anchorH = left   →  newOffsetX = offsetX_old - 960
  anchorH = right  →  newOffsetX = 960 - offsetX_old
  anchorH = center →  newOffsetX = offsetX_old             (bez zmian)

Vertical:
  anchorV = top    →  newOffsetY = offsetY_old - 540
  anchorV = bottom →  newOffsetY = 540 - offsetY_old
  anchorV = middle →  newOffsetY = offsetY_old             (bez zmian)
```

Zastosować do `config.scoreboard.position`, `config.timer.position`, `config.boostBar.positionLeft`, `config.boostBar.positionRight`, `config.playerCard.position`, `config.seriesScore.position` (jeśli istnieje).

### Idempotencja

Migracja musi działać dokładnie raz. Dodajemy flagę markera w `config._coordsV2 = true` i pomijamy wiersze, które ją już mają. Bezpieczne na ponowne uruchomienie.

### Backup

Przed UPDATE robimy `CREATE TABLE overlay_presets_v2_backup_20260430 AS SELECT * FROM overlay_presets_v2;` żeby można było cofnąć.

### Edge case: brak `seriesScore.position`

Stare presety mają `seriesScore = NULL` lub bez klucza `position`. Dla nich nic nie robimy – `mergeV2Config` w runtime'ie podstawi default w nowym układzie (już poprawny: `{center, top, 0, -440}`).

## Zakres zmian

- **Jedna migracja SQL** w `supabase/migrations/...` z funkcją `jsonb` przeliczającą i UPDATE-em wszystkich wierszy bez markera.
- Brak zmian w kodzie front-endu – logika `position-utils.ts` i `mergeV2Config` jest już poprawna.

## Po migracji

Sprawdzimy w preview `/v2/overlay`, że:
- Scoreboard jest u góry-środka ekranu.
- Paski boosta są przy lewej i prawej krawędzi, wyśrodkowane pionowo.
- Karta aktywnego gracza siedzi u dołu-środka.
- Wynik serii (BO) jest tuż pod scoreboardem.

Jeśli któryś preset (np. „Test skala") był ręcznie ustawiany **już w nowym układzie**, jego wartości też zostaną przeliczone (potencjalnie psując go). Strategia: bo do tej pory nikt nie wiedział że układ się zmienił, traktujemy **wszystkie** presety bez markera `_coordsV2` jako stare. Jeśli „Test skala" był zapisany po zmianie semantyki – użytkownik poprawi go ręcznie w kreatorze (jeden klik „Reset" + ustawienie pozycji). Ten preset nie jest defaultem, więc nie wpływa na overlay/OBS.
