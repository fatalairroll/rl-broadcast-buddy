
# Naprawa bazowego layoutu Scoreboardu i Boost Barów

Cztery niezależne problemy wynikające z aktualnych defaultów i braków w edytorze. Wszystkie są naprawialne bez zmian schemy.

---

## 1. Szpara między Wynikiem Niebieskich a Timerem

**Przyczyna:** W `defaultOverlayV2Config.scoreboard.gap = 8`. W `ScoreboardV2` blue tile siedzi na `right: halfCenter` a timer wyśrodkowany na anchor → odstęp = `sb.gap`. Ponieważ blue i timer mają identyczny skew (-15°), ich krawędzie są równoległe — przy `gap = 0` stykają się idealnie, a `8` tworzy widoczną pionową szparę.

**Fix:**
- W `src/types/overlayV2.ts`: `defaultOverlayV2Config.scoreboard.gap` → `0`.
- Zostawić suwak „Odstęp między kafelkami" 0–64 px w `StyleEditorV2.tsx` (już istnieje), żeby użytkownik mógł świadomie dodać prześwit.
- W `mergeV2Config` nie wymuszać 8 — gdy zapisany overlay ma gap 8, zostaje (kompatybilność).

## 2. Timer nie wycentrowany w swoim boxie

**Przyczyna:** W `ScoreboardV2.tsx` zewnętrzny div timera ma `flex flex-col items-center justify-center`, a wewnętrzny wrapper z counter-skew ma `flex flex-col items-center` bez `justify-center`. Wewnętrzny wrapper przyjmuje wysokość zawartości (np. 60px), więc samo `<span>` renderuje się od góry tego wrappera, a baseline fontu Rajdhani z dużym ascenderem wizualnie przesuwa cyfrę w górę. Dodatkowo brak `lineHeight: 1` powoduje, że line-height fontu (≈1.2) dokłada padding nad i pod tekstem.

**Fix w `ScoreboardV2.tsx`:**
- Wewnętrzny wrapper counter-skew: dorzucić `justify-content: center` i `height: 100%`, żeby dziedziczył pełną wysokość zewnętrznego boxa i centrował zawartość.
- Span z czasem: dodać `lineHeight: 1` i `display: 'block'` — eliminuje ekstra spacing line-height fontu.

## 3. Brak suwaków X/Y dla Wyniku Niebieskich i Pomarańczowych

**Przyczyna:** Score tile'e są pozycjonowane relatywnie do anchor scoreboardu (`right: halfCenter` / `left: halfCenter`). Nie mają własnych offsetów. Użytkownik nie może np. lekko przesunąć samego niebieskiego wyniku w lewo, żeby zwiększyć dystans od timera asymetrycznie.

**Fix:**
- W `src/types/overlayV2.ts` w `ScoreSideStyle`: dodać `offsetX: number` i `offsetY: number` (default `0`), backfill w `mergeV2Config`.
- W `ScoreboardV2.tsx`: w div'ach pozycjonujących blue/orange tile dorzucić `transform: translate(${offsetX}px, ${offsetY}px)` (osobny wrapper, żeby nie kolidować ze skewem na samym kafelku).
- W `StyleEditorV2.tsx` → `ScoreSideEditor`: dodać sekcję „Pozycja (Fine-tune)" z dwoma `SliderInput` (Offset X: -200..200, Offset Y: -100..100, jednostka px).

## 4. Paski boost graczy się nie wyświetlają

**Przyczyna:** Suma elementów wewnątrz `BoostBarV2` przekracza `cardHeight=64`:
- `paddingY*2 = 16` + nick row (~22px line-height) + bar (8px) + stats (~14px line-height) + 2× `gap-1` (8px) ≈ **68 px** > 64.
- Kontener ma `overflow:hidden` i `flex flex-col` bez `min-height:0` → bar lub stats są przycinane / wypychane poza box i znikają.

**Fix w `BoostBarV2.tsx`:**
- Dodać `lineHeight: 1` na `<span>` nick i row stats, żeby zlikwidować ekstra spacing.
- Pierwszą i trzecią sekcję (nick row, stats row) opakować w `style={{ flex: '0 0 auto' }}`, środkowy bar pozostawić jako `flex-shrink:0`.
- Bar container: dodać `flex: '0 0 auto'` i `width: '100%'`, żeby motion.div miał z czego procentować. Aktualnie `<div className="relative bg-white/10 overflow-hidden">` bez explicit width — w rtl context może mieć szerokość 0 jeżeli flex-direction column collapse'uje. Wymuszamy `width: '100%'`.
- Podnieść default `cardHeight` z 64 → 72 px w `defaultOverlayV2Config.boostBar`, żeby standardowe fonty mieściły się bez clippingu.
- Default `gap` w boostBar (vertical between cards) zostaje 12, ale dodać też wewnętrzny `flex-direction:column` `gap: 4` jako stałą (zastąpi `gap-1` Tailwinda) — daje kontrolę.

---

## Pliki do edycji

```text
src/types/overlayV2.ts             defaults: scoreboard.gap=0, boostBar.cardHeight=72;
                                   ScoreSideStyle += offsetX/offsetY; mergeV2Config backfill
src/components/v2/ScoreboardV2.tsx counter-skew wrapper: justify-center + height:100%;
                                   timer span: lineHeight:1, display:block;
                                   blue/orange tile wrapper: translate(offsetX, offsetY)
src/components/v2/BoostBarV2.tsx   lineHeight:1 na nick/stats; flex 0 0 auto;
                                   bar container width:100%; min-height:0
src/components/creator/StyleEditorV2.tsx
                                   ScoreSideEditor: dodać sekcję „Pozycja (Fine-tune)"
                                   z SliderInput Offset X / Y
```

Bez zmian w bazie / RLS / edge functions. Backwards-compat zapewniony przez `mergeV2Config` (nowe pola `?? 0`).
