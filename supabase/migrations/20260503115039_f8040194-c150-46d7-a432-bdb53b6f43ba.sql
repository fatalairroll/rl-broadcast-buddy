CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_guid text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_results" ON public.match_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert match_results" ON public.match_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update match_results" ON public.match_results FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete match_results" ON public.match_results FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER trg_match_results_updated_at
  BEFORE UPDATE ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;
ALTER TABLE public.match_results REPLICA IDENTITY FULL;

ALTER TABLE public.players_live
  DROP COLUMN IF EXISTS is_on_ground,
  DROP COLUMN IF EXISTS last_goal_speed;