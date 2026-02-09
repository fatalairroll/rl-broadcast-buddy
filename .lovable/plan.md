
# Plan: Ominięcie strony logowania w trybie deweloperskim

## Problem
Strona główna (`/`) kieruje użytkownika do `/auth` (logowanie), mimo że sprawdzanie uwierzytelniania w Dashboard jest wyłączone na czas developmentu.

## Rozwiązanie
Zmiana nawigacji na stronie głównej, aby przycisk "Rozpocznij" kierował bezpośrednio do `/dashboard` zamiast do `/auth`.

## Szczegóły techniczne

### Plik: `src/pages/Index.tsx`
- Zmiana w linii z `navigate('/auth')` na `navigate('/dashboard')`

To jednolinijkowa zmiana. Strona `/auth` nadal będzie dostępna pod swoim adresem na przyszłość, gdy logowanie zostanie ponownie włączone.
