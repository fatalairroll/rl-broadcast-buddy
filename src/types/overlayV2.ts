import type { GlowConfig } from '@/lib/glow-utils';
import type { GradientConfig } from '@/lib/gradient-utils';
import { defaultGlow } from '@/lib/glow-utils';
import { defaultGradient } from '@/lib/gradient-utils';

export type AnchorH = 'left' | 'center' | 'right';
export type AnchorV = 'top' | 'middle' | 'bottom';

export interface PositionV2 {
  anchorH: AnchorH;
  anchorV: AnchorV;
  offsetX: number;
  offsetY: number;
}

export interface ScoreboardV2Style {
  visible: boolean;
  /** @deprecated use position. Kept for legacy presets. */
  topOffset?: number;
  position: PositionV2;
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
  fontSize: number;
  fontWeight: number;
  textColor: string;
  textShadow: string;      // raw CSS string
  // Fixed Box Model
  width: number;
  height: number;
  fontFamily: string;
  skewDeg: number;
  inheritParentSkew: boolean;
  /** Fine-tune offset from default position inside scoreboard row (px). */
  offsetX: number;
  offsetY: number;
}

export interface TimerStyle {
  background: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  paddingX: number;
  paddingY: number;
  showOvertimeLabel: boolean;
  overtimeLabelColor: string;
  glow: GlowConfig;
  /** When true, timer is rendered as its own absolute element using `position`. */
  detached: boolean;
  position: PositionV2;
  /** @deprecated legacy fine offsets, replaced by Position offsetX/Y. */
  boxOffsetX?: number;
  boxOffsetY?: number;
  textOffsetX?: number;
  textOffsetY?: number;
  // Fixed Box Model
  width: number;
  height: number;
  skewDeg: number;
  inheritParentSkew: boolean;
}

export interface BoostBarStatsToggle {
  goals: boolean;
  assists: boolean;
  saves: boolean;
  shots: boolean;
  demos: boolean;
}

export interface BoostBarV2Style {
  visible: boolean;
  width: number;             // total bar card width
  gap: number;               // px between bars in stack
  /** Fixed height of each player card in the boost stack. */
  cardHeight: number;
  /** Fixed height of the boost bar inside the card. */
  barHeight: number;
  /** @deprecated use positionLeft/positionRight. */
  sideOffset?: number;
  /** @deprecated use positionLeft/positionRight. */
  verticalAlign?: number;
  positionLeft: PositionV2;
  positionRight: PositionV2;
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
  /** @deprecated migrated to `stats`. */
  showStats?: boolean;
  stats: BoostBarStatsToggle;
  statsFontSize: number;
  statsColor: string;
  // Demolished tint
  demolishedColor: string;
}

export interface PlayerCardFieldsToggle {
  country: boolean;
  rank: boolean;
  mmrWatermark: boolean;
  photo: boolean;
}

export interface PlayerCardStatsToggle {
  goals: boolean;
  assists: boolean;
  saves: boolean;
  shots: boolean;
  demos: boolean;
  boost: boolean;
}

export interface PlayerCardV2Style {
  visible: boolean;
  /** @deprecated use position. */
  bottomOffset?: number;
  position: PositionV2;
  width: number;
  height: number;
  skewDeg: number;
  inheritParentSkew?: boolean;
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
  // Rank icon
  rankIconSize: number;
  rankOffsetX: number;
  rankOffsetY: number;
  // Nick offset (independent from font size so resizing nick doesn't move stats/photo).
  nickOffsetX: number;
  nickOffsetY: number;
  // Stats row offset (independent of nick/photo/rank).
  statsOffsetX: number;
  statsOffsetY: number;
  // Visibility toggles
  fields: PlayerCardFieldsToggle;
  stats: PlayerCardStatsToggle;
}

export interface GeneralV2Style {
  animationsEnabled: boolean;
  transitionDuration: number; // ms
  globalScale: number;        // 0.5..2.0
}

export type SeriesType = 'bo1' | 'bo3' | 'bo5' | 'bo7';

export interface SeriesScoreStyle {
  visible: boolean;
  position: PositionV2;
  dotSize: number;          // px diameter
  gap: number;              // px between dots
  groupGap: number;         // px between blue group / VS / orange group
  showLabel: boolean;       // 'BO5' label between groups
  labelColor: string;
  labelFontSize: number;
  fontFamily: string;
  blueColor: string;
  orangeColor: string;
  dimColor: string;
  borderColor: string;
  skewDeg: number;
  shape: 'circle' | 'square' | 'pill';
}

export type TeamNameShape = 'sharp' | 'rounded' | 'pill' | 'parallelogram' | 'hexagon';

export interface TeamNameStyle {
  visible: boolean;
  position: PositionV2;
  paddingX: number;
  paddingY: number;
  minWidth: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
  background: string;
  gradient: GradientConfig;
  shape: TeamNameShape;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  skewDeg: number;
  glow: GlowConfig;
  opacity: number;
  maxChars: number; // 0 = unlimited
  uppercase: boolean;
  /** @deprecated legacy fine offsets, replaced by Position offsetX/Y. */
  offsetX?: number;
  offsetY?: number;
  /** When true, position is computed relative to scoreboard edges. */
  attachToScoreboard: boolean;
  attachOffsetX: number;
  attachOffsetY: number;
}

export interface OverlayV2Config {
  scoreboard: ScoreboardV2Style;
  scoreBlue: ScoreSideStyle;
  scoreOrange: ScoreSideStyle;
  timer: TimerStyle;
  boostBar: BoostBarV2Style;
  playerCard: PlayerCardV2Style;
  seriesScore: SeriesScoreStyle;
  teamNameBlue: TeamNameStyle;
  teamNameOrange: TeamNameStyle;
  general: GeneralV2Style;
}

export type V2EditableElement =
  | 'scoreboard'
  | 'scoreBlue'
  | 'scoreOrange'
  | 'timer'
  | 'boostBar'
  | 'playerCard'
  | 'seriesScore'
  | 'teamNameBlue'
  | 'teamNameOrange'
  | 'general';

export const V2_ELEMENT_LABELS: Record<V2EditableElement, string> = {
  scoreboard: 'Scoreboard (kontener)',
  scoreBlue: 'Wynik niebieskich',
  scoreOrange: 'Wynik pomarańczowych',
  timer: 'Timer',
  boostBar: 'Paski boosta graczy',
  playerCard: 'Karta aktywnego gracza',
  seriesScore: 'Wynik serii (BO)',
  teamNameBlue: 'Nazwa drużyny niebieskiej',
  teamNameOrange: 'Nazwa drużyny pomarańczowej',
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
    // anchorV:'top' means the TOP edge of the element is anchored at this offset
    // from screen center (0,0). Default scoreboard sits ~516px above center → top edge near y=24.
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -516 },
    gap: 0,
    fontFamily: 'Rajdhani, sans-serif',
    opacity: 1,
    skewDeg: -15,
  },
  scoreBlue: {
    gradient: defaultGradient(BLUE_FROM, BLUE_TO),
    glow: { ...defaultGlow, enabled: true, color: BLUE_GLOW, blur: 32, intensity: 0.55 },
    paddingX: 40,
    paddingY: 16,
    fontSize: 60,
    fontWeight: 900,
    textColor: '#ffffff',
    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
    width: 140,
    height: 100,
    fontFamily: 'Rajdhani, sans-serif',
    skewDeg: -15,
    inheritParentSkew: true,
    offsetX: 0,
    offsetY: 0,
  },
  scoreOrange: {
    gradient: defaultGradient(ORANGE_FROM, ORANGE_TO),
    glow: { ...defaultGlow, enabled: true, color: ORANGE_GLOW, blur: 32, intensity: 0.55 },
    paddingX: 40,
    paddingY: 16,
    fontSize: 60,
    fontWeight: 900,
    textColor: '#ffffff',
    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
    width: 140,
    height: 100,
    fontFamily: 'Rajdhani, sans-serif',
    skewDeg: -15,
    inheritParentSkew: true,
    offsetX: 0,
    offsetY: 0,
  },
  timer: {
    background: 'rgba(0,0,0,0.85)',
    fontFamily: 'Rajdhani, sans-serif',
    fontSize: 50,
    textColor: '#ffffff',
    paddingX: 48,
    paddingY: 16,
    showOvertimeLabel: true,
    overtimeLabelColor: 'hsl(48 100% 60%)',
    glow: { ...defaultGlow, enabled: false },
    detached: false,
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -516 },
    boxOffsetX: 0,
    boxOffsetY: 0,
    textOffsetX: 0,
    textOffsetY: 0,
    width: 220,
    height: 100,
    skewDeg: -15,
    inheritParentSkew: true,
  },
  boostBar: {
    visible: true,
    width: 300,
    gap: 12,
    cardHeight: 72,
    barHeight: 8,
    // anchorH:'left' → element's LEFT edge anchored at offsetX from screen center.
    // -928 = 32px from screen left (1920/2 - 32).
    positionLeft: { anchorH: 'left', anchorV: 'middle', offsetX: -928, offsetY: 0 },
    positionRight: { anchorH: 'right', anchorV: 'middle', offsetX: 928, offsetY: 0 },
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
    stats: { goals: true, assists: true, saves: true, shots: false, demos: false },
    statsFontSize: 11,
    statsColor: 'rgba(255,255,255,0.85)',
    demolishedColor: '#ef4444',
  },
  playerCard: {
    visible: true,
    // anchorV:'bottom' → bottom edge anchored at offsetY (positive = below center).
    // 480 = 60px from screen bottom (1080/2 - 60).
    position: { anchorH: 'center', anchorV: 'bottom', offsetX: 0, offsetY: 480 },
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
    rankIconSize: 36,
    rankOffsetX: 0,
    rankOffsetY: 0,
    nickOffsetX: 0,
    nickOffsetY: 0,
    statsOffsetX: 0,
    statsOffsetY: 0,
    fields: { country: true, rank: true, mmrWatermark: true, photo: true },
    stats: { goals: true, assists: true, saves: true, shots: false, demos: true, boost: true },
  },
  seriesScore: {
    visible: true,
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -440 },
    dotSize: 18,
    gap: 8,
    groupGap: 24,
    showLabel: true,
    labelColor: '#ffffff',
    labelFontSize: 16,
    fontFamily: 'Rajdhani, sans-serif',
    blueColor: BLUE_GLOW,
    orangeColor: ORANGE_GLOW,
    dimColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)',
    skewDeg: -15,
    shape: 'circle',
  },
  teamNameBlue: {
    visible: true,
    position: { anchorH: 'right', anchorV: 'top', offsetX: -210, offsetY: -516 },
    paddingX: 28,
    paddingY: 16,
    minWidth: 220,
    width: 320,
    height: 80,
    fontFamily: 'Rajdhani, sans-serif',
    fontSize: 36,
    fontWeight: 700,
    textColor: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
    background: BLUE_FROM,
    gradient: defaultGradient(BLUE_FROM, BLUE_TO),
    shape: 'parallelogram',
    borderRadius: 0,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 0,
    skewDeg: -15,
    glow: { ...defaultGlow, enabled: true, color: BLUE_GLOW, blur: 24, intensity: 0.4 },
    opacity: 1,
    maxChars: 0,
    uppercase: true,
    offsetX: 0,
    offsetY: 0,
    attachToScoreboard: false,
    attachOffsetX: 0,
    attachOffsetY: 0,
  },
  teamNameOrange: {
    visible: true,
    position: { anchorH: 'left', anchorV: 'top', offsetX: 210, offsetY: -516 },
    paddingX: 28,
    paddingY: 16,
    minWidth: 220,
    width: 320,
    height: 80,
    fontFamily: 'Rajdhani, sans-serif',
    fontSize: 36,
    fontWeight: 700,
    textColor: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
    background: ORANGE_FROM,
    gradient: defaultGradient(ORANGE_FROM, ORANGE_TO),
    shape: 'parallelogram',
    borderRadius: 0,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 0,
    skewDeg: -15,
    glow: { ...defaultGlow, enabled: true, color: ORANGE_GLOW, blur: 24, intensity: 0.4 },
    opacity: 1,
    maxChars: 0,
    uppercase: true,
    offsetX: 0,
    offsetY: 0,
    attachToScoreboard: false,
    attachOffsetX: 0,
    attachOffsetY: 0,
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
  const sb = { ...defaultOverlayV2Config.scoreboard, ...(p.scoreboard ?? {}) } as ScoreboardV2Style;
  if (!(p.scoreboard as any)?.position && (p.scoreboard as any)?.topOffset != null) {
    sb.position = { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -540 + (p.scoreboard as any).topOffset };
  }
  const tm = { ...defaultOverlayV2Config.timer, ...(p.timer ?? {}) } as TimerStyle;
  tm.boxOffsetX = tm.boxOffsetX ?? 0;
  tm.boxOffsetY = tm.boxOffsetY ?? 0;
  tm.textOffsetX = tm.textOffsetX ?? 0;
  tm.textOffsetY = tm.textOffsetY ?? 0;
  tm.width = tm.width ?? defaultOverlayV2Config.timer.width;
  tm.height = tm.height ?? defaultOverlayV2Config.timer.height;
  tm.skewDeg = tm.skewDeg ?? defaultOverlayV2Config.timer.skewDeg;
  tm.inheritParentSkew = tm.inheritParentSkew ?? true;
  const bb = { ...defaultOverlayV2Config.boostBar, ...(p.boostBar ?? {}) } as BoostBarV2Style;
  bb.cardHeight = bb.cardHeight ?? defaultOverlayV2Config.boostBar.cardHeight;
  bb.barHeight = bb.barHeight ?? defaultOverlayV2Config.boostBar.barHeight;
  const legacySide = (p.boostBar as any)?.sideOffset;
  const legacyVA = (p.boostBar as any)?.verticalAlign;
  if (!(p.boostBar as any)?.positionLeft && (legacySide != null || legacyVA != null)) {
    const off = legacySide ?? 32;
    const vy = legacyVA != null ? ((legacyVA - 50) / 100) * 1080 : 0;
    bb.positionLeft = { anchorH: 'left', anchorV: 'middle', offsetX: -960 + off, offsetY: vy };
  }
  if (!(p.boostBar as any)?.positionRight && (legacySide != null || legacyVA != null)) {
    const off = legacySide ?? 32;
    const vy = legacyVA != null ? ((legacyVA - 50) / 100) * 1080 : 0;
    bb.positionRight = { anchorH: 'right', anchorV: 'middle', offsetX: 960 - off, offsetY: vy };
  }
  // Migrate old boostBar.showStats → stats toggles
  if (!(p.boostBar as any)?.stats && (p.boostBar as any)?.showStats !== undefined) {
    const on = (p.boostBar as any).showStats === true;
    bb.stats = { goals: on, assists: on, saves: on, shots: false, demos: false };
  } else if (!bb.stats) {
    bb.stats = { ...defaultOverlayV2Config.boostBar.stats };
  }
  const pc = { ...defaultOverlayV2Config.playerCard, ...(p.playerCard ?? {}) } as PlayerCardV2Style;
  if (!(p.playerCard as any)?.position && (p.playerCard as any)?.bottomOffset != null) {
    pc.position = { anchorH: 'center', anchorV: 'bottom', offsetX: 0, offsetY: 540 - (p.playerCard as any).bottomOffset };
  }
  if (!pc.fields) pc.fields = { ...defaultOverlayV2Config.playerCard.fields };
  if (!pc.stats) pc.stats = { ...defaultOverlayV2Config.playerCard.stats };
  pc.inheritParentSkew = pc.inheritParentSkew ?? false;
  const ss = { ...defaultOverlayV2Config.seriesScore, ...((p as any).seriesScore ?? {}) } as SeriesScoreStyle;
  const tnb = { ...defaultOverlayV2Config.teamNameBlue, ...((p as any).teamNameBlue ?? {}) } as TeamNameStyle;
  const tno = { ...defaultOverlayV2Config.teamNameOrange, ...((p as any).teamNameOrange ?? {}) } as TeamNameStyle;
  for (const tn of [tnb, tno]) {
    tn.width = tn.width ?? defaultOverlayV2Config.teamNameBlue.width;
    tn.height = tn.height ?? defaultOverlayV2Config.teamNameBlue.height;
    tn.attachToScoreboard = tn.attachToScoreboard ?? false;
    tn.attachOffsetX = tn.attachOffsetX ?? 0;
    tn.attachOffsetY = tn.attachOffsetY ?? 0;
  }
  // Score sides backfill
  const sblue = { ...defaultOverlayV2Config.scoreBlue, ...(p.scoreBlue ?? {}) } as ScoreSideStyle;
  const sorange = { ...defaultOverlayV2Config.scoreOrange, ...(p.scoreOrange ?? {}) } as ScoreSideStyle;
  for (const ss2 of [sblue, sorange]) {
    ss2.width = ss2.width ?? 140;
    ss2.height = ss2.height ?? 100;
    ss2.fontFamily = ss2.fontFamily ?? sb.fontFamily ?? 'Rajdhani, sans-serif';
    ss2.skewDeg = ss2.skewDeg ?? sb.skewDeg ?? -15;
    ss2.inheritParentSkew = ss2.inheritParentSkew ?? true;
  }
  return {
    scoreboard: sb,
    scoreBlue: sblue,
    scoreOrange: sorange,
    timer: tm,
    boostBar: bb,
    playerCard: pc,
    seriesScore: ss,
    teamNameBlue: tnb,
    teamNameOrange: tno,
    general: { ...defaultOverlayV2Config.general, ...(p.general ?? {}) },
  };
}
