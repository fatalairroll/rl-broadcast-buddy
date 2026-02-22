
# Plan: Ikonki statystyk graczy pod paskami boosta

## Opis

Zamiana tekstowych etykiet statystyk (SCR, G, A, SV, SH, DEM) na niestandardowe ikonki SVG renderowane inline. Ikony beda przezroczyste z cienkim stroke, 30% mniejsze od nicku gracza, z mozliwoscia przesuwania w poziomie i wlaczania/wylaczania checkboxem.

## Zmiany

### 1. Nowy komponent `src/components/ui/stat-icons.tsx`

Komponent eksportujacy 4 ikonki SVG jako komponenty React:
- **GoalIcon** -- bramka (uproszczony obrys bramki/siatki)
- **DemoIcon** -- eksplozja (promienie wybuchu)
- **AssistIcon** -- piesc (fist bump przodem)
- **ScoreIcon** -- wykres slupkowy

Kazda ikona:
- Przyjmuje `size` i `color` jako props
- Ma `fill="none"` (przezroczyste tlo)
- Ma cienki `strokeWidth={1.5}`
- Uzywa `currentColor` jako domyslny kolor

### 2. `src/types/broadcast.ts` -- nowe pole

Dodanie `statsOffsetX: number` (default 0) do `BoostBarsConfig` -- offset poziomy statystyk w px.

Usuniecie `statsInBarSaves` i `statsInBarShots` z wyswietlanych ikon (uzytkownik poprosil tylko o bramki, demo, asysty, score). Istniejace pola zostana zachowane w typie dla kompatybilnosci, ale nie beda juz renderowane jako ikony.

### 3. `src/pages/Overlay.tsx` -- zmiana `statsRow` w `BoostBar`

Zastapienie tekstowych etykiet ikonkami SVG:
- Rozmiar ikon = `config.fontSize * 0.7` (30% mniejsze niz nick)
- Kazda ikona + wartosc liczbowa obok
- Caly wiersz statystyk przesuwalny przez `marginLeft`/`marginRight` na podstawie `statsOffsetX`
- Uklad: `flex items-center gap-N` z ikonami i liczbami

Przyklad renderowania:
```tsx
{config.statsInBarGoals && (
  <span className="flex items-center gap-0.5">
    <GoalIcon size={iconSize} color={config.statsTextColor} />
    <span>{player.goals}</span>
  </span>
)}
```

### 4. `src/components/creator/OverlayPreview.tsx` -- analogiczna zmiana

Identyczne zastapienie tekstowych etykiet ikonkami w podgladzie (skalowanie ~0.4x).

### 5. `src/components/creator/StyleEditor.tsx` -- aktualizacja sekcji

W sekcji "Statystyki gracza w pasku":
- Zamiana `Switch` na `Checkbox` dla poszczegolnych statystyk (bramki, demo, asysty, score)
- Usuniecie opcji SV i SH (lub pozostawienie jesli chcesz -- uzytkownik wymienil 4)
- Dodanie `SliderInput` "Przesuniecie poziome" (`statsOffsetX`, min -50, max 50, px)
- Etykiety przy checkboxach: "Bramki", "Kasacje (Demo)", "Asysty", "Wynik (Score)" z podgladem ikonek

### 6. `src/config/overlayTemplates.ts` -- domyslna wartosc

Dodanie `statsOffsetX: 0` do szablonow.

## Podsumowanie zmian w plikach

| Plik | Zmiany |
|------|--------|
| `src/components/ui/stat-icons.tsx` | NOWY -- 4 komponenty ikon SVG |
| `src/types/broadcast.ts` | `statsOffsetX: number` w `BoostBarsConfig` |
| `src/pages/Overlay.tsx` | Ikony SVG zamiast tekstu w `statsRow` |
| `src/components/creator/OverlayPreview.tsx` | j.w. w podgladzie |
| `src/components/creator/StyleEditor.tsx` | Checkboxy + suwak offsetu |
| `src/config/overlayTemplates.ts` | `statsOffsetX: 0` |
