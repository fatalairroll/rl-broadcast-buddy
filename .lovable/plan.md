# POPRAWKA: niewidoczne MMR w panelach graczy (neobrutal · next_3)

## Problem

Na zrzucie ekranu w pierwszym meczu (panele graczy z `RankIcon`) pasek MMR pod ikoną rangi jest ledwo widoczny:

- font 10px, `letterSpacing: .18em`, mało kontrastu vs. biały panel
- czwarty zawodnik (`ccoollee.rlstats`) w ogóle nie ma napisu „MMR · …" — komponent ukrywa pasek gdy `getMmrForMode(player, gameMode)` zwraca `null` (gracz zaimportowany z rlstats, bez MMR dla konkretnego trybu)
- znak wodny MMR (vertical) zostaje (`mmr != null`), ale poziomy pasek znika → wrażenie braku danych

Plik: `src/components/studio/MatchCard.tsx` (`NbPlayerPanel`, linie ~1127–1316).

## Zmiany (tylko neobrutal next_3, glass/sharp-glass bez zmian)

### 1) Pasek MMR — czytelność

W `NbPlayerPanel`, sekcja „MMR strip" (~1282–1302):

- `fontSize: 10` → `fontSize: 14` (przy `iconSize === 'xl'` → 16)
- `padding: '4px 10px'` → `padding: '6px 10px'`
- `letterSpacing: '.18em'` → `.12em`
- dodać `background: NB_ACID` zamiast `NB_WHITE` dla kontrastu z białym panelem (lub `NB_INK` + `color: NB_WHITE` — wybieram NB_ACID + NB_INK dla spójności z VS/Wkrótce)
- `fontWeight: 700` → `800`

### 2) Fallback dla brakującego MMR

Zamiast ukrywać cały pasek, zawsze go renderować jeśli panel ma gracza:

```ts
const mmr = getMmrForMode(player, gameMode);
// fallback: pokaż jakikolwiek dostępny MMR (rlstats import często ma tylko jedną wartość)
const fallbackMmr = mmr ?? player.mmr_2v2 ?? player.mmr_3v3 ?? player.mmr_1v1 ?? null;
const mmrLabel = fallbackMmr != null ? `MMR · ${fallbackMmr}` : 'MMR · —';
```

- pasek renderowany zawsze (gdy `player != null`)
- watermark MMR pozostaje warunkowy (`fallbackMmr != null`) — bez liczby nie ma czego pokazać pionowo
- watermark też używa `fallbackMmr`

### 3) Bez efektów ubocznych

- `getMmrForMode`/`resolveRank` bez zmian — ranga nadal liczona dla aktualnego trybu (z fallbackiem przez `getRankFromMmr` w `resolveRank`)
- panel TBD (brak gracza) bez zmian
- `NbRow` (kolejka następnych meczów) bez zmian
- glass i sharp-glass nietknięte

## Definition of Done

- [ ] Wszystkie 4 panele w pierwszym meczu pokazują widoczny pasek MMR (zielony NB_ACID, 14–16px, bold)
- [ ] `ccoollee.rlstats` pokazuje MMR z dowolnego dostępnego trybu, lub `MMR · —` gdy brak
- [ ] Watermark MMR (pionowy) bez regresji
- [ ] Glass/sharp-glass next_3 bez zmian wizualnych
- [ ] TS/lint czysto
