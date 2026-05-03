ALTER TABLE public.match_metadata ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
UPDATE public.match_metadata SET is_active = true WHERE id = 1;