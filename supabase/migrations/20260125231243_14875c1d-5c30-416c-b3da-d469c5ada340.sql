-- ====================================
-- BROADCAST SESSIONS - Pełny dostęp publiczny (dev mode)
-- ====================================

-- Usuń wszystkie istniejące polityki
DROP POLICY IF EXISTS "Anyone can view active sessions" ON broadcast_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions (dev mode)" ON broadcast_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions (dev mode)" ON broadcast_sessions;
DROP POLICY IF EXISTS "Anyone can delete sessions (dev mode)" ON broadcast_sessions;

-- Nowe polityki - pełny dostęp dla anon i authenticated
CREATE POLICY "Public read sessions" ON broadcast_sessions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public insert sessions" ON broadcast_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public update sessions" ON broadcast_sessions
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Public delete sessions" ON broadcast_sessions
  FOR DELETE TO anon, authenticated USING (true);

-- ====================================
-- TEAMS - Pełny dostęp publiczny (dev mode)
-- ====================================

DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Anyone can insert teams (dev mode)" ON teams;
DROP POLICY IF EXISTS "Anyone can update teams (dev mode)" ON teams;
DROP POLICY IF EXISTS "Anyone can delete teams (dev mode)" ON teams;

CREATE POLICY "Public read teams" ON teams
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public insert teams" ON teams
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public update teams" ON teams
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Public delete teams" ON teams
  FOR DELETE TO anon, authenticated USING (true);

-- ====================================
-- OVERLAY PRESETS - Pełny dostęp publiczny (dev mode)
-- ====================================

DROP POLICY IF EXISTS "Anyone authenticated can view presets" ON overlay_presets;
DROP POLICY IF EXISTS "Anyone can insert presets (dev mode)" ON overlay_presets;
DROP POLICY IF EXISTS "Anyone can update presets (dev mode)" ON overlay_presets;
DROP POLICY IF EXISTS "Anyone can delete presets (dev mode)" ON overlay_presets;

CREATE POLICY "Public read presets" ON overlay_presets
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public insert presets" ON overlay_presets
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public update presets" ON overlay_presets
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Public delete presets" ON overlay_presets
  FOR DELETE TO anon, authenticated USING (true);