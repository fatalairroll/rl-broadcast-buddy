## Problem

Wynik serii (kropki BO) zmienia położenie w poziomie po zmianie długości serii (BO1/BO3/BO5/BO7). Obecnie cały rząd `[kropki niebieskie] [BO5] [kropki pomarańczowe]` jest jednym flex-containerem wycentrowanym przez `translateX(-50%)`. To wycentruje **prostokąt rzędu**, ale punkt "środkowy" wizualnie (etykieta BO) wędruje, gdy:

- liczba kropek po obu stronach rośnie/maleje,
- (a w niektórych przypadkach) szerokości grup nie są idealnie równe (np. inny `shape: 'pill'` dla niektórych presetów, inne `gap` itp.).

Użytkownik chce: po ustawieniu `offsetX = 0` środek (etykieta BO) ma siedzieć dokładnie na środku ekranu (X=960) — i nie ruszać się przy zmianie BO1↔BO7.

## Rozwiązanie

Przebudować layout `SeriesScoreV2` tak, aby **etykieta BO była twardym punktem kotwiczącym** w wybranym `position`, a obie grupy kropek były pozycjonowane absolutnie *względem etykiety*: niebieska grupa „rośnie w lewo" od lewej krawędzi etykiety, pomarańczowa „rośnie w prawo" od prawej. Wtedy etykieta zawsze siedzi w (offsetX, offsetY) niezależnie od liczby kropek.

### Zmiana w `src/components/v2/SeriesScoreV2.tsx`

Zamiast jednego flex-rzędu:

```tsx
<motion.div style={{ ...positionToStyle(s.position), display: 'flex', gap: s.groupGap }}>
  <BlueGroup /> <Label /> <OrangeGroup />
</motion.div>
```

zrobić **kontener-punkt** (zerowych wymiarów) zakotwiczony w `s.position`, z trzema warstwami:

```tsx
<motion.div style={{ ...positionToStyle(s.position) }}>
  {/* Etykieta — to ona definiuje centrum */}
  <span style={{
    display: 'inline-block',
    transform: 'translate(-50%, -50%)',   // środek etykiety = punkt kotwiczenia
    position: 'absolute', left: 0, top: 0,
    whiteSpace: 'nowrap',
    color: s.labelColor, fontSize: s.labelFontSize,
  }}>
    {s.showLabel ? type.toUpperCase() : ''}
  </span>

  {/* Grupa niebieska — przykleja PRAWĄ krawędź do lewej krawędzi etykiety */}
  <div style={{
    position: 'absolute',
    right: `calc(50% + ${s.groupGap}px)`,   // odstęp od środka etykiety
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex', gap: s.gap,
    direction: 'rtl',  // żeby kropki rosły od środka na zewnątrz
  }}>
    {blueDots.map(...)}
  </div>

  {/* Grupa pomarańczowa — przykleja LEWĄ krawędź do prawej krawędzi etykiety */}
  <div style={{
    position: 'absolute',
    left: `calc(50% + ${s.groupGap}px)`,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex', gap: s.gap,
  }}>
    {orangeDots.map(...)}
  </div>
</motion.div>
```

Uwagi techniczne:
- Kontener `motion.div` zachowuje `positionToStyle(s.position)` i ma `width: 0; height: 0`, więc anchor `center/middle` plus `translate(-50%, -50%)` na etykiecie precyzyjnie kładzie środek etykiety w (960 + offsetX, 540 + offsetY).
- `groupGap` mierzony jest **od środka etykiety**, nie od jej krawędzi — żeby zachować symetrię nawet gdy zmienia się szerokość tekstu (BO1/BO3/BO5/BO7 mają różną szerokość). Dzięki temu lewy/prawy odstęp są zawsze równe.
- `direction: 'rtl'` na grupie niebieskiej sprawia, że pierwsza kropka (oznaczająca pierwszą wygraną grę) jest najbliżej środka, a kolejne dorzucane kropki rosną w lewo — co jest wizualnie spójne z grupą pomarańczową (która rośnie w prawo).
- `s.shape === 'square'` dalej dostaje `skewX(${s.skewDeg}deg)`; grupowy gap pozostaje bez zmian.
- Gdy `s.showLabel === false`, etykieta renderowana jest jako pusty `<span>` — i tak utrzymuje punkt zerowej szerokości w środku, więc kropki w obu grupach są rozdzielone samym `2 * groupGap` (czyli przerwa między najbliższymi kropkami niebieską i pomarańczową = `2 * groupGap`). To zachowuje wizualną „lukę środkową" nawet bez tekstu.

### Efekt

- `offsetX = 0` → etykieta dokładnie na środku ekranu (X=960).
- Zmiana BO1 → BO3 → BO5 → BO7 dorzuca/usuwa kropki na zewnątrz — środek się nie rusza.
- Asymetryczne wyniki (np. 2:0) też nie przesuwają środka, bo kropki tylko zmieniają wypełnienie, nie ich liczbę.

### Pliki do edycji

- `src/components/v2/SeriesScoreV2.tsx` — wyłączny zakres zmian. Bez zmian w typach, schemacie konfiguracji ani w innych komponentach (defaulty, edytor, OverlayV2).