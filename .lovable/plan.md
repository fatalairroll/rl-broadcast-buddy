## Problem

W `PlayerCardV2.tsx` cała karta gracza (tło, MMR watermark, ranga, zdjęcie, nick, statsy) jest renderowana wewnątrz jednego diva z `overflow: hidden`. Dlatego nawet jeśli ustawisz duży `nickOffsetX/Y` w edytorze, nick zawsze jest "ucinany" przy krawędzi karty — nie da się go wypchnąć poza nią.

Dodatkowo zakresy suwaków `Nick - offset X/Y` (±400 / ±200 px) są za małe, by swobodnie umieścić nick np. nad kartą lub z boku.

## Rozwiązanie

Rozdzielić strukturę PlayerCard na dwie warstwy w jednym wrapperze pozycjonującym:

```text
<wrapper position:absolute (positionToStyle)>
  <card-clip overflow:hidden width/height/skew>   ← tło, MMR watermark, photo, ranga, statsy
  </card-clip>
  <nick-layer position:absolute>                  ← nick + flaga, BEZ overflow:hidden
  </nick-layer>
</wrapper>
```

Dzięki temu nick zachowuje wszystkie obecne ustawienia (font, kolor, skew, offsety, transformOrigin), ale nie jest już przycinany przez clip karty i może być przesuwany dowolnie poza obrys.

### Zmiany w kodzie

**1. `src/components/v2/PlayerCardV2.tsx`**
- Dodać zewnętrzny wrapper o tej samej szerokości/wysokości co karta (bez `overflow`, bez tła).
- Wewnątrz przenieść istniejący `<div className="relative flex items-stretch" overflow:hidden>` jako pierwsze dziecko (zawiera tło, MMR, photo, rank, stats — bez zmian).
- Blok "Nick row" przenieść jako drugie, równorzędne dziecko wrappera (poza clip-boxem). Pozycjonowanie pozostaje takie samo (`left: bodyLeft`, `top: 32%`, ten sam transform z `nickOffsetX/Y` i `skewInner`).
- Animacja `motion.div` (entry/exit) obejmuje cały wrapper, więc nick i karta nadal animują się razem.

**2. `src/components/creator/StyleEditorV2.tsx`**
- Rozszerzyć zakres suwaków nick offset:
  - `Nick - offset X`: min/max `-800/800` (zamiast `-400/400`)
  - `Nick - offset Y`: min/max `-400/400` (zamiast `-200/200`)
- Dodać krótki opis pod sekcją: "Nick może być przesuwany poza kartę".

### Co pozostaje bez zmian

- Wszystkie pozostałe ustawienia karty (rozmiar, skew, padding, MMR, ranga, zdjęcie, statsy).
- `c.nickOffsetX/Y` w typach i w `defaultOverlayV2Config` — istnieją.
- Logika `inheritParentSkew` i `transformOrigin` nicka.
- Statsy nadal są wewnątrz clip-boxa (zgodnie z dotychczasowym zachowaniem). Jeśli w przyszłości chcesz to samo zrobić ze statsami, łatwo zreplikować ten sam wzorzec.

## Pliki do edycji

- `src/components/v2/PlayerCardV2.tsx` — restrukturyzacja JSX (nick poza clip-boxem)
- `src/components/creator/StyleEditorV2.tsx` — szersze zakresy suwaków nick offset