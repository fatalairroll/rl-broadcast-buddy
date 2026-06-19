Single-file edit in `src/components/studio/MatchCard.tsx`.

## Change
Remove the vertical MMR watermark inside `NbPlayerPanel` for neobrutal next_3 only.

- Delete the `{fallbackMmr != null && (...)}` block (lines ~1209–1237) containing the `writingMode: 'vertical-rl'` absolute-positioned watermark.
- Keep the `fallbackMmr` variable unchanged; the horizontal MMR strip still uses it.
- Keep `RankIcon` layout unchanged: it already sits in a `flex: 1` centered container and will remain centered after the watermark is removed.
- No other styles, components, or themes are affected.

## Verification
- Build/lint check.
- Browser preview of `/studio/render?theme=neobrutal&mode=next_3` — confirm no vertical MMR digit, RankIcon centered, horizontal MMR strip visible, no regressions in other themes.