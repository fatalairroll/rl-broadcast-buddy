# PLAN v3.1 — Postgame Glass Correction

Sections 1 (Bracket) and 2 (Recent) from plan v3 remain in force. This plan **replaces section 3** (Postgame) only. Standard branch untouched.

## Scope

Rebuild the glass postgame body as a three-column grid mirroring the standard layout, but styled with glass tokens and a small team-proportion bar in the center column (in-game RL scoreboard reference).

## Files

- `src/components/studio/PostgameSummary.tsx` — rewrite glass branch
- `src/components/studio/PostgameShared.tsx` — add `PostgameMiniBarGlass`; remove `PostgameStatBarGlass` (unused after this change)

## 1. Remove v3 leftovers from glass

- Delete `GlassStatsView`, `GlassPlayerPanel`, and the call site in `PostgameSummary`.
- Delete `PostgameStatBarGlass` from `PostgameShared` (full-width bars no longer used).
- Keep `PANEL_STYLE_GLASS`, `glassName`, `glassLabel` imports.

## 2. New glass body: `GlassGridView`

Rendered when `theme === 'sharp-glass'`, below header + series pills.

### Grid template

Column count derives from `pairsSorted.length` (2v2 → 2, 3v3 → 3):

```text
gridTemplateColumns:
  `repeat(${N}, minmax(0, 1fr)) 120px repeat(${N}, minmax(0, 1fr))`
rowGap: 0
columnGap: 8px
```

Wrap in `PostgameGlassPanel` (glass variant) with `padding: 14px 18px; marginTop: 8`.

### Header row (nicks)

- For each blue player and each orange player: cell with `glassName`, `fontSize: 14`, centered, `whiteSpace: nowrap`, `overflow: hidden`, `textOverflow: ellipsis`.
- Center cell of header row: empty.
- Directly under the header row, render **one** horizontal line per team that spans its N columns:
  - blue underline: `gridColumn: 1 / span ${N}`, `height: 1.5px`, `background: #00B2FF`, `marginTop: 4px`, `marginBottom: 6px`
  - empty center cell
  - orange underline: `gridColumn: ${N + 2} / span ${N}`, `background: #FF8C23`
- Lines implemented as their own grid row (3 cells: blue span, empty 120px, orange span).

### Stat rows (one per `ROWS` entry)

Each row spans the full grid as `2N + 1` cells, `height: 34px`, `alignItems: center`:

- **Player value cells** (blue side N cells, then orange side N cells): `glassName`, `fontSize: 16`, centered, `tabular-nums`, value via `formatValue(row.player(p), row.format)`; `'—'` when `row.player === null`. Default text color: white. **MVP override (see §3): the MVP player's value cells use the MVP's own team color — blue MVP → `#00B2FF`, orange MVP → `#FF8C23`. Non-MVP cells (including all cells of the non-MVP team) stay white.**
- **Center cell** (120px): vertical flex, `alignItems: center`, `justifyContent: center`, `gap: 3px`:
  - Label: `glassLabel`, `fontSize: 10.5`, `letterSpacing: .22em`, `textAlign: center`, `textShadow: 0 1px 8px rgba(0,0,0,.6)`.
  - Mini bar (new component `PostgameMiniBarGlass`):
    - container 88×5 px, sharp corners, `background: rgba(8,12,22,.55)`, `borderTop: 1px solid rgba(255,255,255,.18)`, `position: relative`, `display: flex`, `overflow: hidden`
    - inputs: `blueValue = row.team(data, 'blue')`, `orangeValue = row.team(data, 'orange')`
    - total = blue + orange; `bluePct = total ? blue/total*100 : 50`
    - when total > 0: blue fill `linear-gradient(90deg,#1B6FF0,#00B2FF)` width `bluePct%`; orange fill `linear-gradient(270deg,#EB4B00,#FF8C23)` width `orangePct%`; absolute white separator `width: 2px`, `left: bluePct%`, `transform: translateX(-50%)`, full height
    - when total === 0: empty track + separator at 50%

No horizontal dividers between stat rows.

## 3. MVP highlight

- `const MVP_HIGHLIGHT = true;` (module-scope toggle).
- Compute MVP: flatten `pairsSorted` into all players, pick the one with highest `score`. If two or more players tie on the top score across both teams → no MVP.
- Determine MVP side from `team_num` (or by which array contains the player).
- **MVP value color rule (canonical, applies to §2):** the MVP's value cells render in the MVP's own team color — blue MVP → `#00B2FF`, orange MVP → `#FF8C23`. Never the opposing color. All other cells (teammates and the other team) stay white.
- In the header row, above the MVP nick cell, render a `Star` icon (`lucide-react`), `size={12}`, `fill={mvpColor}`, `stroke={mvpColor}` (same `mvpColor` as above), absolutely positioned at top center of the cell (`position: relative` on cell, star at `top: -10px, left: 50%, transform: translateX(-50%)`). Nick text stays white.
- Tie on top score → no star, no color override.

## 4. Cleanup checks

- Search for orphan imports of `PostgameStatBarGlass`, `GlassStatsView`, `GlassPlayerPanel` after edits.
- Verify standard branch (`theme !== 'sharp-glass'`) renders the existing `gridStyle` + `RowFragment` path unchanged.
- TypeScript: no unused vars; `Star` imported from `lucide-react`.

## Definition of Done

- Glass postgame: 3-column adaptive grid (N from data), center column 120 px.
- One team-color underline per team group beneath nicks.
- Center: label + 88×5 mini bar with 2 px white separator using team aggregates.
- MVP: star above nick + values in MVP's own team color (blue→`#00B2FF`, orange→`#FF8C23`); tie → no highlight.
- v3 full-width bars and compact panels removed from glass branch.
- Standard unchanged; TS/lint clean; verified in preview at 1920×1080.
