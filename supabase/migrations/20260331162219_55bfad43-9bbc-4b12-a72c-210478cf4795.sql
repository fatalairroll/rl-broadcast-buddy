
CREATE TABLE public.game_state (
  id int8 PRIMARY KEY,
  timer text NOT NULL DEFAULT '5:00',
  score_a text NOT NULL DEFAULT '0',
  score_b text NOT NULL DEFAULT '0'
);

ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read game_state" ON public.game_state
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public update game_state" ON public.game_state
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Public insert game_state" ON public.game_state
  FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.game_state (id, timer, score_a, score_b)
  VALUES (1, '5:00', '0', '0');

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
