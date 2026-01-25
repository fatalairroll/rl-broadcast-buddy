export type AppRole = 'admin' | 'moderator';

export type SeriesType = 'bo1' | 'bo3' | 'bo5' | 'bo7';

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

// Overlay configuration types
export interface OverlayConfig {
  scoreboard: ScoreboardConfig;
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
  fontFamily: string;
  fontSize: number;
  textColor: string;
  showTimer: boolean;
  showSeriesScore: boolean;
}

export interface BoostBarsConfig {
  visible: boolean;
  position: 'bottom-corners' | 'bottom-center' | 'sides';
  width: number;
  height: number;
  barHeight: number;
  backgroundColor: string;
  borderRadius: number;
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

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number;
  stops: { color: string; position: number }[];
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

// Default overlay config
export const defaultOverlayConfig: OverlayConfig = {
  scoreboard: {
    visible: true,
    position: { x: 50, y: 2 },
    width: 600,
    height: 80,
    backgroundColor: 'rgba(15, 17, 23, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontFamily: 'Inter',
    fontSize: 24,
    textColor: '#ffffff',
    showTimer: true,
    showSeriesScore: true,
  },
  boostBars: {
    visible: true,
    position: 'bottom-corners',
    width: 200,
    height: 150,
    barHeight: 8,
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
    borderRadius: 6,
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
