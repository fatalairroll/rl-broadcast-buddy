

# Plan: Naprawa błędu "Cannot read properties of undefined (reading 'toString')"

## Przyczyna

Komponent `SliderInput` wywołuje `value.toString()` na linii 25, zakładając że `value` jest zawsze liczbą. Jednak gdy konfiguracja jest ładowana z bazy danych (stare presety), nowe pola (np. `maxCharsPerLine`, `boxWidth`, `boxHeight`, `boxOffsetX`, `boxOffsetY`, `boxBorderRadius`, `opacity`) mogą być `undefined`, co powoduje crash.

## Rozwiązanie

Dodanie zabezpieczenia w komponencie `SliderInput` -- zamiana `value` na `value ?? min` (lub `0`), żeby nigdy nie był `undefined`. To naprawia problem globalnie dla wszystkich miejsc, które używają tego komponentu.

## Zmiana w pliku

### `src/components/ui/slider-input.tsx`

Linia 25 -- zmiana:
```typescript
// Było:
const [inputValue, setInputValue] = useState(value.toString());

// Będzie:
const safeValue = value ?? min;
const [inputValue, setInputValue] = useState(safeValue.toString());
```

Linia 28 -- zmiana w useEffect:
```typescript
setInputValue((value ?? min).toString());
```

Linia 42 -- zmiana w handleInputBlur fallback:
```typescript
setInputValue((value ?? min).toString());
```

Linia 72 -- zmiana w Slider value:
```typescript
value={[value ?? min]}
```

Jedna zmiana w jednym pliku naprawia problem wszędzie, ponieważ wszystkie suwaki używają tego komponentu.

