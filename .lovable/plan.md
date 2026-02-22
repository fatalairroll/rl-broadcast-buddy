

# Fix: Crash when enabling player stats in boost bar

## Root Cause

The `ColorPicker` component calls `value.toLowerCase()` (line 158 of `color-picker.tsx`) without checking if `value` is defined. When a preset is loaded from the database that was saved BEFORE the new stats fields (`statsTextColor`, `statsFontSize`, `statsOffsetX`) were added, these fields are `undefined`. As soon as "Show player stats" is toggled ON, the UI tries to render the `ColorPicker` for `statsTextColor` with `value={undefined}`, causing the crash and making everything disappear.

## Fix

### 1. `src/components/ui/color-picker.tsx`

Add a safety guard so `value` defaults to a fallback if undefined:

```tsx
// At line 158, change:
value.toLowerCase() === color.toLowerCase()
// To:
(value ?? '').toLowerCase() === color.toLowerCase()
```

Also guard any other `value` usage (like `hexToHsl(value)` calls) with a fallback.

### 2. `src/components/creator/StyleEditor.tsx`

Add fallback defaults for all stats-related fields that may be missing from old presets:

- `value={config.boostBars.statsTextColor ?? 'rgba(255,255,255,0.7)'}` (line 806)
- `value={config.boostBars.statsFontSize ?? 11}` (line 811)

These two changes will prevent any crash from missing fields in older saved presets.

## Files to modify

| File | Change |
|------|--------|
| `src/components/ui/color-picker.tsx` | Guard `value.toLowerCase()` against undefined |
| `src/components/creator/StyleEditor.tsx` | Add `?? fallback` for `statsTextColor` and `statsFontSize` |

