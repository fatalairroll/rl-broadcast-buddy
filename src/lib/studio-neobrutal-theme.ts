import type { CSSProperties } from 'react';

// NEO-BRUTALISM theme tokens for STUDIO views (next_3 / recent / bracket / postgame).
// Flat blocks, thick black borders, hard offset shadows. No gradients/blur/glow.
// Studio scene has OPAQUE background (unlike v2 match overlay).

export const NB_BLUE = '#2547FF';
export const NB_ORANGE = '#FF5A1F';
export const NB_ACID = '#D4FF3F';
export const NB_INK = '#111111';
export const NB_PAPER = '#E8E4DA';
export const NB_WHITE = '#FFFFFF';
export const NB_DIM = '#999999';

export const NB_BORDER = '3px solid #111111';
export const NB_BORDER_THIN = '2px solid #111111';
export const NB_BORDER_HAIR = '1px solid #111111';
export const nbShadow = '6px 6px 0 #111111';
export const nbShadowSmall = '5px 5px 0 #111111';
export const nbShadowTiny = '3px 3px 0 #111111';

export const NB_FONT = "'Archivo', 'Inter', sans-serif";
export const NB_MONO = "'JetBrains Mono', ui-monospace, monospace";

/** Opaque scene background — full sheet with subtle blueprint grid. */
export const nbSceneBg: CSSProperties = {
  background: NB_PAPER,
  backgroundImage:
    'linear-gradient(rgba(17,17,17,.04) 2px, transparent 2px),' +
    'linear-gradient(90deg, rgba(17,17,17,.04) 2px, transparent 2px)',
  backgroundSize: '48px 48px',
};

export const nbBlock: CSSProperties = {
  background: NB_WHITE,
  border: NB_BORDER,
  boxShadow: nbShadow,
};

export const nbBlockAcid: CSSProperties = {
  background: NB_ACID,
  border: NB_BORDER,
  boxShadow: nbShadow,
};

export const nbBlockInk: CSSProperties = {
  background: NB_INK,
  border: NB_BORDER,
  boxShadow: nbShadow,
  color: NB_WHITE,
};

export const nbBlockBlue: CSSProperties = {
  background: NB_BLUE,
  border: NB_BORDER,
  boxShadow: nbShadow,
  color: NB_WHITE,
};

export const nbBlockOrange: CSSProperties = {
  background: NB_ORANGE,
  border: NB_BORDER,
  boxShadow: nbShadow,
  color: NB_WHITE,
};