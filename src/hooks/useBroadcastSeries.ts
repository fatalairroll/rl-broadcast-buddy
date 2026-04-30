import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SeriesType } from '@/types/overlayV2';

export interface SeriesData {
  type: SeriesType;
  blueScore: number;
  orangeScore: number;
  blueName: string | null;
  orangeName: string | null;
}

const DEFAULT: SeriesData = {
  type: 'bo3',
  blueScore: 0,
  orangeScore: 0,
  blueName: null,
  orangeName: null,
};

function normalizeType(raw: string | null | undefined): SeriesType {
  const v = (raw ?? '').toLowerCase();
  if (v === 'bo1' || v === 'bo3' || v === 'bo5' || v === 'bo7') return v;
  return 'bo3';
}

export function useBroadcastSeries() {
  const [data, setData] = useState<SeriesData>(DEFAULT);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: row } = await supabase
        .from('broadcast_sessions')
        .select('series_type, team_a_series_score, team_b_series_score, team_a_name, team_b_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (!row) {
        setData(DEFAULT);
        return;
      }
      setData({
        type: normalizeType(row.series_type),
        blueScore: row.team_a_series_score ?? 0,
        orangeScore: row.team_b_series_score ?? 0,
        blueName: row.team_a_name ?? null,
        orangeName: row.team_b_name ?? null,
      });
    };
    load();
    const ch = supabase
      .channel('overlay-v2-series')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_sessions' }, () => load())
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return data;
}
