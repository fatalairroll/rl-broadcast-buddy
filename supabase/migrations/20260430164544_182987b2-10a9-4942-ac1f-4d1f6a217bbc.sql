-- Table for V2 overlay presets
CREATE TABLE public.overlay_presets_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overlay_presets_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read overlay_presets_v2"
  ON public.overlay_presets_v2 FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert overlay_presets_v2"
  ON public.overlay_presets_v2 FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update overlay_presets_v2"
  ON public.overlay_presets_v2 FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public delete overlay_presets_v2"
  ON public.overlay_presets_v2 FOR DELETE
  TO anon, authenticated
  USING (true);

-- updated_at trigger
CREATE TRIGGER overlay_presets_v2_set_updated_at
  BEFORE UPDATE ON public.overlay_presets_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link from broadcast session to V2 preset
ALTER TABLE public.broadcast_sessions
  ADD COLUMN overlay_v2_preset_id uuid REFERENCES public.overlay_presets_v2(id) ON DELETE SET NULL;

-- Seed default preset (config will be filled by app on first save; empty object is fine
-- because the V2 components fall back to defaultOverlayV2Config when fields are missing)
INSERT INTO public.overlay_presets_v2 (name, description, config, is_default)
VALUES ('Default V2', 'Domyślny wygląd overlaya V2 (skew -15°, gradient niebiesko-pomarańczowy)', '{}'::jsonb, true);