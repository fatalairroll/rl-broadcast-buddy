# Postgame UI Redesign — Plan

Frontend-only redesign of two postgame scenes in liquid-glass style (matching `MatchCard.tsx`), plus mode relabeling. Relay/data layer untouched.

## Files

**New:**
- `src/components/studio/PostgameShared.tsx` — shared `PostgameGlassPanel`, `PostgameMatchHeader`, `PostgameProgressRow`, plus shared formatters (`fmtSeconds`, `fmtNum`, `fmtFloat`).

**Edit:**
- `src/components/studio/PostgamePlayerCompare.tsx` — full rewrite (3-column layout + pair navigation).
- `src/components/studio/PostgameTeamSummary.tsx` — full rewrite (centered glass panel + bars).
- `src/pages/Studio.tsx` — relabel Select options.
- `src/pages/StudioRender.tsx` — relabel sidebar MODES entries.

**Do not touch:** `Relay.tsx`, `usePostgameRelay.ts` logic, `/v2/overlay`, Supabase, types in `postgame.ts`.

## 1. `PostgameShared.tsx`

Design tokens (from `MatchCard.tsx`):
- Blue `#2563eb`, Orange `#f97316`
- Panel bg `rgba(0,0,0,0.65)`, border `1px solid rgba(255,255,255,0.08)`, `backdrop-filter: blur(14px)`, `border-radius: 8px`
- `font-esports`, uppercase labels, text-shadow `0 1px 3px rgba(0,0,0,0.7)`
- Page bg stays `transparent` (OBS).

Components:

- **`PostgameGlassPanel`** — `<div>` wrapper with the panel tokens; accepts `className` + children.
- **`PostgameMatchHeader({ teamNames, blueScore, orangeScore })`** — single centered row: `TEAM_BLUE  [blue#]  vs  [orange#]  TEAM_ORANGE`. Team names uppercase font-esports neutral; scores ~64px in team color.
- **`PostgameProgressRow({ label, blueValue, orangeValue, format })`**:
  - Format helpers: `'number' | 'seconds' | 'float'` → display `—` when value is null.
  - Width math: `blueRaw = blueValue ?? 0`, `orangeRaw = orangeValue ?? 0`, `total = blueRaw + orangeRaw`; if `total === 0` both = 50%, else blue% = blueRaw/total*100.
  - Track: `rgba(255,255,255,0.06)`, height 10px, rounded.
  - Blue fill: `linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6)`.
  - Orange fill: `linear-gradient(270deg, #c2410c, #f97316, #fb923c)`.
  - Layout: row 1 = `[blueVal]  [LABEL centered]  [orangeVal]`; row 2 = bar with two segments. Label uppercase font-esports color `rgba(255,255,255,0.6)`. Values in team color, tabular-nums.

## 2. `PostgamePlayerCompare.tsx`

- Drop the existing per-pair score header and color-winner highlighting.
- Keep status messages (`null` data, relay error) using the same copy.
- Wrap content in `PostgameMatchHeader` (top) + pair view.
- State: `const [activePairIndex, setActivePairIndex] = useState(0)`; clamp when pairs length changes (useEffect). Add `keydown` listener for ArrowLeft/ArrowRight.
- Layout grid: `grid-cols-[auto_1fr_auto]` inside a `PostgameGlassPanel`.
  - **Left column (blue):** outer-side (left of vertical line) shows `player_name` (small, blue) above vertical score (writing-mode: vertical-rl, ~88px, blue, font-esports). Vertical line `width:2px; background: #2563eb; opacity:0.6` on the right edge of the column.
  - **Center column:** 9 `PostgameProgressRow` rows.
  - **Right column (orange):** mirrored — vertical line on left edge; nick + vertical score on the right of the line.
- 9 rows (label / field / format):
  1. Bramki / `goals` / number
  2. Asysty / `assists` / number
  3. Obrony / `saves` / number
  4. Strzały / `shots` / number
  5. Demolki / `demos` / number
  6. Zebrane pady / `pad_pickups` / number
  7. Supersonic / `supersonic_seconds` / seconds
  8. Średni boost / `avg_boost` / float
  9. Czas na 100 boosta / `time_at_100_seconds` / seconds
- Navigation arrows (lucide `ChevronLeft`/`ChevronRight`) absolute on left/right of panel, `opacity-40 hover:opacity-80`; hidden at bounds; entire nav hidden when `pairs.length <= 1`.

## 3. `PostgameTeamSummary.tsx`

- Remove vertical BLUE/ORANGE labels and outer score columns.
- Top: `PostgameMatchHeader` (horizontal names + scores).
- Center: single `PostgameGlassPanel` with 5 `PostgameProgressRow`:
  1. Kickoff Goals / `team.{blue,orange}.kickoff_goals_10s` / number
  2. Obrony / `saves` / number
  3. Demolki / `demos` / number
  4. Średni boost drużyny / `avg_boost` / float (null → `—`)
  5. Zebrane pady / `pad_pickups` / number
- Keep status messages.

## 4. Studio mode relabeling

- `src/pages/Studio.tsx`: change SelectItem labels:
  - `postgame_players` → "Podsumowanie graczy"
  - `postgame_summary` → "Podsumowanie drużyn"
  - keep helper text below.
- `src/pages/StudioRender.tsx`: in the `MODES` array (sidebar), update the same two labels. (Will view file to confirm exact shape before editing.)

URL values for `mode` unchanged.

## Acceptance

- Player compare: centered header, single visible pair, L/R arrows when >1 pair, nick + vertical score outside team-colored lines, 9 H2H gradient bars in glass panel; pad/boost/supersonic show real values when phase 2.
- Team summary: horizontal header above bars, no vertical side labels, "Kickoff Goals" label, avg_boost / pad_pickups from relay.
- Studio: new Polish labels in dropdown + sidebar. OBS bg transparent.
- No changes to relay, hook logic, or routing.
