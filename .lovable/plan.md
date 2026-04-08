

# Plan: Napraw timing rotacji i dopasuj styl kolejnych meczów

## Problem z timingiem

**Root cause**: Po rotacji kolejki zmienia się kolejność `match_id` w `queue`. Kiedy API polluje co 5s, porównanie `newIds !== curIds` daje `true` (bo kolejność się zmieniła), więc `setQueue(matches)` resetuje kolejkę i timer. Rozwiązanie: porównywać **posortowane** ID zamiast w kolejności.

## Styl kolejnych meczów

Obecne wiersze kolejki (`UpcomingQueueRow`) mają za mały padding i brak stałej szerokości. Powinny mieć:
- Tę samą wysokość co `TeamBanner` (`py-2 px-5`)
- Tę samą szerokość (dopasowaną do pełnej szerokości obu wrapperów drużyn)
- Ten sam `skewX(-5deg)` z unskewed tekstem

## Zmiany

### 1. `src/pages/StudioRender.tsx` — naprawa timingu
- Linia 43-44: zmienić porównanie ID z kolejnościowego na posortowane:
  ```
  const newIds = matches.map(m => m.match_id).sort().join(',');
  const curIds = queue.map(m => m.match_id).sort().join(',');
  ```
- Dzięki temu rotacja kolejki nie triggeruje resetu, bo zbiór ID się nie zmienia

### 2. `src/components/studio/MatchCard.tsx` — styl `UpcomingQueueRow`
- Zwiększyć padding wiersza z `6px 0` do `py-2 px-5` (jak TeamBanner)
- Zachować `skewX(-5deg)` (już jest)
- Dopasować font i tracking do TeamBanner (`text-base font-bold tracking-[0.15em]`)

