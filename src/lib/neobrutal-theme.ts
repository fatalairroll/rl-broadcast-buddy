import type { CSSProperties } from 'react';

// NEO-BRUTALISM — flat blocks, thick black borders, hard offset shadows.
// No gradients, no blur, no glow. Used by src/components/v2/neobrutal/* and
// v2-neobrutal-preset.ts.

export const NB_BLUE = '#2547FF';
export const NB_ORANGE = '#FF5A1F';
export const NB_ACID = '#D4FF3F';
export const NB_INK = '#111111';
export const NB_PAPER = '#E8E4DA';
export const NB_WHITE = '#FFFFFF';

export const NB_BORDER = '3px solid #111111';
export const NB_BORDER_THIN = '2px solid #111111';
export const nbShadow = '6px 6px 0 #111111';
export const nbShadowSmall = '4px 4px 0 #111111';

export const NB_FONT = "'Archivo', 'Inter', sans-serif";
export const NB_MONO = "'JetBrains Mono', ui-monospace, monospace";

export const nbBlockPaper: CSSProperties = {
  background: NB_PAPER,
  border: NB_BORDER,
  boxShadow: nbShadow,
};
export const nbBlockAcid: CSSProperties = {
  background: NB_ACID,
  border: NB_BORDER,
  boxShadow: nbShadow,
};
export const nbBlockBlue: CSSProperties = {
  background: NB_BLUE,
  border: NB_BORDER,
  boxShadow: nbShadow,
};
export const nbBlockOrange: CSSProperties = {
  background: NB_ORANGE,
  border: NB_BORDER,
  boxShadow: nbShadow,
};

export const GOAL_SWAP_MS = 180;
export const GOAL_HOLD_MS = 3000;