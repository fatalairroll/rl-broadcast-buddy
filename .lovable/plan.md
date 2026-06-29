Increase the nickname font size by 20% in every V2 match-overlay boost-bar component that renders a player name next to the boost bar. Only the `fontSize` value changes; no other property is touched.

Changes:
- `src/types/overlayV2.ts` (default config used by standard theme): `boostBar.nameFontSize` 16 → 19.2
- `src/components/v2/glass/GlassBoostPanel.tsx`: nickname `fontSize` 13 → 15.6
- `src/components/v2/neobrutal/NbBoostStack.tsx`: nickname `fontSize` 14 → 16.8
- `src/components/v2/y2k/Y2kBoostStack.tsx`: nickname `fontSize` 14 → 16.8

Out of scope: scoreboard team names, active player card, series labels, gauge, or any non-name element in the boost bars.