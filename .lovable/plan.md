

# Plan: Zmiana klucza autoryzacji w StudioRender.tsx

## Zmiana

W pliku `src/pages/StudioRender.tsx`, linia 10:

```typescript
// Przed:
const VALID_KEY = 'MY_SECRET_AUTH';

// Po:
const VALID_KEY = 'kXS6cVkTpJM2Qti';
```

Jedna linia do zmiany. Po tym, link OBS będzie wymagał `?key=kXS6cVkTpJM2Qti` w URL.

