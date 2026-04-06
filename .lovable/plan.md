

# Plan: Przebudowa MatchCard w stylu RLCS

## Referencja

Z obrazka referencyjnego (image-26) wyciągam:
- Panele graczy jako ostre parallelogramy (clip-path, bez zaokrągleń)
- Nicki graczy obrócone pionowo wzdłuż krawędzi panelu
- Duży napis "VERSUS" w centrum
- Pasek z nazwami drużyn na dole
- Kolory: niebieski (Team A / lewa) i pomarańczowy (Team B / prawa) — odwracam obecny układ kolorów
- Zamiast zdjęć graczy — duża ikona rangi jako główny element wizualny panelu

## Zmiany wizualne

### PlayerCard (wewnątrz MatchCard.tsx)
- **Kształt**: `clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%)` — ostry parallelogram, zero border-radius
- **Wymiary**: ~140px x 280px (wyższe, bardziej jak w referencji)
- **Ikona rangi**: Powiększona RankIcon jako centralny element (duży badge ~48x48px zamiast małego 10px)
- **Nick**: Obrócony pionowo (`writing-mode: vertical-rl`) wzdłuż lewej krawędzi panelu, biały, bold
- **MMR**: Na dole panelu, font-mono
- **Kolory**: Team A = niebieski gradient (`#2563EB` → `#1E40AF`), Team B = pomarańczowy gradient (`#F97316` → `#C2410C`)

### RankIcon — nowy prop `size`
- Dodanie prop `size?: 'sm' | 'lg'` do RankIcon
- `lg`: większy padding, font ~16px, ikona bardziej widoczna w panelu gracza

### Układ główny MatchCard
- Środkowy "VERSUS" — duży, pionowy tekst, bold, ~48px
- Nazwy drużyn: pasek na dole pod panelami (jak w referencji), bold uppercase
- Header (Round/BO/status) zostaje nad panelami
- Panele gracza blisko siebie z minimalnym gap, "VERSUS" w środku

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/components/studio/MatchCard.tsx` | Pełna przebudowa: ostre parallelogramy z clip-path, pionowe nicki, duża ikona rangi, odwrócone kolory, pasek drużyn na dole, duży VERSUS |
| `src/components/studio/RankIcon.tsx` | Dodanie prop `size` dla wariantu dużego (`lg`) |

