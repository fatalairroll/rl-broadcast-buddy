

# Plan: Tabela `game_state` dla skryptu Python OCR

## Cel

Utworzenie tabeli `game_state` w bazie danych, do której skrypt Python będzie zapisywał dane z OCR (czas gry, wynik). Tabela ma zawsze jeden wiersz (id=1) aktualizowany w czasie rzeczywistym.

## Zmiany

### 1. Migracja SQL

Utworzenie tabeli `game_state` z kolumnami:
- `id` (int8, primary key)
- `timer` (text, default '5:00')
- `score_a` (text, default '0')
- `score_b` (text, default '0')

Włączenie RLS z politykami pozwalającymi na publiczny odczyt (SELECT) i publiczny zapis (UPDATE/INSERT) — skrypt Python używa klucza anon.

Wstawienie początkowego wiersza: `id=1, timer='5:00', score_a='0', score_b='0'`.

Włączenie Realtime na tabeli, aby overlay mógł nasłuchiwać zmian w czasie rzeczywistym.

### 2. Pliki do zmiany

| Element | Opis |
|---------|------|
| Migracja SQL | CREATE TABLE, RLS policies, INSERT wiersza startowego, Realtime |

Brak zmian w kodzie frontendu na tym etapie — to fundament pod kolejne kroki.

