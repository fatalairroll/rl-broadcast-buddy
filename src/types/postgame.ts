export interface PostgamePlayer {
  player_name: string;
  team_num: 0 | 1;
  rank: number;
  score: number;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  demos: number;
  pad_pickups: number | null;
  supersonic_seconds: number | null;
  avg_boost: number | null;
  time_at_100_seconds: number | null;
}

export interface PostgameTeamStats {
  kickoff_goals_10s: number;
  saves: number;
  demos: number;
  avg_boost: number | null;
  pad_pickups: number;
}

export interface PostgamePair {
  rank: number;
  blue: PostgamePlayer;
  orange: PostgamePlayer;
}

export interface PostgamePayload {
  phase: 1 | 2;
  match_guid: string | null;
  finalized_at: string;
  blue_score: number;
  orange_score: number;
  team_names: { blue: string; orange: string };
  team: { blue: PostgameTeamStats; orange: PostgameTeamStats };
  pairs: PostgamePair[];
}

export interface PostgameState {
  postgame: PostgamePayload | null;
  connected: boolean;
  error: string | null;
}