# Scorebar — szersze paski nazw + wyrównanie do zegara

## 1. coverWidth 620 → 736

Środkowe segmenty (`SCORE_W=58` + `TIMER_W=116` + `SCORE_W=58` = 232 px) bez zmian. Paski nazw rosną z 194 → 252 px (+30%). Nowy `coverWidth = 252·2 + 232 = 736`.

**`src/types/overlayV2.ts`:**
- Default `scoreboard` (linia ~310) — dodać `coverWidth: 736, coverHeight: 104`.
- `mergeV2Config` (linia 542) — fallback `?? 620` → `?? 736`.

**`src/lib/v2-glass-preset.ts`:**
- `GLASS_OVERLAY_CONFIG.scoreboard.coverWidth`: `620` → `736`.
- `GLASS_PRESET_VERSION`: `5` → `6` (wymusza nadpisanie wiersza systemowego w DB).

Rząd 2 w `GlassScorebar` już używa `totalW` z configu — żaden 620 nie jest zahardkodowany poza wymienionymi miejscami (zweryfikowano: `rg coverWidth|620` → tylko 3 wystąpienia w tych plikach). `nameW` liczy się automatycznie z `(totalW - SCORE_W*2 - TIMER_W)/2 = 252`.

## 2. Mniejsza typografia nazw + gwarancja 25 znaków

**`src/components/v2/glass/GlassScorebar.tsx`:**

Wyliczyć deterministycznie rozmiar dla każdej nazwy osobno:

```ts
const fitFontSize = (n: string) =>
  n.length <= 14 ? 21 : n.length <= 20 ? 19 : 17;
const blueFs = fitFontSize(blueName || 'BLUE');
const orangeFs = fitFontSize(orangeName || 'ORANGE');
```

W obu kafelkach nazw zastąpić `fontSize: 27` → `fontSize: blueFs` / `orangeFs`. Reszta stylu (`glassName`, wagi, italic) bez zmian. `overflow: hidden`, `textOverflow: 'ellipsis'`, `whiteSpace: nowrap` (dodać `whiteSpace` — obecnie polega na inline; jawne ustawienie to twardy bezpiecznik).

## 3. Wyrównanie nazw do zegara

W `GlassScorebar.tsx`:

- **Blue (lewy):** `justifyContent: 'flex-end'`, `padding: '0 14px 0 16px'`.
- **Orange (prawy):** `justifyContent: 'flex-start'`, `padding: '0 16px 0 14px'`.

`opaqueCornerSpec` na zewnętrznych narożnikach bez zmian (już lustrzany w istniejącym kodzie).

## Czego nie ruszam

`SCORE_W`, `TIMER_W`, typografia wyników/zegara, chamfery, materiały (`opaqueBarBlue/Orange/Dark`), `fakeRefraction*`, sweep, rząd 2 (układ wewnętrzny), `boostGauge`, `GlassPlayerCard`, sceny użytkowników, kontrolki kreatora.

## Pliki

- `src/types/overlayV2.ts`
- `src/lib/v2-glass-preset.ts`
- `src/components/v2/glass/GlassScorebar.tsx`

## DoD

- Domyślny `coverWidth = 736` (default + preset); rząd 2 na pełną szerokość; brak zahardkodowanego 620.
- Nazwa 25-znakowa wpada bez ucięcia (17 px); >25 znaków → ellipsis, layout stabilny.
- Blue dosunięty do prawej krawędzi paska, orange do lewej — obie nazwy "ciążą" ku zegarowi.
- `GLASS_PRESET_VERSION = 6`; `ensureGlassPreset` nadpisze wiersz przy najbliższym wejściu w `/creator`.
- TS/lint czysto; reszta presetu i Studio bez regresji.
