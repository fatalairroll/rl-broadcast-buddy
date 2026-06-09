## Cel

Wyśrodkować etykiety nad paskami H2H w `PostgameTeamBarRow` tak, by oś etykiety = oś paska, niezależnie od długości tekstu (np. „CZAS NA 100 BOOSTA").

## Przyczyna

Aktualnie wiersz używa `grid grid-cols-3` (wartość blue / label / wartość orange). Komórka środkowa ma ~⅓ szerokości kolumny 208px (~69px). Etykieta z `whiteSpace: nowrap` przekracza tę komórkę, a `text-align: center` na zawartości szerszej niż kontener daje efekt „od środka w prawo" (lewa część poza widoczną kolumną przez clipping panelu).

## Rozwiązanie strukturalne

Zmienić `PostgameTeamBarRow` na układ pionowy o pełnej szerokości kolumny środkowej (208px):

```
┌────────── 208px ──────────┐
│ [blue#]  [orange#]        │  ← wartości flankują pasek w jednym wierszu
│  ╔═══════ label ═══════╗  │  ← etykieta: width:100%, text-align:center
│  ╚═══════ bar ═══════ ╝   │  ← pasek: width:100% (ta sama oś co label)
└───────────────────────────┘
```

Konkretnie:

- Root `<div>`: `width: 100%`, `display: flex`, `flexDirection: 'column'`, `alignItems: 'stretch'` (usunąć `grid-cols-3` z głównego layoutu wartości+label).
- **Wiersz wartości** (osobny, nad etykietą): `display: flex`, `justifyContent: 'space-between'` — blue value po lewej, orange po prawej (bez label w środku).
- **Etykieta**: wrapper `width: 100%`, `<span>` z `display: block`, `width: 100%`, `textAlign: 'center'`, `whiteSpace: 'nowrap'`, font 10px / letter-spacing 0.05em (z `studio-layout`).
- **Pasek**: `width: 100%`, `height: 10px` — bez zmian wizualnych gradientów/suwaka.

Brak `items-center` na root, brak `transform: translateX(-50%)` na etykiecie, brak `overflow: hidden` na wrapperze etykiety (etykieta i kolumna mają tę samą szerokość — nic nie przycina).

## Zmiana w `PostgameSummary.tsx`

Komórka środkowa gridu wierszy statystyk już używa `POSTGAME_CENTER_COL_WIDTH` w `gridTemplateColumns`. Dodać do każdej instancji `PostgameTeamBarRow` (lub do owijającego div) explicit:

```
style={{ width: POSTGAME_CENTER_COL_WIDTH, maxWidth: POSTGAME_CENTER_COL_WIDTH, minWidth: 0 }}
```

aby grid nie zwężał kolumny przy nadmiarze treści.

## Pliki

| Plik | Zmiana |
|------|--------|
| `src/components/studio/PostgameShared.tsx` | Przebudowa `PostgameTeamBarRow`: wartości w osobnym flex-row na górze, label full-width centered, bar full-width — oba na osi 208px |
| `src/components/studio/PostgameSummary.tsx` | Wrap środkowej komórki w div o stałej szerokości `POSTGAME_CENTER_COL_WIDTH` z `minWidth: 0` |

## Bez zmian

- `studio-layout.ts` (208 / font 10 zostają — fallback do 216/220 dopiero po teście wizualnym, jeśli najdłuższa etykieta nadal nie mieści się w 208px)
- `useStudioData`, filtr TBD (część A), Relay, `StudioContentFrame`, scoreboard header, wiersze nicków graczy

## Definition of Done

- 10/10 etykiet wyśrodkowanych względem osi paska
- „CZAS NA SUPERSONIC" / „ŚREDNI BOOST" / „CZAS NA 100 BOOSTA" bez pustego lewego marginesu
- Wartości blue/orange nadal widoczne i czytelne (kolory BLUE/ORANGE, tabular-nums)
- Brak regresji w wierszach nicków graczy i scoreboard header
