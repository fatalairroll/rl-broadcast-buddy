## Diagnoza

Porównanie zrzutów (kreator vs overlay w przeglądarce/OBS) pokazuje dwa niezależne błędy:

### 1. Overlay w OBS jest „przeskalowany" i nie mieści się na ekranie

W `src/pages/OverlayV2.tsx` zewnętrzny kontener ma stały rozmiar **1920×1080 px**, ale wewnątrz dodajemy `transform: scale(globalScale)` z `origin-top-left`. Gdy `globalScale = 1` to OK, jednak:

- W OBS Browser Source rzadko ustawia się dokładnie 1920×1080 — często mniejsze (np. 1600×900) lub większe, a wtedy stała ramka 1920×1080 jest rozciągana/przycinana przez OBS.
- Brakuje „auto-fit" do okna OBS (overlay powinien się sam skalować do faktycznych wymiarów Browser Source, zachowując 16:9).
- Dodatkowo `globalScale` mnoży się ze skalą OBS i rozjazd robi się bardzo widoczny.

### 2. Podgląd w kreatorze nie pokrywa się z overlayem 1:1

W `V2Preview.tsx` ramka ma rozmiar `1920 * scale × 1080 * scale` (np. 960×540 dla scale=0.5), a wewnętrzny div jest skalowany przez `scale * config.general.globalScale`. To oznacza, że `globalScale` w kreatorze **dodatkowo zmniejsza/powiększa zawartość wewnątrz tej samej ramki 960×540**, więc np. przy `globalScale=0.9` elementy w kreatorze są przy lewym górnym rogu i odsłania się czarne tło — ale w OBS skalowane jest całe 1920×1080. Stąd „karta na 100%" wygląda inaczej w obu miejscach.

Drugorzędnie: ramka kreatora rysowana przez `border` (`<div className="border border-border shadow-2xl">`) jest pixel-perfect 960×540, ale przeglądarka renderuje overlay w pełnym viewport. Jeżeli ktoś porównuje „na oko" rozstaw na obu screenshotach (overlay w przeglądarce nie jest 1:1 do okna), wygląda to jakby elementy były w innych miejscach — w rzeczywistości chodzi tylko o procent zoomu strony.

## Plan naprawy

### A. `src/pages/OverlayV2.tsx` — auto-fit do viewportu OBS

Zamienić sztywny kontener 1920×1080 na **odporny na rozmiar Browser Source** układ:

```text
[outer = 100vw × 100vh, transparent, flex center]
  └─ [stage = 1920×1080, transform: scale(fit) , origin: center]
       └─ ScoreboardV2, SeriesScoreV2, BoostStackV2 ×2, PlayerCardV2
```

- `fit = min(window.innerWidth / 1920, window.innerHeight / 1080) * config.general.globalScale`
- Liczone w `useEffect` + `ResizeObserver` na window, trzymane w stanie i wstawiane do `transform: scale(...)`.
- `origin: center center` żeby przy mniejszej rozdzielczości overlay siedział na środku, a nie wyjeżdżał w prawy/dolny róg.
- Dzięki temu Browser Source 1920×1080 → fit=1 (identycznie jak teraz). Browser Source 1600×900 → fit≈0.833, wszystko mieści się.

### B. `src/components/creator/V2Preview.tsx` — 1:1 z overlayem

Poprawić tak, by podgląd zachowywał się tak samo jak `OverlayV2`:

- Zewnętrzna ramka pozostaje `1920*scale × 1080*scale` (to jest „okno" na canvas, np. 960×540).
- Wewnętrzny stage 1920×1080 transformowany przez `scale(scale * globalScale)` z `origin: top-left`, ALE owinięty w dodatkowy wrapper, który również domyka rozmiar do `1920*scale*globalScale × 1080*scale*globalScale`, żeby tło/border kreatora odzwierciedlał faktyczną wielkość overlaya (gdy globalScale<1 ramka się kurczy, gdy >1 rośnie).
- Alternatywnie (prostsze i bliższe rzeczywistości OBS): zachować ramkę `1920*scale × 1080*scale` i skalować zawartość przez `scale * globalScale` z origin **center**, identycznie jak overlay. Wtedy widok w kreatorze odzwierciedla 1:1 to, co zobaczy OBS przy Browser Source 1920×1080.

Wybieram drugi wariant — daje pełną zgodność „kreator vs overlay vs OBS".

### C. Drobne porządki

- Usunąć z `V2Preview.tsx` mnożenie `transform: scale(scale * globalScale)` z `origin-top-left` na rzecz `origin: center` (zgodne z A).
- W `OverlayV2.tsx` dodać `overflow: hidden` na outer, żeby `globalScale > 1` nie generował scrollbarów w OBS.
- Usunąć tło-szachownicę z `V2Preview` poza obszarem stage'a (zostaje tylko jako tło canvasu, nie nakłada się na content), aby ramka kreatora pokrywała się z faktyczną granicą overlaya.

## Pliki do edycji

- `src/pages/OverlayV2.tsx` — auto-fit do viewportu, center origin, ResizeObserver.
- `src/components/creator/V2Preview.tsx` — center origin + spójna logika skalowania z overlayem.

Brak zmian w bazie danych, brak zmian w typach. Zachowuje się obecny system koordynat (0,0 = środek ekranu).

## Weryfikacja po wdrożeniu

1. Otworzyć `/creator` i `/v2/overlay?key=...` w dwóch oknach 1920×1080 → elementy w identycznych miejscach.
2. Zmienić `globalScale` na 0.8 w kreatorze → overlay w przeglądarce powinien zmniejszyć się o 20%, środek na środku.
3. W OBS Browser Source 1600×900 → cały overlay mieści się w kadrze, proporcjonalnie zmniejszony.
