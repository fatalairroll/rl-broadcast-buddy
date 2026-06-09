# Studio — Layout Tweaks (post Unified Layout)

Scope: 3 narrow fixes. No changes to Relay, live overlay (`/v2/overlay`, `ScoreboardV2`), Supabase, or postgame data logic.

---

## 1. Camera safe zone: 325 → 450

**File:** `src/lib/studio-layout.ts`

```ts
export const STUDIO_CAMERA_SAFE_RIGHT = 450; // was 325
```

Applies automatically everywhere via `StudioContentFrame`. Usable UI strip becomes `1920 − 112 (sidebar) − 450 = 1358 px` in preview, `1920 − 450 = 1470 px` in OBS.

---

## 2. `next_3`: queue fully visible on 1080p

Currently `StudioContentFrame` forces `alignItems: 'center'` (vertical centering not needed because `min-h-screen` + `flex-col`; horizontal stays centered via inner `margin: 0 auto`). The 95 px bottom padding pushes the rotating queue out of view in some states.

**File:** `src/components/studio/StudioContentFrame.tsx`

- Add optional props `paddingBottom?: number` and `justify?: 'start' | 'center'` (default `start` — current behavior already starts from top).
- Keep horizontal centering via inner wrapper `margin: 0 auto`; remove reliance on outer `alignItems: 'center'` (it has no effect on column flex children that are already full width). No visible change for other modes.

**File:** `src/pages/StudioRender.tsx`

For the `next_3` branch:
```tsx
<StudioContentFrame obs={obs} paddingBottom={24}>
```
Other modes keep the default 95 px bottom padding.

Result: the active `MatchCard` plus rotating `upcomingMatches` list fits within `1080 − 92 − 24 = 964 px` of vertical space.

---

## 3. `PostgameScoreboardHeader` centered relative to glass-panel width

The header is fixed at `TOTAL_W = 540 px` and currently renders left-aligned at the top of the postgame frame. The glass panel below is full inner width (up to `STUDIO_MAX_WIDTH_POSTGAME = 1020`), so the header looks offset to the left.

**File:** `src/components/studio/PostgameSummary.tsx`

Wrap `<PostgameScoreboardHeader … />` in a centered container:

```tsx
<div className="flex w-full justify-center">
  <PostgameScoreboardHeader … />
</div>
```

No changes to `PostgameScoreboardHeader` internals or to the glass panel.

---

## Out of scope (do not touch)

- `Relay.tsx`, `usePostgameRelay.ts`, `/v2/overlay`, `ScoreboardV2.tsx`
- Supabase schema / RLS / edge functions
- Sidebar width (112), `?obs=1` logic, poll button, OBS transparency
- Postgame data rows, MatchCard, BracketView, RecentMatchesTable internals
