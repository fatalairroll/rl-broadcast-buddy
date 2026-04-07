

# Plan: Redesign kart graczy w stylu esportowym

## Podsumowanie

Przebudowa `PlayerPanel` w `MatchCard.tsx` i `RankIcon.tsx` — dodanie tekstury szczotkowanego aluminium, efektów dymnych/cząsteczkowych, powiększonych ikon rang z pulsowaniem, agresywnej czcionki technicznej i nowej hierarchii informacji (nick → ikona → ranga → MMR).

## Zmiany

### 1. `src/index.css` — nowa czcionka + animacje + tekstura
- Import fontu **Rajdhani** (bold, techniczna czcionka w stylu esportowym) z Google Fonts
- Keyframes CSS: `pulse-glow` (pulsowanie blasku wokół ikony rangi), `smoke-drift` (animacja dymnych smug), `brushed-metal` (subtelna tekstura aluminium via pseudo-elementy/gradienty)
- Klasa `.brushed-metal` — nakładka z repeating-linear-gradient symulująca szczotkowane aluminium (półprzezroczyste paski pod kątem)

### 2. `src/components/studio/RankIcon.tsx` — powiększone ikony + animacja
- Nowy rozmiar `xl`: 96px (główny element wizualny karty)
- Animacja `pulse-glow` — pulsujący box-shadow / drop-shadow w kolorze rangi
- Label rangi pod ikoną w foncie Rajdhani

### 3. `src/components/studio/MatchCard.tsx` — kompletny redesign PlayerPanel
- **Tekstura**: Nakładka szczotkowanego aluminium (CSS gradient) na istniejące kolory drużyn
- **Efekty dymne**: Pseudo-elementy z radial-gradient + animacją drift, symulujące dymne smugi w kolorze drużyny za ikoną rangi
- **Nowa hierarchia (góra→dół)**:
  1. **Nick** — poziomo u góry, font Rajdhani bold, duży i wyraźny
  2. **Ikona rangi** — centrum karty, rozmiar xl (96px), z animacją pulsowania
  3. **Nazwa rangi** — pod ikoną, Rajdhani uppercase
  4. **MMR** — subtelny pasek na dole, mała czcionka mono
- Usunięcie pionowego writing-mode dla nicku
- Powiększenie paneli z 140×280 na ~160×320 dla lepszych proporcji
- Font Rajdhani dla nagłówka (Round/BO) i nazw drużyn
- VERSUS w foncie Rajdhani

### 4. Efekt dymny — implementacja CSS
- 2-3 warstwy `radial-gradient` z różnym opacity i pozycją
- Animacja `smoke-drift` przesuwająca gradienty w górę/w bok
- Kolory dopasowane do strony (niebieski / pomarańczowy)

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/index.css` | Import Rajdhani, keyframes animacji, klasa brushed-metal |
| `src/components/studio/RankIcon.tsx` | Rozmiar `xl`, animacja pulse-glow |
| `src/components/studio/MatchCard.tsx` | Redesign PlayerPanel: hierarchia, tekstura, dym, font |

