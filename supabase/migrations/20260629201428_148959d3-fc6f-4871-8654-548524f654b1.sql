ALTER TABLE public.match_metadata
  ADD COLUMN IF NOT EXISTS last_event text,
  ADD COLUMN IF NOT EXISTS last_event_seq bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_winner_team_num smallint,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz;