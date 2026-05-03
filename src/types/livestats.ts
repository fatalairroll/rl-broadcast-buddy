export interface MatchMetadata {
  id: number;
  match_guid: string | null;
  timer: string;
  time_seconds: number;
  blue_score: number;
  orange_score: number;
  is_overtime: boolean;
  updated_at: string;
  is_active?: boolean;
}

export interface PlayerLive {
  player_name: string;
  team_num: number; // 0 = blue, 1 = orange
  boost: number;
  speed: number;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  demos: number;
  is_demolished: boolean;
  is_supersonic: boolean;
  mmr: number | null;
  updated_at: string;
}

export interface ActiveCamera {
  id: number;
  target_name: string | null;
  updated_at: string;
}

export interface PlayerRegistry {
  player_name: string;
  display_name: string | null;
  photo_url: string | null;
  country_code: string | null;
  rank_name: string | null;
  mmr: number | null;
  team_color: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Winner {
  player_name: string;
  value: number;
  unit?: string;
}

export interface PostMatchWinners {
  fastestShot: Winner | null;
  mostDemos: Winner | null;
  mostAir: Winner | null;
  mostGround: Winner | null;
  fastestAvg: Winner | null;
  mostSupersonic: Winner | null;
}