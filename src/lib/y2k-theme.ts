import type { CSSProperties } from 'react';

// Y2K CHROME — late-90s/2000s chromed metallic theme tokens.
// Hardcoded. Used by src/components/v2/y2k/* and v2-y2k-preset.ts.

export const Y2K_BLUE = '#5B8DEF';
export const Y2K_ORANGE = '#FF6B35';
export const Y2K_CHROME = '#C4B5FD';
export const Y2K_TXT = '#FFFFFF';
export const Y2K_DIM = 'rgba(255,255,255,0.55)';
export const Y2K_LINE = 'rgba(255,255,255,0.18)';

export const Y2K_FONT = "'Archivo', 'Inter', sans-serif";
export const Y2K_MONO = "'JetBrains Mono', ui-monospace, monospace";

// Chrome gradients: bright top → saturated mid → dark → bright bottom
export const chromeBlue =
  'linear-gradient(180deg, #B4CCFF 0%, #5B8DEF 38%, #1E3F8C 70%, #8FB1F5 100%)';
export const chromeOrange =
  'linear-gradient(180deg, #FFD2BA 0%, #FF6B35 38%, #8C2E10 70%, #FFB28F 100%)';
export const chromeSilver =
  'linear-gradient(180deg, #F4F4FF 0%, #C4B5FD 38%, #4B3F8C 72%, #DCD2FF 100%)';

export const y2kCoreBg =
  'linear-gradient(180deg, #15131F 0%, #0A0814 50%, #15131F 100%)';
export const y2kPanelBg =
  'linear-gradient(180deg, rgba(20,16,30,0.92) 0%, rgba(10,8,20,0.92) 100%)';

export const y2kBorder = `1px solid ${Y2K_LINE}`;
export const y2kGlow = '0 0 24px rgba(196,181,253,.35), 0 2px 14px rgba(0,0,0,.6)';
export const y2kGlowSoft = '0 0 12px rgba(196,181,253,.25)';

export const y2kNameShadow: CSSProperties['textShadow'] =
  '0 2px 0 rgba(0,0,0,.55), 0 0 8px rgba(0,0,0,.6)';
export const y2kChromeTextShadow: CSSProperties['textShadow'] =
  '0 1px 0 #fff, 0 2px 6px rgba(0,0,0,.6), 0 0 10px rgba(196,181,253,.7)';
export const y2kScoreShadow: CSSProperties['textShadow'] =
  '0 0 12px rgba(255,255,255,.85), 0 2px 0 rgba(0,0,0,.6)';

// Scanlines: render INSIDE a panel that already has `overflow:hidden`.
export const y2kScanlines: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background:
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)',
  mixBlendMode: 'overlay',
  zIndex: 2,
};

export const GOAL_SWAP_MS = 180;
export const GOAL_HOLD_MS = 3000;