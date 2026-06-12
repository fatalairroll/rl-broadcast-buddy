import type { CSSProperties } from 'react';

export type StudioTheme = 'standard' | 'sharp-glass';

/* ── Kolory bazowe ── */
export const GLASS_BLUE_FROM = 'rgba(0,175,255,.48)';
export const GLASS_BLUE_TO = 'rgba(25,95,240,.30)';
export const GLASS_ORANGE_FROM = 'rgba(255,140,35,.5)';
export const GLASS_ORANGE_TO = 'rgba(235,75,0,.30)';
export const GLASS_DARK = 'rgba(14,18,32,.42)';
export const GLASS_SCORE_BG = 'rgba(6,10,20,.58)';
export const GLASS_CHIP_BG = 'rgba(10,14,26,.5)';

/* ── Wspólny materiał szkła ── */
export const GLASS_FILTER = 'blur(22px) saturate(190%)';
const glassBase: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: GLASS_FILTER,
  WebkitBackdropFilter: GLASS_FILTER,
};

/* ── Pasek drużyny ── */
export const glassBarBlue: CSSProperties = {
  ...glassBase,
  background: `linear-gradient(112deg, ${GLASS_BLUE_FROM} 0%, ${GLASS_BLUE_TO} 100%)`,
  border: '1px solid rgba(150,222,255,.42)',
  borderTop: '1px solid rgba(222,246,255,.7)',
  boxShadow:
    'inset 0 1px 1px rgba(255,255,255,.4), inset 0 -10px 22px rgba(0,50,190,.22)',
};

export const glassBarOrange: CSSProperties = {
  ...glassBase,
  background: `linear-gradient(248deg, ${GLASS_ORANGE_FROM} 0%, ${GLASS_ORANGE_TO} 100%)`,
  border: '1px solid rgba(255,200,145,.42)',
  borderTop: '1px solid rgba(255,237,213,.7)',
  boxShadow:
    'inset 0 1px 1px rgba(255,255,255,.4), inset 0 -10px 22px rgba(190,55,0,.22)',
};

export const glassBarDead: CSSProperties = {
  ...glassBase,
  background: GLASS_DARK,
  border: '1px solid rgba(255,255,255,.1)',
  borderTop: '1px solid rgba(255,255,255,.24)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,.12)',
};

/* ── Score box ── */
export const glassScoreBox: CSSProperties = {
  ...glassBase,
  background: GLASS_SCORE_BG,
  border: '1px solid rgba(255,255,255,.2)',
  borderTop: '1px solid rgba(255,255,255,.45)',
  boxShadow:
    'inset 0 1px 1px rgba(255,255,255,.25), inset 0 -7px 16px rgba(0,0,20,.5)',
};

export const glassScoreDigitWin: CSSProperties = {
  color: '#fff',
  textShadow: '0 0 14px rgba(255,255,255,.45), 0 2px 6px rgba(0,0,0,.5)',
};

export const glassScoreDigitLose: CSSProperties = {
  color: 'rgba(255,255,255,.28)',
  textShadow: 'none',
};

/* ── Chip ── */
export const glassChip: CSSProperties = {
  ...glassBase,
  background: GLASS_CHIP_BG,
  border: '1px solid rgba(255,255,255,.16)',
  borderTop: '1px solid rgba(255,255,255,.38)',
};

/* ── Specular sweep ── */
export const glassSpecularSweep: CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: '50%',
  background:
    'linear-gradient(180deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,.05) 70%, transparent 100%)',
  pointerEvents: 'none',
  zIndex: 1,
};

/* ── Chamfer ── */
export const chamferLeft = (px = 10): CSSProperties => ({
  clipPath: `polygon(${px}px 0, 100% 0, 100% 100%, 0 100%, 0 ${px}px)`,
});

export const chamferRight = (px = 10): CSSProperties => ({
  clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${px}px), calc(100% - ${px}px) 100%, 0 100%)`,
});

export const chamferTitle: CSSProperties = {
  clipPath:
    'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
};

export const chamferTag: CSSProperties = {
  clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
};

/* ── Tytuł sekcji ── */
export const glassTitleCool: CSSProperties = {
  ...glassBase,
  ...chamferTitle,
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  background:
    'linear-gradient(135deg, rgba(0,170,255,.42) 0%, rgba(20,90,235,.27) 100%)',
  border: '1px solid rgba(160,225,255,.5)',
  borderTop: '1px solid rgba(225,248,255,.75)',
  boxShadow:
    'inset 0 1px 1px rgba(255,255,255,.5), inset 0 -10px 24px rgba(0,60,200,.25)',
};

export const glassTitleWarm: CSSProperties = {
  ...glassTitleCool,
  background:
    'linear-gradient(135deg, rgba(255,130,30,.44) 0%, rgba(230,70,0,.27) 100%)',
  border: '1px solid rgba(255,205,150,.5)',
  borderTop: '1px solid rgba(255,238,215,.75)',
  boxShadow:
    'inset 0 1px 1px rgba(255,255,255,.5), inset 0 -10px 24px rgba(180,50,0,.25)',
};

/* ── Typografia ── */
export const GLASS_FONT = "'Barlow Condensed', sans-serif";

export const glassName: CSSProperties = {
  fontFamily: GLASS_FONT,
  fontStyle: 'italic',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.035em',
  color: '#fff',
  textShadow: '0 2px 10px rgba(0,8,40,.55)',
  whiteSpace: 'nowrap',
};

export const glassNameDead: CSSProperties = {
  ...glassName,
  color: 'rgba(255,255,255,.38)',
  textShadow: 'none',
};

export const glassLabel: CSSProperties = {
  fontFamily: GLASS_FONT,
  fontStyle: 'italic',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.24em',
  color: 'rgba(255,255,255,.85)',
};

/* ── Etykieta centralna statystyk ── */
export const glassStatCenter: CSSProperties = {
  ...glassBase,
  background: 'rgba(6,10,20,.6)',
  backdropFilter: 'blur(18px) saturate(160%)',
  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
  border: '1px solid rgba(255,255,255,.15)',
  borderTop: '1px solid rgba(255,255,255,.32)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,.2)',
};

export const glassStatCenterAccent: CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: 1.5,
  background: 'linear-gradient(90deg,#00B2FF,#F95F02)',
  opacity: .8,
};

/* ── Pigułki BO5 ── */
export const gamePillBlue: CSSProperties = {
  height: 10, width: 32,
  transform: 'skewX(-32deg)',
  background: 'linear-gradient(112deg,rgba(0,175,255,.9),rgba(25,95,240,.75))',
  border: '1px solid rgba(160,225,255,.6)',
};

export const gamePillOrange: CSSProperties = {
  ...gamePillBlue,
  background: 'linear-gradient(248deg,rgba(255,140,35,.9),rgba(235,75,0,.75))',
  border: '1px solid rgba(255,200,145,.6)',
};

export const gamePillEmpty: CSSProperties = {
  ...gamePillBlue,
  background: 'rgba(255,255,255,.08)',
  border: '1px solid rgba(255,255,255,.2)',
};

/* ── Helpers ── */
export function GlassSweep() {
  return <div style={glassSpecularSweep} aria-hidden />;
}

export const glassContentLayer: CSSProperties = {
  position: 'relative',
  zIndex: 2,
};