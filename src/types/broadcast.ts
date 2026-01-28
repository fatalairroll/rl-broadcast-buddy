export type AppRole = 'admin' | 'moderator';

export type SeriesType = 'bo1' | 'bo3' | 'bo5' | 'bo7';

export type EdgeStyle = 'rounded' | 'skewed' | 'sharp';

export type ElementShape = 
  | 'sharp'
  | 'rounded'
  | 'skewed'
  | 'pill'
  | 'hexagon'
  | 'parallelogram';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OverlayPreset {
  id: string;
  name: string;
  description?: string;
  config: OverlayConfig;
  thumbnail_url?: string;
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastSession {
  id: string;
  name: string;
  team_a_id?: string;
  team_b_id?: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_color: string;
  team_b_color: string;
  team_a_logo?: string;
  team_b_logo?: string;
  series_type: SeriesType;
  team_a_series_score: number;
  team_b_series_score: number;
  team_a_game_score: number;
  team_b_game_score: number;
  overlay_preset_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Element style configuration - shared by all editable elements
export interface ElementStyle {
  backgroundColor: string;
  backgroundGradient?: GradientConfig;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  opacity: number;
}

// Scoreboard sub-elements
export interface ScoreDisplayConfig extends ElementStyle {
  visible: boolean;
  gap: number; // gap between scores
  separatorColor: string;
  separatorWidth: number;
}

export interface TimerDisplayConfig extends ElementStyle {
  visible: boolean;
  showOvertimeLabel: boolean;
  overtimeLabelColor: string;
}

export interface SeriesDisplayConfig extends ElementStyle {
  visible: boolean;
  showSeriesType: boolean;
  dotSize: number;
  dotSpacing: number;
  activeDotColor: string;
  inactiveDotColor: string;
}

export interface TeamNameConfig extends ElementStyle {
  visible: boolean;
  maxWidth: number;
  showLogo: boolean;
  logoSize: number;
  logoPosition: 'left' | 'right';
}

// Overlay configuration types
export interface OverlayConfig {
  scoreboard: ScoreboardConfig;
  scoreDisplay: ScoreDisplayConfig;
  timerDisplay: TimerDisplayConfig;
  seriesDisplay: SeriesDisplayConfig;
  teamAName: TeamNameConfig;
  teamBName: TeamNameConfig;
  boostBars: BoostBarsConfig;
  boostCircle: BoostCircleConfig;
  playerStats: PlayerStatsConfig;
  general: GeneralConfig;
}

export interface ScoreboardConfig {
  visible: boolean;
  position: { x: number; y: number };
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: GradientConfig;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  gap: number;
  layout: 'horizontal' | 'compact';
  edgeStyle: EdgeStyle;
  shape: ElementShape;
}

export interface BoostBarsConfig {
  visible: boolean;
  position: 'bottom-corners' | 'bottom-center' | 'sides';
  verticalPosition: number; // 0-100, default 66 (2/3 screen)
  horizontalPadding: number;
  width: number;
  height: number;
  barHeight: number;
  boostBarWidth: number; // Fixed width for boost bar in px
  backgroundColor: string;
  backgroundGradient?: GradientConfig;
  borderRadius: number;
  edgeStyle: EdgeStyle;
  shape: ElementShape;
  showPlayerNames: boolean;
  showBoostValue: boolean;
  fontFamily: string;
  fontSize: number;
  teamAColor: string;
  teamBColor: string;
  animationSpeed: number;
}

export interface BoostCircleConfig {
  visible: boolean;
  position: { x: number; y: number };
  size: number;
  strokeWidth: number;
  backgroundColor: string;
  fillColor: string;
  showValue: boolean;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  animationSpeed: number;
}

export interface PlayerStatsConfig {
  visible: boolean;
  position: { x: number; y: number };
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: number;
  showGoals: boolean;
  showShots: boolean;
  showAssists: boolean;
  showSaves: boolean;
  showScore: boolean;
  fontFamily: string;
  fontSize: number;
  textColor: string;
}

export interface GeneralConfig {
  backgroundColor: string;
  animationsEnabled: boolean;
  transitionDuration: number;
}

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  enabled: boolean;
  type: 'linear' | 'radial';
  angle: number; // 0-360
  stops: GradientStop[];
}

// Game state from SOS Plugin
export interface GameState {
  players: PlayerState[];
  teams: TeamGameState;
  ball: BallState;
  game: GameInfo;
  target?: string;
}

export interface PlayerState {
  id: string;
  name: string;
  team: 0 | 1;
  boost: number;
  goals: number;
  shots: number;
  assists: number;
  saves: number;
  score: number;
  isPrimary: boolean;
}

export interface TeamGameState {
  blue: { score: number };
  orange: { score: number };
}

export interface BallState {
  speed: number;
  location: { x: number; y: number; z: number };
}

export interface GameInfo {
  time: number;
  isOT: boolean;
  hasTarget: boolean;
}

// Realtime broadcast events
export interface SetTeamsEvent {
  event: 'SET_TEAMS';
  payload: {
    session: BroadcastSession;
  };
}

export interface GameStateEvent {
  event: 'GAME_STATE';
  payload: GameState;
}

export type BroadcastEvent = SetTeamsEvent | GameStateEvent;

// Editable element types for Creator
export type EditableElement = 
  | 'scoreboard'
  | 'scoreDisplay'
  | 'timerDisplay'
  | 'seriesDisplay'
  | 'teamAName'
  | 'teamBName'
  | 'boostBars'
  | 'boostCircle'
  | 'playerStats';

export const ELEMENT_LABELS: Record<EditableElement, string> = {
  scoreboard: 'Tło Scoreboardu',
  scoreDisplay: 'Wynik meczu',
  timerDisplay: 'Timer / Czas',
  seriesDisplay: 'Wynik serii',
  teamAName: 'Nazwa drużyny A',
  teamBName: 'Nazwa drużyny B',
  boostBars: 'Paski boosta graczy',
  boostCircle: 'Wskaźnik boosta',
  playerStats: 'Statystyki gracza',
};

// Default element style
const defaultElementStyle: ElementStyle = {
  backgroundColor: 'rgba(15, 17, 23, 0.9)',
  borderRadius: 8,
  borderWidth: 0,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  padding: 8,
  fontFamily: 'Inter',
  fontSize: 16,
  textColor: '#ffffff',
  opacity: 1,
};

// Default overlay config
export const defaultOverlayConfig: OverlayConfig = {
  scoreboard: {
    visible: true,
    position: { x: 50, y: 2 },
    width: 700,
    height: 80,
    backgroundColor: 'rgba(15, 17, 23, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
    layout: 'horizontal',
    edgeStyle: 'rounded',
    shape: 'rounded',
  },
  scoreDisplay: {
    ...defaultElementStyle,
    visible: true,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 36,
    gap: 12,
    separatorColor: 'rgba(255, 255, 255, 0.3)',
    separatorWidth: 2,
  },
  timerDisplay: {
    ...defaultElementStyle,
    visible: true,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    padding: 8,
    fontSize: 20,
    fontFamily: 'JetBrains Mono',
    showOvertimeLabel: true,
    overtimeLabelColor: '#F59E0B',
  },
  seriesDisplay: {
    ...defaultElementStyle,
    visible: true,
    backgroundColor: 'transparent',
    borderRadius: 4,
    padding: 4,
    fontSize: 12,
    showSeriesType: true,
    dotSize: 8,
    dotSpacing: 4,
    activeDotColor: '#22C55E',
    inactiveDotColor: 'rgba(255, 255, 255, 0.2)',
  },
  teamAName: {
    ...defaultElementStyle,
    visible: true,
    backgroundColor: 'transparent',
    fontSize: 18,
    maxWidth: 150,
    showLogo: true,
    logoSize: 40,
    logoPosition: 'left',
  },
  teamBName: {
    ...defaultElementStyle,
    visible: true,
    backgroundColor: 'transparent',
    fontSize: 18,
    maxWidth: 150,
    showLogo: true,
    logoSize: 40,
    logoPosition: 'right',
  },
  boostBars: {
    visible: true,
    position: 'bottom-corners',
    verticalPosition: 66,
    horizontalPadding: 16,
    width: 200,
    height: 150,
    barHeight: 8,
    boostBarWidth: 100,
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
    borderRadius: 6,
    edgeStyle: 'rounded',
    shape: 'rounded',
    showPlayerNames: true,
    showBoostValue: true,
    fontFamily: 'Inter',
    fontSize: 14,
    teamAColor: '#3B82F6',
    teamBColor: '#F97316',
    animationSpeed: 150,
  },
  boostCircle: {
    visible: true,
    position: { x: 95, y: 85 },
    size: 100,
    strokeWidth: 8,
    backgroundColor: 'rgba(15, 17, 23, 0.8)',
    fillColor: '#3B82F6',
    showValue: true,
    fontFamily: 'JetBrains Mono',
    fontSize: 28,
    textColor: '#ffffff',
    animationSpeed: 100,
  },
  playerStats: {
    visible: true,
    position: { x: 5, y: 90 },
    width: 300,
    height: 60,
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
    borderRadius: 6,
    showGoals: true,
    showShots: true,
    showAssists: true,
    showSaves: true,
    showScore: true,
    fontFamily: 'Inter',
    fontSize: 12,
    textColor: '#ffffff',
  },
  general: {
    backgroundColor: 'transparent',
    animationsEnabled: true,
    transitionDuration: 150,
  },
};
