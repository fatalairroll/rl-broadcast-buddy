## Problem

Kontener scoreboard używa flex layoutu z `translateX(-50%)`, więc centrowany jest geometryczny środek bounding boxa flexa. Gdy:
- Blue i Orange mają różne `paddingX` / `fontSize` (asymetria),
- timer inline ma inną szerokość niż „pusty" środek,
- skew (`-15deg`) wizualnie przesuwa krawędzie kafli na boki,

— wizualny środek scoreboardu przestaje pokrywać się ze środkiem ekranu przy `offsetX = 0`.

## Rozwiązanie

Zastosować ten sam wzorzec, który zadziałał dla `SeriesScoreV2`: **stały anchor w punkcie (960 + offsetX, top + offsetY)** i absolutne pozycjonowanie Blue po lewo, Orange po prawo, z timerem (inline) idealnie wycentrowanym w anchorze.

### Plik: `src/components/v2/ScoreboardV2.tsx`

1. Zastąpić `containerStyle` opartego na `positionToStyle` ręcznie liczonym anchorem:
   ```ts
   const STAGE_W = 1920;
   const STAGE_H = 1080;
   const anchorLeft = STAGE_W / 2 + sb.position.offsetX;
   // anchorV decyduje gdzie ląduje anchor pionowo — utrzymujemy zachowanie
   // dla 'top'/'middle'/'bottom' tak jak w positionToStyle, ale dla pionowej osi
   // można zostawić istniejące pozycjonowanie (problem dotyczy tylko poziomu).
   ```

2. Renderować trzy elementy jako `position: absolute` względem niewidzialnego kontenera o zerowej szerokości umieszczonego w anchorze:

   ```text
   container { position:absolute; left: 960+offsetX; top: ...; width:0; height:0 }
     ├── Blue   { position:absolute; right: gap/2; ... }   → rośnie w lewo
     ├── Timer  { position:absolute; left/top: 0; translate(-50%, 0) }  (inline)
     └── Orange { position:absolute; left:  gap/2; ... }   → rośnie w prawo
   ```

   Gdy timer jest inline, jego środek leży dokładnie na anchorze. Blue i Orange są od niego odsunięte o `timerWidth/2 + gap`. Najprostszy sposób bez znajomości szerokości timera w czasie renderu: opakować `[Blue][Timer][Orange]` w wewnętrznego flexa, ale ustawić `transform: translateX(-50%)` na nim — i upewnić się, że Blue/Orange/Timer są wewnątrz **symetryczni** (kompensacja po stronie CSS).

3. Lepsza, deterministyczna wersja (rekomendowana):
   - Renderować Blue i Orange w jednym wewnętrznym kontenerze flex z `gap: sb.gap` i timerem w środku, a cały ten flex umieścić tak, aby **środek kafla timera** (inline) lub **środek przerwy między Blue i Orange** (gdy timer detached) padał dokładnie na `anchorLeft`.
   - Realizacja: dodać element-anchor `position:absolute; left:anchorLeft; top:anchorTop` z `width:0`, a wewnątrz flex z `position:absolute; left:50%; top:0; transform: translateX(-50%)` — to znane (i obecne) zachowanie. **Problem nie znika**, dopóki bbox flexa jest asymetryczny.
   - Aby zagwarantować symetrię, ustawić Blue i Orange w **dwóch oddzielnych absolutnych slotach** względem anchora:
     ```ts
     // Blue: prawą krawędzią dotyka (anchor − halfCenter)
     <div style={{ position:'absolute', right: halfCenter, top: 0 }}>…blue…</div>
     // Orange: lewą krawędzią dotyka (anchor + halfCenter)
     <div style={{ position:'absolute', left: halfCenter, top: 0 }}>…orange…</div>
     // Timer (inline): wycentrowany na anchorze
     <div style={{ position:'absolute', left: 0, top: 0, transform:'translateX(-50%)' }}>…timer…</div>
     ```
     gdzie `halfCenter`:
     - inline timer → `timerHalfWidth + sb.gap` (timer mierzony przez `ref` + `useLayoutEffect`, lub estymowany na podstawie `paddingX*2 + fontSize*ileCyfr`),
     - detached timer → `sb.gap / 2`.

   Dla deterministycznego wyniku bez pomiarów DOM użyć **estymatora szerokości timera**: `2 * timer.paddingX + timer.fontSize * 2.4` (timer ma stały format `M:SS`, tabular-nums, więc szerokość jest przewidywalna). Dokładność wystarczająca; nawet drobny błąd nie powoduje zjawiska „przeskakiwania" jak teraz, bo wynik 0 i 9 ma tę samą szerokość (tabular-nums).

4. Dla osi pionowej zostawić istniejące zachowanie (`top` + ewentualne `translateY`) — problem dotyczył tylko poziomu.

5. Detached timer renderować bez zmian (już używa własnej `positionToStyle`).

### Efekt

Przy `offsetX = 0` środek timera (lub środek przerwy gdy detached) zawsze pada na X = 960. Asymetria padding/fontSize Blue vs Orange, długość wyniku ani skew nie wpływają na położenie środka.

### Pliki do edycji

- `src/components/v2/ScoreboardV2.tsx` — refaktor pozycjonowania na fixed-anchor.

Bez zmian w typach i edytorze stylów.
