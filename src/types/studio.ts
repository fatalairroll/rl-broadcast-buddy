export interface Tournament {
  tournament_id: string;
  name: string;
  mode: string;
  status: string;
  start_at: string;
  banner_url: string | null;
}

export interface PlayerData {
  discord_id: string;
  nick: string;
  nick_in_game?: string | null;
  rlstats_url?: string | null;
  avatar: string | null;
  mmr_1v1: number | null;
  mmr_2v2: number | null;
  mmr_3v3: number | null;
  rank_1v1: string | null;
  rank_2v2: string | null;
  rank_3v3: string | null;
}

export interface TeamData {
  team_id: string;
  name: string;
  avg_mmr: number;
  seed: number;
  players: PlayerData[];
  checked_in?: boolean;
  checked_in_at?: string | null;
}

export interface MatchData {
  match_id: string;
  round_index: number;
  match_index?: number;
  best_of: number;
  state: 'scheduled' | 'in_progress' | 'finished' | 'live' | 'done';
  score_a: number;
  score_b: number;
  winner_team_id: string | null;
  scheduled_at: string | null;
  team_a: TeamData | null;
  team_b: TeamData | null;
  started_at?: string | null;
  both_teams_checked_in?: boolean;
  pool_id?: string | null;
}

export interface TournamentResponse {
  tournaments: Tournament[];
}

export interface MatchResponse {
  tournament: {
    name: string;
    mode: string;
    status: string;
  };
  matches: MatchData[];
  pools?: PoolData[];
  use_pools?: boolean;
}

export interface PoolData {
  pool_id: string;
  index: number;
  size: number;
  winners_pool_id?: string | null;
}

export type StudioMode =
  | 'next_3'
  | 'bracket'
  | 'recent'
  | 'postgame'
  | 'postgame_players'
  | 'postgame_summary';

export type PollResults = Record<string, number>;
