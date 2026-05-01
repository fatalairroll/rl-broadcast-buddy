ALTER TABLE public.broadcast_sessions
  ADD COLUMN IF NOT EXISTS mmr_tournament_id text,
  ADD COLUMN IF NOT EXISTS mmr_match_id text,
  ADD COLUMN IF NOT EXISTS mmr_team_a_id text,
  ADD COLUMN IF NOT EXISTS mmr_team_b_id text,
  ADD COLUMN IF NOT EXISTS player_pairings jsonb NOT NULL DEFAULT '{}'::jsonb;