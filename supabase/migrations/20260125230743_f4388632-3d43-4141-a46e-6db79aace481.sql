-- ====================================
-- BROADCAST SESSIONS - Pełny dostęp bez logowania (dev mode)
-- ====================================

-- Usuń stare polityki
DROP POLICY IF EXISTS "Admins and moderators can insert sessions" ON broadcast_sessions;
DROP POLICY IF EXISTS "Admins and moderators can update sessions" ON broadcast_sessions;
DROP POLICY IF EXISTS "Admins can delete sessions" ON broadcast_sessions;

-- Nowe polityki z dostępem bez logowania
CREATE POLICY "Anyone can insert sessions (dev mode)"
  ON broadcast_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Anyone can update sessions (dev mode)"
  ON broadcast_sessions
  FOR UPDATE
  USING (
    auth.uid() IS NULL 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Anyone can delete sessions (dev mode)"
  ON broadcast_sessions
  FOR DELETE
  USING (
    auth.uid() IS NULL 
    OR is_admin(auth.uid())
  );

-- ====================================
-- TEAMS - Pełny dostęp bez logowania (dev mode)
-- ====================================

DROP POLICY IF EXISTS "Admins and moderators can insert teams" ON teams;
DROP POLICY IF EXISTS "Admins and moderators can update teams" ON teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;

CREATE POLICY "Anyone can insert teams (dev mode)"
  ON teams
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Anyone can update teams (dev mode)"
  ON teams
  FOR UPDATE
  USING (
    auth.uid() IS NULL 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Anyone can delete teams (dev mode)"
  ON teams
  FOR DELETE
  USING (
    auth.uid() IS NULL 
    OR is_admin(auth.uid())
  );

-- ====================================
-- OVERLAY PRESETS - Pełny dostęp bez logowania (dev mode)
-- ====================================

DROP POLICY IF EXISTS "Admins can insert presets" ON overlay_presets;
DROP POLICY IF EXISTS "Admins can update presets" ON overlay_presets;
DROP POLICY IF EXISTS "Admins can delete presets" ON overlay_presets;

CREATE POLICY "Anyone can insert presets (dev mode)"
  ON overlay_presets
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Anyone can update presets (dev mode)"
  ON overlay_presets
  FOR UPDATE
  USING (
    auth.uid() IS NULL 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Anyone can delete presets (dev mode)"
  ON overlay_presets
  FOR DELETE
  USING (
    auth.uid() IS NULL 
    OR is_admin(auth.uid())
  );