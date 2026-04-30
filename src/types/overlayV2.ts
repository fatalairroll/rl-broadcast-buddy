import type { GlowConfig } from '@/lib/glow-utils';
import type { GradientConfig } from '@/lib/gradient-utils';
import { defaultGlow } from '@/lib/glow-utils';
import { defaultGradient } from '@/lib/gradient-utils';

export interface ScoreboardV2Style {
  visible: boolean;
  topOffset: number;       // px from top
  gap: number;             // px between blue / timer / orange
  fontFamily: string;
  opacity: number;
  // shared
  skewDeg: number;         // default -15
}

export interface ScoreSideStyle {
  gradient: GradientConfig;
  glow: GlowConfig;
  paddingX: number;
  paddingY: number;
  minWidth: number;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  textShadow: string;      // raw CSS string
}

export interface TimerStyle {
  background: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  paddingX: number;
  paddingY: number;
  minWidth: number;
  showOvertimeLabel: boolean;
  overtimeLabelColor: string;
  glow: GlowConfig;
}

export interface BoostBarV2Style {
  visible: boolean;
  width: number;             // total bar card width
  gap: number;               // px between bars in stack
  sideOffset: number;        // px from left/right edge
  verticalAlign: number;     // 0..100, % of screen height of stack center
  background: string;
  borderColor: string;
  paddingX: number;
  paddingY: number;
  skewDeg: number;
  // Team gradients
  blueFrom: string;
  blueTo: string;
  blueGlow: string;
  orangeFrom: string;
  orangeTo: string;
  orangeGlow: string;
  supersonicColor: string;
  // Typography
  nameFontFamily: string;
  nameFontSize: number;
  nameColor: string;
  boostFontSize: number;
  // Mini-stats row
  showStats: boolean;
  statsFontSize: number;
  statsColor: string;
  // Demolished tint
  demolishedColor: string;
}

export interface PlayerCardV2Style {
  visible: boolean;
  bottomOffset: number;
  width: number;
  height: number;
  skewDeg: number;
  borderColor: string;
  borderWidth: number;
  // Team color fallbacks (used when registry.team_color missing)
  blueGradient: GradientConfig;
  orangeGradient: GradientConfig;
  glow: GlowConfig;
  // MMR watermark
  mmrFontSize: number;
  mmrFontFamily: string;
  mmrColor: string;
  mmrOpacity: number;
  // Photo
  photoWidth: number;
  // Nick
  nickFontFamily: string;
  nickFontSize: number;
  nickColor: string;
  // Stats row
  statsFontSize: number;
  statsColor: string;
  // Country chip
  countryBg: string;
  countryColor: string;
}

export interface GeneralV2Style {
  animationsEnabled: boolean;
  transitionDuration: number; // ms
  globalScale: number;        // 0.5..2.0
}

export interface OverlayV2Config {
  scoreboard: ScoreboardV2Style;
  scoreBlue: ScoreSideStyle;
  scoreOrange: ScoreSideStyle;
  timer: TimerStyle;
  boostBar: BoostBarV2Style;
  playerCard: PlayerCardV2Style;
  general: GeneralV2Style;
}

export type V2EditableElement =
  | 'scoreboard'
  | 'scoreBlue'
  | 'scoreOrange'
  | 'timer'
  | 'boostBar'
  | 'playerCard'
  | 'general';

export const V2_ELEMENT_LABELS: Record<V2EditableElement, string> = {
  scoreboard: 'Scoreboard (kontener)',
  scoreBlue: 'Wynik niebieskich',
  scoreOrange: 'Wynik pomarańczowych',
  timer: 'Timer',
  boostBar: 'Paski boosta graczy',
  playerCard: 'Karta aktywnego gracza',
  general: 'Ogólne',
};

const BLUE_FROM = 'hsl(217 91% 35%)';
const BLUE_TO = 'hsl(217 91% 55%)';
const BLUE_GLOW = 'hsl(217 91% 60%)';
const ORANGE_FROM = 'hsl(24 95% 45%)';
const ORANGE_TO = 'hsl(24 95% 60%)';
const ORANGE_GLOW = 'hsl(24 95% 60%)';

export const defaultOverlayV2Config: OverlayV2Config = {
  scoreboard: {
    visible: true,
    topOffset: 24,
    gap: 8,
    fontFamily: 'Rajdhani, sans-serif',
    opacity: 1,
    skewDeg: -15,
  },
  scoreBlue: {
    gradient: defaultGradient(BLUE_FROM, BLUE_TO),
    glow: { ...defaultGlow, enabled: true, color: BLUE_GLOW, blur: 32, intensity: 0.55 },
    paddingX: 40,
    paddingY: 16,
    minWidth: 160,
    fontSize: 60,
    fontWeight: 900,
    textColor: '#ffffff',
    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
  },
  scoreOrange: {
    gradient: defaultGradient(ORANGE_FROM, ORANGE_TO),
    glow: { ...defaultGlow, enabled: true, color: ORANGE_GLOW, blur: 32, intensity: 0.55 },
    paddingX: 40,
    paddingY: 16,
    minWidth: 160,
    fontSize: 60,
    fontWeight: 900,
    textColor: '#ffffff',
    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
  },
  timer: {
    background: 'rgba(0,0,0,0.85)',
    fontFamily: 'Rajdhani, sans-serif',
    fontSize: 50,
    textColor: '#ffffff',
    paddingX: 48,
    paddingY: 16,
    minWidth: 220,
    showOvertimeLabel: true,
    overtimeLabelColor: 'hsl(48 100% 60%)',
    glow: { ...defaultGlow, enabled: false },
  },
  boostBar: {
    visible: true,
    width: 300,
    gap: 12,
    sideOffset: 32,
    verticalAlign: 50,
    background: 'rgba(0,0,0,0.8)',
    borderColor: 'rgba(255,255,255,0.1)',
    paddingX: 12,
    paddingY: 8,
    skewDeg: -15,
    blueFrom: 'hsl(217 91% 45%)',
    blueTo: 'hsl(217 91% 65%)',
    blueGlow: BLUE_GLOW,
    orangeFrom: 'hsl(24 95% 50%)',
    orangeTo: 'hsl(24 95% 65%)',
    orangeGlow: ORANGE_GLOW,
    supersonicColor: 'hsl(48 100% 65%)',
    nameFontFamily: 'Rajdhani, sans-serif',
    nameFontSize: 16,
    nameColor: '#ffffff',
    boostFontSize: 18,
    showStats: true,
    statsFontSize: 11,
    statsColor: 'rgba(255,255,255,0.85)',
    demolishedColor: '#ef4444',
  },
  playerCard: {
    visible: true,
    bottomOffset: 60,
    width: 640,
    height: 160,
    skewDeg: -15,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    blueGradient: defaultGradient('hsl(217 91% 22%)', 'hsl(217 91% 38%)'),
    orangeGradient: defaultGradient('hsl(24 95% 28%)', 'hsl(24 95% 45%)'),
    glow: { ...defaultGlow, enabled: true, color: BLUE_GLOW, blur: 48, intensity: 0.5 },
    mmrFontSize: 98,
    mmrFontFamily: 'Rajdhani, sans-serif',
    mmrColor: 'rgba(255,255,255,0.07)',
    mmrOpacity: 1,
    photoWidth: 160,
    nickFontFamily: 'Rajdhani, sans-serif',
    nickFontSize: 30,
    nickColor: '#ffffff',
    statsFontSize: 22,
    statsColor: '#ffffff',
    countryBg: 'rgba(0,0,0,0.4)',
    countryColor: '#ffffff',
  },
  general: {
    animationsEnabled: true,
    transitionDuration: 350,
    globalScale: 1,
  },
};

/** Deep-merge incoming partial config (from DB) onto defaults so missing keys
 * never explode the renderer. */
export function mergeV2Config(partial: unknown): OverlayV2Config {
  if (!partial || typeof partial !== 'object') return defaultOverlayV2Config;
  const p = partial as Partial<OverlayV2Config>;
  return {
    scoreboard: { ...defaultOverlayV2Config.scoreboard, ...(p.scoreboard ?? {}) },
    scoreBlue: { ...defaultOverlayV2Config.scoreBlue, ...(p.scoreBlue ?? {}) },
    scoreOrange: { ...defaultOverlayV2Config.scoreOrange, ...(p.scoreOrange ?? {}) },
    timer: { ...defaultOverlayV2Config.timer, ...(p.timer ?? {}) },
    boostBar: { ...defaultOverlayV2Config.boostBar, ...(p.boostBar ?? {}) },
    playerCard: { ...defaultOverlayV2Config.playerCard, ...(p.playerCard ?? {}) },
    general: { ...defaultOverlayV2Config.general, ...(p.general ?? {}) },
  };
}
