
-- =========================================
-- match_metadata (singleton, id = 1)
-- =========================================
CREATE TABLE public.match_metadata (
  id smallint PRIMARY KEY DEFAULT 1,
  match_guid text,
  timer text NOT NULL DEFAULT '5:00',
  time_seconds integer NOT NULL DEFAULT 300,
  blue_score integer NOT NULL DEFAULT 0,
  orange_score integer NOT NULL DEFAULT 0,
  is_overtime boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_metadata_singleton CHECK (id = 1)
);

ALTER TABLE public.match_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_metadata" ON public.match_metadata
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert match_metadata" ON public.match_metadata
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update match_metadata" ON public.match_metadata
  FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete match_metadata" ON public.match_metadata
  FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_match_metadata_updated_at
  BEFORE UPDATE ON public.match_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.match_metadata (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =========================================
-- players_live (PK = player_name)
-- =========================================
CREATE TABLE public.players_live (
  player_name text PRIMARY KEY,
  team_num smallint NOT NULL DEFAULT 0,
  boost smallint NOT NULL DEFAULT 0,
  speed real NOT NULL DEFAULT 0,
  goals smallint NOT NULL DEFAULT 0,
  assists smallint NOT NULL DEFAULT 0,
  saves smallint NOT NULL DEFAULT 0,
  shots smallint NOT NULL DEFAULT 0,
  demos smallint NOT NULL DEFAULT 0,
  is_demolished boolean NOT NULL DEFAULT false,
  is_supersonic boolean NOT NULL DEFAULT false,
  mmr integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX players_live_team_num_idx ON public.players_live (team_num);

ALTER TABLE public.players_live ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read players_live" ON public.players_live
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert players_live" ON public.players_live
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update players_live" ON public.players_live
  FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete players_live" ON public.players_live
  FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_players_live_updated_at
  BEFORE UPDATE ON public.players_live
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- active_camera (singleton, id = 1)
-- =========================================
CREATE TABLE public.active_camera (
  id smallint PRIMARY KEY DEFAULT 1,
  target_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT active_camera_singleton CHECK (id = 1)
);

ALTER TABLE public.active_camera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active_camera" ON public.active_camera
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert active_camera" ON public.active_camera
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update active_camera" ON public.active_camera
  FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete active_camera" ON public.active_camera
  FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_active_camera_updated_at
  BEFORE UPDATE ON public.active_camera
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.active_camera (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =========================================
-- players_registry (PK = player_name)
-- =========================================
CREATE TABLE public.players_registry (
  player_name text PRIMARY KEY,
  display_name text,
  photo_url text,
  country_code text,
  rank_name text,
  mmr integer,
  team_color text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.players_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read players_registry" ON public.players_registry
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert players_registry" ON public.players_registry
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update players_registry" ON public.players_registry
  FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete players_registry" ON public.players_registry
  FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER update_players_registry_updated_at
  BEFORE UPDATE ON public.players_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Realtime
-- =========================================
ALTER TABLE public.match_metadata REPLICA IDENTITY FULL;
ALTER TABLE public.players_live REPLICA IDENTITY FULL;
ALTER TABLE public.active_camera REPLICA IDENTITY FULL;
ALTER TABLE public.players_registry REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_metadata;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players_live;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_camera;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players_registry;
