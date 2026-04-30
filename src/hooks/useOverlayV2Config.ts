import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultOverlayV2Config, mergeV2Config, type OverlayV2Config } from '@/types/overlayV2';

export interface OverlayV2Preset {
  id: string;
  name: string;
  description: string | null;
  config: OverlayV2Config;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PresetRow {
  id: string;
  name: string;
  description: string | null;
  config: unknown;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const TABLE = 'overlay_presets_v2' as const;

function rowToPreset(row: PresetRow): OverlayV2Preset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    config: mergeV2Config(row.config),
    is_default: row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Reads the active V2 config: preset linked to the active broadcast session,
 * else the is_default preset, else hardcoded defaults. Realtime-aware. */
export function useActiveV2Config() {
  const [config, setConfig] = useState<OverlayV2Config>(defaultOverlayV2Config);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolve = async () => {
      // 1. Look for active session and its overlay_v2_preset_id
      const { data: sess } = await supabase
        .from('broadcast_sessions')
        .select('overlay_v2_preset_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionPresetId = (sess as any)?.overlay_v2_preset_id ?? null;

      let row: PresetRow | null = null;

      if (sessionPresetId) {
        const { data } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(TABLE as any)
          .select('*')
          .eq('id', sessionPresetId)
          .maybeSingle();
        row = (data as unknown as PresetRow) ?? null;
      }

      if (!row) {
        const { data } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(TABLE as any)
          .select('*')
          .eq('is_default', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        row = (data as unknown as PresetRow) ?? null;
      }

      if (!mounted) return;

      if (row) {
        setPresetId(row.id);
        setConfig(mergeV2Config(row.config));
      } else {
        setPresetId(null);
        setConfig(defaultOverlayV2Config);
      }
      setLoading(false);
    };

    resolve();

    // Realtime: re-resolve on any preset or session change
    const ch = supabase
      .channel('overlay-v2-config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overlay_presets_v2' },
        () => resolve(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'broadcast_sessions' },
        () => resolve(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return { config, presetId, loading };
}

/** CRUD for presets (used by Creator). */
export function useV2Presets() {
  const [presets, setPresets] = useState<OverlayV2Preset[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    const { data } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .select('*')
      .order('created_at', { ascending: true });
    setPresets(((data ?? []) as unknown as PresetRow[]).map(rowToPreset));
    setLoading(false);
  };

  useEffect(() => {
    refetch();
    const ch = supabase
      .channel('v2-presets-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overlay_presets_v2' },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const createPreset = async (name: string, config: OverlayV2Config, description?: string) => {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .insert([{ name, description: description ?? null, config: config as unknown as Record<string, unknown>, is_default: false }])
      .select()
      .single();
    return { data: data ? rowToPreset(data as unknown as PresetRow) : null, error };
  };

  const updatePreset = async (id: string, updates: Partial<Pick<OverlayV2Preset, 'name' | 'description' | 'config'>>) => {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.config !== undefined) payload.config = updates.config as unknown as Record<string, unknown>;
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .update(payload)
      .eq('id', id);
    return { error };
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .delete()
      .eq('id', id);
    return { error };
  };

  const setDefault = async (id: string) => {
    // unset all then set one
    await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .update({ is_default: false })
      .neq('id', id);
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .update({ is_default: true })
      .eq('id', id);
    return { error };
  };

  return { presets, loading, createPreset, updatePreset, deletePreset, setDefault, refetch };
}
