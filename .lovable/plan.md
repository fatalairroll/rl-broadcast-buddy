

# Fix: Detached team name boxes clipped by scoreboard shape

## Problem

The detached team name boxes are rendered as **children** of the scoreboard bar div, which uses CSS `clip-path` for shapes like "skewed" or "hexagon". Since `clip-path` clips all child elements, any part of the detached box that extends beyond the scoreboard area becomes invisible.

## Solution

Move the detached team name box elements **outside** the scoreboard bar div and into the parent positioning container. The parent container (the outer `div` with `position: absolute`) does not have `clip-path`, so the boxes will be fully visible regardless of the scoreboard shape.

## Changes

### `src/pages/Overlay.tsx`

- Move the Team A and Team B detached box divs (currently inside the scoreboard bar at lines ~141-205) to be **siblings** of the scoreboard bar div, still inside the outer container (lines ~117-124)
- Adjust positioning: since the parent container centers with `translateX(-50%)`, the detached boxes should be positioned relative to the scoreboard bar width using `calc()` or explicit left/right values

### `src/components/creator/OverlayPreview.tsx`

- Same structural change: move detached boxes outside the scoreboard bar div and into the parent container

## Technical Details

Current structure (broken):
```text
outer-container (absolute, no clip-path)
  scoreboard-bar (clip-path applied)
    detached-box-A (clipped!)
    detached-box-B (clipped!)
    ...score, timer, etc...
```

Fixed structure:
```text
outer-container (absolute, no clip-path)
  scoreboard-bar (clip-path applied)
    ...score, timer, etc...
  detached-box-A (visible, not clipped)
  detached-box-B (visible, not clipped)
```

The detached boxes will use `position: absolute` relative to the outer container, with `right` and `left` calculated based on scoreboard width to maintain the same visual placement.

