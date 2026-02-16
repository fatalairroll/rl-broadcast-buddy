

# Fix: Detached boxy obcinane przez clip-path scoreboardu

## Problem

Detached boxy nazw druzyn sa renderowane jako **dzieci** diva scoreboardu, ktory uzywa CSS `clip-path` dla ksztaltow takich jak "skosne", "szescioakat" itp. Wlasciwosc `clip-path` obcina **wszystkie** elementy potomne, wiec czesci boxow wystawajace poza pasek scoreboardu sa niewidoczne.

## Rozwiazanie

Przeniesc detached boxy z wnetrza diva scoreboardu (ktory ma `clip-path`) do rodzica -- kontenera pozycjonujacego (ktory nie ma `clip-path`). Boxy stana sie rodzenstwa paska scoreboardu zamiast jego dzieci.

## Struktura przed zmiana

```text
outer-container (position: absolute, translateX(-50%))
  scoreboard-bar (clip-path: polygon(...))     <-- obcina dzieci!
    detached-box-A (position: absolute)        <-- obciete!
    detached-box-B (position: absolute)        <-- obciete!
    ...score, timer, nazwy inline...
```

## Struktura po zmianie

```text
outer-container (position: absolute, translateX(-50%))
  scoreboard-bar (clip-path: polygon(...))
    ...score, timer, nazwy inline...
  detached-box-A (position: absolute)          <-- widoczne!
  detached-box-B (position: absolute)          <-- widoczne!
```

## Zmiany w plikach

### 1. `src/pages/Overlay.tsx`

- Dodanie `position: 'relative'` do outer-container (linia ~118) -- jesli jeszcze nie ma
- Przeniesienie blokow Team A Detached Box (linie ~141-172) i Team B Detached Box (linie ~174-206) **za** zamykajacy tag diva scoreboard-bar
- Pozycjonowanie boxow wzgledem outer-container: zamiast `right: '100%'` wzgledem paska, uzycie `right: '100%'` wzgledem tego samego kontenera (outer-container ma ta sama szerokosc co pasek, wiec wartosci sie nie zmieniaja)

### 2. `src/components/creator/OverlayPreview.tsx`

- Identyczna zmiana strukturalna: przeniesienie detached boxow (linie ~151-208) za div paska scoreboardu
- Outer-container (linia ~127) juz ma `position: absolute`, trzeba upewnic sie ze detached boxy sa pozycjonowane wzgledem niego

## Szczegoly techniczne

- Outer-container ma `transform: translateX(-50%)`, wiec jest kontekstem pozycjonowania (stacking context) -- `position: absolute` na dzieciach bedzie dzialac wzgledem niego
- Szerokosc outer-container nie jest jawnie ustawiona, wiec rozciaga sie do rozmiaru scoreboard-bar -- `right: '100%'` i `left: '100%'` beda dzialac identycznie jak wczesniej
- Zadne inne elementy nie sa modyfikowane -- zmiana jest czysto strukturalna (przeniesienie w DOM)

