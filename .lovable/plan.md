## Cel

W `BracketView` przy późnych fazach (mało meczów) drabinka ma być wyśrodkowana w pionie w kadrze. Gdy zawartość przekracza kadr — zachowanie bez zmian (start od góry + istniejący auto-pan).

## Plik

`src/components/studio/BracketView.tsx` — jedyny edytowany plik. Logika wspólna dla wszystkich motywów (standard / sharp-glass / neobrutal), bo wszystkie używają tego samego `outerRef`/`containerRef`.

## Zmiany

### 1. Stan `fits`

Dodać stan `const [fits, setFits] = useState(true);`.

W `measureOverflow` (~239) po wyliczeniu `maxScroll` ustawić:

```ts
const nextFits = container.offsetHeight <= outer.clientHeight;
setFits((prev) => (prev === nextFits ? prev : nextFits));
```

`measureOverflow` już jest podpięty pod `ResizeObserver` na `outer` i `container` oraz pod `window.resize` — czyli `fits` automatycznie się przelicza przy:
- zmianie zawartości (nowe matche / overhang),
- zmianie okna rund (`startIdx`, `selectedPoolId`) — przez ResizeObserver,
- zmianie rozmiaru kadru.

### 2. Wymuszenie maxHeight, żeby outer w ogóle MIAŁ kadr

Dziś `maxHeight` outer jest ustawiane tylko dla `isGlass` lub `enableAutoScroll`. W pozostałych przypadkach outer rośnie z treścią → nie ma „kadru", nie ma czego centrować, i pusta przestrzeń pochodzi z parent layoutu. Aby centrowanie miało sens dla wszystkich motywów:

- Ustawić zawsze `maxHeight: 'calc(100vh - 200px)'` (ta sama wartość, której już używa glass — zgodna z `STUDIO_PADDING_TOP/BOTTOM` i nagłówkiem rund). Glass zachowuje swoją wartość bez zmian; standard/neobrutal dostają to samo zamiast `undefined` / 960 px.
- Dodać `height: '100%'` jest zbyteczne; `maxHeight` + flex centrowanie wystarczy.

Alternatywa zachowawcza, jeśli zmiana maxHeight w standard/nb wprowadzi regresję wizualną: ograniczyć zmianę `maxHeight` do gałęzi neobrutal (objaw zgłoszony) i zostawić standard bez zmian — w planie domyślnie stosujemy wspólnie, w trakcie implementacji potwierdzić w preview.

### 3. Centrowanie outer w pionie gdy `fits`

Na elemencie `outer` (~590) dołożyć warunkowo styl flex:

```ts
display: 'flex',
flexDirection: 'column',
justifyContent: fits ? 'center' : 'flex-start',
```

Container (`containerRef`, ~602) zostaje bez zmian — jako jedyne dziecko flex-column zostanie wyśrodkowany w pionie (równa pustka góra/dół) gdy `fits`, lub przyklejony do góry gdy nie.

Glass-only `paddingTop: BRACKET_TOP_OFFSET` zostawiamy — przy `fits` flex i tak wyrówna obrys. Jeżeli wizualnie odsunie content, w glass można zerować ten padding gdy `fits` (`paddingTop: fits ? 0 : BRACKET_TOP_OFFSET`).

### 4. Auto-scroll / auto-pan tylko gdy NIE mieści

Standard auto-scroll effect (~274): dodać `if (!fits) ...` lub po prostu wczesny return:

```ts
if (isGlass) return;
if (!enableAutoScroll) return;
if (fits) { outer.scrollTop = 0; return; }
```

I dodać `fits` do deps tablicy zależności (`[enableAutoScroll, startIdx, selectedPoolId, fits]`).

Glass auto-pan effect (~359): analogicznie wczesny return jeśli `fits`, ustawić `container.style.transform = 'translateY(0px)'` i return; `fits` do deps.

Logika wewnętrzna pętli rAF — bez zmian (już ma guard `overhang <= 0`, ale start/stop sterujemy teraz `fits` co zapewnia, że pętla nawet nie wystartuje i nie konsumuje rAF gdy niepotrzebna).

### 5. Reset transform/scrollTop przy zmianie okna

Istniejący effect resetujący `scrollTop`/`transform` przy zmianie `startIdx`/`selectedPoolId` (~351) — bez zmian. `measureOverflow` przeliczy `fits` po nowym layoucie.

## Czego NIE ruszać

- Pętle rAF, ich fazy, prędkości, pauzy.
- `calcLines`, geometria linii, kotwiczenie rund (`windowIdx`, `getSlotLayout`).
- Style bloków meczowych w żadnym motywie.
- Postgame, recent, next_3.

## Weryfikacja

1. `/studio/render?...&mode=bracket&theme=neobrutal` — turniej z krótką drabinką (sam finał + półfinał): bracket wyśrodkowany pionowo, brak pustki tylko u góry.
2. Ten sam URL przy dużej drabince (>12 meczów w najwyższej kolumnie): bracket od góry, auto-scroll/pan działa cyklicznie.
3. `theme=standard` i `theme=glass` — to samo zachowanie, brak regresji wizualnej.
4. Przełączanie pooli i fazy w trakcie podglądu — tryb (center ↔ pan) zmienia się automatycznie po ResizeObserverze.
5. TS/lint czysto (build harness).
