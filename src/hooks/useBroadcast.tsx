import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BroadcastSession, GameState, OverlayPreset, Team, SeriesType } from '@/types/broadcast';

const BROADCAST_CHANNEL = 'rl_broadcast_room';

export function useBroadcast(sessionId?: string) {
  const [session, setSession] = useState<BroadcastSession | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      // Get the most recent active session
      const { data, error } = await supabase
        .from('broadcast_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setSession(data as unknown as BroadcastSession);
      }
    } else {
      const { data, error } = await supabase
        .from('broadcast_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSession(data as unknown as BroadcastSession);
    }
    setLoading(false);
  }, [sessionId]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchSession();

    // Subscribe to broadcast channel for game state
    const channel = supabase.channel(BROADCAST_CHANNEL);

    channel
      .on('broadcast', { event: 'GAME_STATE' }, (payload) => {
        setGameState(payload.payload as GameState);
      })
      .on('broadcast', { event: 'SET_TEAMS' }, (payload) => {
        setSession(payload.payload.session as BroadcastSession);
      })
      .subscribe();

    // Subscribe to database changes for session updates
    const dbChannel = supabase
      .channel('session_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_sessions',
          filter: sessionId ? `id=eq.${sessionId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSession(payload.new as unknown as BroadcastSession);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [fetchSession, sessionId]);

  // Update session
  const updateSession = useCallback(
    async (updates: Partial<BroadcastSession>) => {
      if (!session?.id) return { error: new Error('No session') };

      const { error } = await supabase
        .from('broadcast_sessions')
        .update(updates)
        .eq('id', session.id);

      if (error) return { error };

      // Broadcast the update
      await supabase.channel(BROADCAST_CHANNEL).send({
        type: 'broadcast',
        event: 'SET_TEAMS',
        payload: { session: { ...session, ...updates } },
      });

      return { error: null };
    },
    [session]
  );

  // Create new session
  const createSession = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from('broadcast_sessions')
      .insert({ name })
      .select()
      .single();

    if (error) return { error, session: null };

    setSession(data as unknown as BroadcastSession);
    return { error: null, session: data as unknown as BroadcastSession };
  }, []);

  // Score controls
  const incrementTeamASeriesScore = () =>
    updateSession({ team_a_series_score: (session?.team_a_series_score || 0) + 1 });
  const decrementTeamASeriesScore = () =>
    updateSession({ team_a_series_score: Math.max(0, (session?.team_a_series_score || 0) - 1) });
  const incrementTeamBSeriesScore = () =>
    updateSession({ team_b_series_score: (session?.team_b_series_score || 0) + 1 });
  const decrementTeamBSeriesScore = () =>
    updateSession({ team_b_series_score: Math.max(0, (session?.team_b_series_score || 0) - 1) });

  const resetGameScore = () =>
    updateSession({ team_a_game_score: 0, team_b_game_score: 0 });

  return {
    session,
    gameState,
    loading,
    error,
    updateSession,
    createSession,
    incrementTeamASeriesScore,
    decrementTeamASeriesScore,
    incrementTeamBSeriesScore,
    decrementTeamBSeriesScore,
    resetGameScore,
    refetch: fetchSession,
  };
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      setTeams((data as unknown as Team[]) || []);
      setLoading(false);
    };
    fetchTeams();
  }, []);

  const createTeam = async (team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();
    
    if (data) {
      setTeams((prev) => [...prev, data as unknown as Team]);
    }
    return { data: data as unknown as Team | null, error };
  };

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id);
    
    if (!error) {
      setTeams((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    }
    return { error };
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) {
      setTeams((prev) => prev.filter((t) => t.id !== id));
    }
    return { error };
  };

  return { teams, loading, createTeam, updateTeam, deleteTeam };
}

export function useOverlayPresets() {
  const [presets, setPresets] = useState<OverlayPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresets = async () => {
      const { data } = await supabase
        .from('overlay_presets')
        .select('*')
        .order('name');
      setPresets((data as unknown as OverlayPreset[]) || []);
      setLoading(false);
    };
    fetchPresets();
  }, []);

  const createPreset = async (preset: Omit<OverlayPreset, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('overlay_presets')
      .insert([{
        name: preset.name,
        description: preset.description || null,
        config: JSON.parse(JSON.stringify(preset.config)),
        thumbnail_url: preset.thumbnail_url || null,
        is_default: preset.is_default ?? false,
        created_by: preset.created_by || null,
      }])
      .select()
      .single();
    
    if (data) {
      setPresets((prev) => [...prev, data as unknown as OverlayPreset]);
    }
    return { data: data as unknown as OverlayPreset | null, error };
  };

  const updatePreset = async (id: string, updates: Partial<OverlayPreset>) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.config !== undefined) updateData.config = JSON.parse(JSON.stringify(updates.config));
    if (updates.thumbnail_url !== undefined) updateData.thumbnail_url = updates.thumbnail_url;
    if (updates.is_default !== undefined) updateData.is_default = updates.is_default;

    const { error } = await supabase
      .from('overlay_presets')
      .update(updateData)
      .eq('id', id);
    
    if (!error) {
      setPresets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    }
    return { error };
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from('overlay_presets').delete().eq('id', id);
    if (!error) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    }
    return { error };
  };

  return { presets, loading, createPreset, updatePreset, deletePreset };
}
