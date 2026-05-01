## Część 1 — Rozmiar ikony rangi nie wpływa na układ karty gracza

### Problem
W `PlayerCardV2` ikona rangi siedzi w głównym flex-column (między linią z nickiem a rzędem statystyk). Zwiększanie `rankIconSize` przesuwa statystyki w dół i zmienia wysokość treści.

### Rozwiązanie
Wyciągnąć ikonę rangi z toku układu — renderować ją jako element `position: absolute` wewnątrz karty, jako rodzeństwo bloku `body`. Suwaki `rankIconSize`, `rankOffsetX`, `rankOffsetY` operują tylko na samej ikonie, bez dotykania nicka i statystyk.

### Zmiany w `src/components/v2/PlayerCardV2.tsx`
1. Usunąć blok renderujący `c.fields.rank` z wnętrza `<div className="flex-1 flex flex-col ...">`.
2. Dodać go jako rodzeństwo bloku body, jako `absolute`, kontr-skewowany, by stał prosto:

```tsx
{rankIconSrc && c.fields.rank && (
  <div
    className="absolute pointer-events-none"
    style={{
      left: (c.fields.photo && registry?.photo_url ? c.photoWidth : 0) + 24,
      top: '50%',
      transform: `translateY(-50%) translate(${c.rankOffsetX ?? 0}px, ${c.rankOffsetY ?? 0}px) skewX(${-c.skewDeg}deg)`,
      transformOrigin: 'left center',
    }}
  >
    <img src={rankIconSrc} width={c.rankIconSize} height={c.rankIconSize}
         className="object-contain drop-shadow-lg" draggable={false} />
  </div>
)}
```

### Wynik
Skala ikony 16–160 px nie zmienia pozycji nicka ani statystyk; offset X/Y porusza wyłącznie ikoną.

---

## Część 2 — Ikona rangi nie pojawia się dla rzeczywistych graczy (live)

### Diagnoza (potwierdzona z bazy)
- W trybie **mock** każdy gracz w `MOCK_REGISTRY` ma ustawione `rank_name` (np. „Diamond II"), więc `registry.rank_name` → `getRankIcon` zwraca obrazek.
- W trybie **live** tabela `players_registry` jest **pusta** (sprawdzone: 0 wierszy), więc `activeRegistry` to `null`. Jedynym źródłem rangi pozostaje `mmrOverride` — a ten działa wyłącznie, gdy:
  1. w `broadcast_sessions` ustawiony jest aktywny `mmr_match_id`,
  2. aktywny gracz (z `active_camera.target_name`) ma rekord w `session.player_pairings`,
  3. po stronie MMRivals roster zawiera gracza z `discord_id`, MMR/rangą.

Jeśli któryś warunek nie jest spełniony (np. mecz MMRivals nie został wczytany w panelu, albo gracz nie został sparowany ręcznie), `mmrOverride` jest `null`, `registry` nie ma `rank_name` — ikona w ogóle się nie renderuje.

Dodatkowo `players_live` zawiera kolumnę `mmr` (przesyłaną przez bota Pythonowego), ale `PlayerCardV2` nigdy z niej nie korzysta jako fallback do wyznaczenia rangi.

### Rozwiązanie — fallback łańcuchowy

W `PlayerCardV2.tsx` policzyć efektywne MMR/rangę raz, na początku komponentu, w kolejności:

```ts
const effectiveMmr =
  mmrOverride?.mmr ??
  registry?.mmr ??
  player?.mmr ??
  null;

const effectiveRank =
  mmrOverride?.rank ??
  registry?.rank_name ??
  (effectiveMmr != null ? getRankFromMmr(effectiveMmr) : null);

const rankIconSrc = effectiveRank ? getRankIcon(effectiveRank) : null;
```

I używać:
- `effectiveMmr` we wzorcu watermarka MMR (zamiast obecnej drabinki `mmrOverride?.mmr ?? registry?.mmr ?? player.mmr ?? ''`),
- `rankIconSrc` w nowym, absolutnie pozycjonowanym bloku ikony rangi (Część 1).

### Efekt
- **Mock** działa jak dotąd (pierwszeństwo `registry.rank_name`).
- **Live z MMRivals + pairings**: pierwszeństwo `mmrOverride` (dokładna ranga z trybu drużynowego).
- **Live bez MMRivals/pairings**: ikona wyznaczana z `players_live.mmr` (które bot już wpisuje) → ikona rangi pojawia się dla każdego rzeczywistego gracza, dla którego znamy MMR.
- Gdy MMR jest też puste — ikona schowana (bez błędu).

### Pliki do edycji
- `src/components/v2/PlayerCardV2.tsx` — obie zmiany razem (refaktor renderu rangi + import `getRankFromMmr` z `@/lib/rank-utils`).

Bez zmian w typach, schemacie konfiguracji ani w innych komponentach.