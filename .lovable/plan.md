Refactor the Glass player card (`src/components/v2/glass/GlassPlayerCard.tsx`) so that the MMR value sits below the nickname in a stacked, two-line layout.

Changes:
- In `CardBody`, replace the single-row flex content inside the glass bar with a left column (nickname + MMR) and keep the right column for the goal-state assist label.
- Wrap the nickname and MMR in a container with `flexDirection: 'column'`.
- Move the MMR value out of the right-side label and render it as its own line directly below the nickname.
- Increase the MMR font size from `11` to `16.5` (11 × 1.5).
- Set MMR opacity to `0.70` and font-weight to `800` (one step below the nickname's `900` from `glassName`).
- Change the fixed `height: CARD_H` on the card body and the glass bar to `minHeight: CARD_H` so the container can expand vertically when the two-line content needs more room.
- Keep the goal-state "asysta · …" label on the right side as-is; it is only shown during a goal event, so it does not conflict with the MMR layout.

Out of scope: other player card themes (standard, Y2K, Neo-Brutalism), rank box, kicker, shards, or any config-driven presets.