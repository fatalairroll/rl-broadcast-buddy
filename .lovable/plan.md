

# Plan: Dodanie linku do Studio w nawigacji Dashboard

## Zmiana

W pliku `src/pages/Dashboard.tsx`, w sekcji `<nav>` headera, dodać nowy przycisk między "Overlay" a "Kreator":

```typescript
<Button variant="ghost" size="sm" onClick={() => navigate('/studio')}>
  <Gamepad2 className="mr-2 h-4 w-4" />
  Studio
</Button>
```

Użyję ikony `Monitor` lub `Tv` zamiast `Gamepad2` (żeby się nie powtarzała). Jedna zmiana w jednym pliku.

| Plik | Zmiana |
|------|--------|
| `src/pages/Dashboard.tsx` | Dodanie przycisku "Studio" w nawigacji headera |

