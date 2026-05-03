## Auto-hide overlay V2

### 1. Schema migration
Add `is_active boolean NOT NULL DEFAULT true` to `public.match_metadata`. Backfill existing row (id=1) to `true`. The relay/Python bot will toggle this column when game starts/ends.

### 2. Type update
Add `is_active: boolean` to `MatchMetadata` interface in `src/types/livestats.ts`. Default mock data in `src/lib/v2-mock-data.ts` to `is_active: true`.

### 3. Hook
`useLiveStatsV2` already returns the full `match` row, so `is_active` propagates automatically once the column exists. No changes needed beyond the type.

### 4. OverlayV2.tsx
Wrap the inner stage `<div>` (the one rendering Scoreboard/BoostStack/etc.) in a wrapper with:

```tsx
const isActive = match?.is_active ?? true;
<div className={`transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
  ...stage...
</div>
```

Fade-out when bot sets `is_active=false` (match ended), instant fade-in when `true`. Defaults to visible if column missing/null so we don't break existing flows.

### 5. Creator preview
`V2Preview` should ignore `is_active` (always show in editor) — no change needed since wrapper is only added in `OverlayV2.tsx`.

### Notes
- No UI toggle in dashboard required by this task — column is driven externally by the relay bot.
- 500ms Tailwind transition matches request.
