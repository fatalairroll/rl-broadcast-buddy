

# Plan: Przeźroczystość OBS + Overlay ostatnich 10 meczów

## Problem 1: Brak przeźroczystości w OBS

Globalny CSS ustawia `body` z ciemnym tłem (`--background: 220 16% 8%`). Strona `/studio/render` ma `background: transparent` na swoim divie, ale `body` i `html` nadal mają nieprzezroczyste tło. OBS Browser Source renderuje tło body.

**Rozwiązanie:** Dodać w `src/index.css` regułę celowaną na ścieżkę `/studio/render`, ale prościej — w `StudioRender.tsx` dodać `useEffect` ustawiający `document.body.style.background = 'transparent'` i `document.documentElement.style.background = 'transparent'` (cleanup przywraca oryginalne). To wystarczy, żeby OBS z włączonym chroma/alpha widział przezroczystość.

## Problem 2: Overlay "Ostatnie 10 meczów"

Nowy tryb `recent` w module Studio. Dane pobierane z API `mode=bracket` (pełna drabinka), filtrowane po `state === 'done'`, posortowane i obcięte do 10.

### Struktura tabeli (jeden wiersz = jeden mecz):

```text
[SEED_A] | NAZWA_DRUŻYNY_A | WYNIK (np. 2:1) | NAZWA_DRUŻYNY_B | [SEED_B]
                            | Runda X Mecz Y  |
```

- Wynik serii centralnie, pod nim od razu numer rundy/meczu
- Drużyna A (niebieska) po lewej, drużyna B (pomarańczowa) po prawej
- Seed wyświetlany jako `#3` jeśli dostępny
- Wiersz zwycięzcy podświetlony (bold + kolor drużyny)
- Styl: glassmorphism, font esports, przezroczyste tło (OBS-ready)

### Zmiany w plikach:

| Plik | Zmiana |
|------|--------|
| `src/types/studio.ts` | Dodać `'recent'` do `StudioMode` |
| `src/hooks/useStudioData.ts` | Dla `mode === 'recent'`: wywołać API z `bracket`, filtrować `state === 'done'`, sortować po `round_index` desc, slice 10 |
| `src/components/studio/RecentMatchesTable.tsx` | **Nowy plik** — tabela 10 ostatnich meczów w stylu esportowym |
| `src/pages/StudioRender.tsx` | 1) `useEffect` ustawiający `body`/`html` background na `transparent` (fix OBS). 2) Renderować `RecentMatchesTable` gdy `mode === 'recent'` |
| `src/index.css` | Ewentualnie dodać utility `.studio-transparent` wymuszające przezroczystość na body |

### Szczegóły RecentMatchesTable

- Każdy wiersz: flex row z 5 kolumnami (seed_a, team_a, score+round, team_b, seed_b)
- Kolumna centralna: wynik `score_a : score_b` (większy font), pod spodem `Runda X Mecz Y` (mniejszy font, muted)
- Nazwy drużyn: blue po lewej wyrównana do prawej, orange po prawej wyrównana do lewej
- Zwycięzca: `font-bold text-white`, przegrany: `text-slate-500`
- Tło wierszy: subtelny glass (`rgba(10,15,30,0.6)`) z borderem `rgba(255,255,255,0.05)`
- Przezroczyste tło kontenera (OBS-ready)

