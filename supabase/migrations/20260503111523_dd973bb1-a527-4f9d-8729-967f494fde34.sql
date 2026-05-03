ALTER TABLE public.players_live
  ADD COLUMN IF NOT EXISTS is_on_ground boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_goal_speed real NOT NULL DEFAULT 0;