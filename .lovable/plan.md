

# Plan: Naprawa offsetów X/Y i wyrównania nicków w boost barach

## Problem 1: Offsety X/Y nie działają dla elementów scoreboardu

### Przyczyna
W `Overlay.tsx` offsety dla **score display** (wynik meczu) są ustawiane przez `transform` w `style` na komponentach `motion.div`. Framer Motion nadpisuje `transform` podczas animacji (`initial={{ scale: 1.1 }}` / `animate={{ scale: 1 }}`), co sprawia, że `translate()` jest ignorowane.

Dla **timera** i **nazw drużyn** offsety sa poprawnie ustawione w Overlay.tsx, ale **nie sa stosowane w OverlayPreview.tsx** (podglad w kreatorze), wiec uzytkownik nie widzi efektu w edytorze.

### Rozwiazanie

**Overlay.tsx:**
- Dla score display: zawinac `motion.div` w zwykly `div` z `transform: translate(offsetX, offsetY)`, zeby framer-motion nie nadpisywal przesuniecia
- Upewnic sie, ze timer i nazwy druzyn maja transform z offsetami (juz maja)

**OverlayPreview.tsx:**
- Dodac `transform: translate(offsetX, offsetY)` do:
  - Team A name (linia ~158)
  - Team B name (linia ~265)
  - Score display A i B (linia ~197, ~247)
  - Timer (linia ~218)
  - Series display (linia ~170, ~281)

### Szczegoly techniczne

Score display w Overlay.tsx - zmiana z:
```typescript
<motion.div
  style={{
    transform: `translate(${config.scoreDisplay.offsetX}px, ${config.scoreDisplay.offsetY}px)`,
    // ...
  }}
  initial={{ scale: 1.1 }}
  animate={{ scale: 1 }}
>
```

Na:
```typescript
<div style={{ transform: `translate(${config.scoreDisplay.offsetX}px, ${config.scoreDisplay.offsetY}px)` }}>
  <motion.div
    style={{ /* bez transform */ }}
    initial={{ scale: 1.1 }}
    animate={{ scale: 1 }}
  >
    ...
  </motion.div>
</div>
```

W OverlayPreview.tsx - dodanie skalowanych offsetow (0.4x) do kazdego elementu, np:
```typescript
// Team A Name
<div className="flex flex-col items-end pr-1"
  style={{ transform: `translate(${config.teamAName.offsetX * 0.4}px, ${config.teamAName.offsetY * 0.4}px)` }}
>
```

---

## Problem 2: Nicki na prawych paskach boosta sa wyrownane do lewej zamiast do prawej

### Przyczyna
Klasa `flex-row-reverse` odwraca kolejnosc elementow (nazwa, pasek, wartosc), ale tekst nazwy gracza wewnatrz kontenera jest domyslnie wyrownany do lewej (`text-align: left`). Przy odwroconej kolejnosci nazwa powinna byc wyrownana do prawej krawedzi.

### Rozwiazanie

**Overlay.tsx** - w komponencie `BoostBar`, gdy `reversed=true`, dodac `text-align: right`:
```typescript
{config.showPlayerNames && (
  <div className="flex-1 min-w-0">
    <span
      className="font-semibold truncate uppercase block"
      style={{ 
        fontSize: config.fontSize, 
        color: '#ffffff',
        textAlign: reversed ? 'right' : 'left',
      }}
    >
      {player.name}
    </span>
  </div>
)}
```

**OverlayPreview.tsx** - w prawych (orange) boost barach, dodac `text-align: right`:
```typescript
<span className="text-white truncate uppercase font-semibold block" 
  style={{ fontSize: 5, textAlign: 'right' }}>
  {player.name}
</span>
```

---

## Pliki do modyfikacji

| Plik | Zmiany |
|------|--------|
| `src/pages/Overlay.tsx` | Zawijanie score display w div z transform; text-align: right dla reversed boost bar |
| `src/components/creator/OverlayPreview.tsx` | Dodanie offsetow do team names, scores, timer, series; text-align: right dla prawych boost barow |

## Kolejnosc

1. Naprawa offsetow w Overlay.tsx (score display wrapper)
2. Dodanie offsetow do OverlayPreview.tsx
3. Naprawa wyrownania tekstu w boost barach (oba pliki)
