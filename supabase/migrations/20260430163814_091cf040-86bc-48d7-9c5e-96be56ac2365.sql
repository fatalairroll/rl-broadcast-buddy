ALTER TABLE public.broadcast_sessions DROP COLUMN IF EXISTS overlay_preset_id;
DROP TABLE IF EXISTS public.overlay_presets CASCADE;