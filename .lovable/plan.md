

# Plan: Glassmorphism + refaktoryzacja kart graczy

## Zmiany w `src/components/studio/MatchCard.tsx`

### PlayerPanel — nowy styl glassmorphism
- **Tło**: Zamienić kolorowe gradienty na ciemne, półprzezroczyste (`rgba(10,15,30,0.75)` dla A, `rgba(30,15,10,0.75)` dla B) z silnym `backdrop-filter: blur(10px)`
- **Ramka**: `border: 1px solid rgba(255,255,255,0.1)` (już jest)
- **Box-shadow**: Delikatny glow w kolorze drużyny — `#2563eb` (A) / `#f97316` (B)
- **MMR hero**: Zmniejszyć opacity z 0.4 → 0.1, zachować `mix-blend-mode: overlay`

### Nick — ciemniejszy pasek u góry
- Dodać ciemny pasek (`bg-black/40`) na pełną szerokość u góry karty
- Biały, gruby font bezszeryfowy (Inter/Rajdhani bold), duży `letter-spacing: 0.15em`
- Wyśrodkowany z offsetem 15% (clip-path)

### Ikona rangi — centrum
- Bez zmian w rozmiarze (96px xl), bez pochylenia
- Zachować `pulse-glow` animację z `glowColor` w kolorze drużyny

### Akcenty kolorystyczne
- Lewe karty: subtelne niebieskie akcenty (border-top lub gradient accent strip)
- Prawe karty: pomarańczowe akcenty
- Box-shadow glow w odpowiednim kolorze

### TbdPanel — analogiczne zmiany glassmorphism

## Pliki

| Plik | Zmiana |
|------|--------|
| `src/components/studio/MatchCard.tsx` | Glassmorphism tło, ciemny pasek nicku, MMR opacity 0.1, kolorowe akcenty |

