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
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  mmr_tournament_id?: string | null;
  mmr_match_id?: string | null;
  mmr_team_a_id?: string | null;
  mmr_team_b_id?: string | null;
  player_pairings?: Record<string, { discord_id: string; status: 'auto' | 'manual' | 'none' }> | null;
  series_auto_enabled?: boolean;
}

// Game state from SOS Plugin (still used by useBroadcast realtime channel)
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
  demos: number;
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
