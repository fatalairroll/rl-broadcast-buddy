## Cel

Rozszerzyć zakres suwaków „Padding Y" tak, aby można było mocniej zmniejszyć wysokość kafelków w scoreboardzie (wynik niebieskich, wynik pomarańczowych, timer). Kontener scoreboardu nie ma własnego `paddingY` — ma tylko `gap` i odstępy dziedziczy z kafelków, więc to właśnie te trzy suwaki sterują "kompresją" całego paska wyniku.

## Zmiany

Plik: `src/components/creator/StyleEditorV2.tsx`

1. **Timer — Padding Y** (linia 69)
   - obecnie: `min={0} max={60}`
   - po zmianie: `min={-30} max={60}` (ujemne wartości pozwalają wciągnąć kafelek w siebie i uzyskać niższy timer niż naturalna wysokość fontu)

2. **Wynik niebieskich / pomarańczowych — Padding Y** (linia 237, wspólny `ScoreSideEditor`)
   - obecnie: `min={0} max={60}`
   - po zmianie: `min={-30} max={60}`

Dla spójności rozszerzymy też `Padding X` do `min={-30}` przy okazji? — **nie**, użytkownik prosił tylko o Y, więc X zostawiam.

## Uwaga techniczna

CSS `padding` z wartością ujemną nie jest obsługiwane przez przeglądarkę — zostanie zclampowane do 0. Żeby ujemne wartości faktycznie zmniejszały kafelek, w renderze trzeba je zmapować na ujemny `marginTop`/`marginBottom` (lub `padding: max(0, v)` + `margin: min(0, v)`).

Plik: `src/components/v2/ScoreboardV2.tsx`

- Dla bloków „Blue", „Orange" i „Timer" zamiast:
  ```
  padding: `${paddingY}px ${paddingX}px`
  ```
  zastosować:
  ```
  paddingTop: Math.max(0, paddingY),
  paddingBottom: Math.max(0, paddingY),
  paddingLeft: paddingX,
  paddingRight: paddingX,
  marginTop: Math.min(0, paddingY),
  marginBottom: Math.min(0, paddingY),
  ```
  (lub równoważnie ujemny margin tylko gdy `paddingY < 0`).

Dzięki temu suwak działa jak „kompresja pionowa": dodatnie = większy odstęp, ujemne = mniejsza wysokość kafelka niż domyślna.

## Pliki do edycji

- `src/components/creator/StyleEditorV2.tsx` — rozszerzenie `min` w 2 miejscach (timer + ScoreSideEditor)
- `src/components/v2/ScoreboardV2.tsx` — mapowanie ujemnych wartości `paddingY` na ujemny margines pionowy w 3 blokach (blue, orange, timer)