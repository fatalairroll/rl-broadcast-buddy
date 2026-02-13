
# Plan: Naprawa błędu SelectItem z pustą wartością

## Problem
Aplikacja crashuje z błędem: `A <Select.Item /> must have a value prop that is not an empty string`. Radix UI Select nie pozwala na `value=""` w SelectItem.

## Przyczyna
W pliku `src/components/dashboard/MatchControls.tsx` (linia 93) jest:
```tsx
<SelectItem value="" disabled>
  Brak presetów - utwórz w Kreatorze
</SelectItem>
```

Pusta wartość `value=""` jest niedozwolona przez Radix Select.

## Rozwiązanie
Zmiana `value=""` na `value="__empty__"` (lub dowolny niepusty placeholder string). Element i tak jest `disabled`, więc nie zostanie wybrany.

## Plik do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/components/dashboard/MatchControls.tsx` | Linia 93: `value=""` na `value="__empty__"` |
