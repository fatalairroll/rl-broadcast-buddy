import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PostMatchWinners } from '@/types/livestats';

interface MatchResultRow {
  match_guid: string;
  data: { winners?: PostMatchWinners } | null;
}

export function useMatchResult(matchGuid: string | null): PostMatchWinners | null {
  const [winners, setWinners] = useState<PostMatchWinners | null>(null);

  useEffect(() => {
    setWinners(null);
    if (!matchGuid) return;

    let cancelled = false;

    const apply = (row: MatchResultRow | null | undefined) => {
      if (cancelled) return;
      const w = row?.data?.winners ?? null;
      setWinners(w ?? null);
    };

    (async () => {
      const { data } = await supabase
        .from('match_results')
        .select('match_guid, data')
        .eq('match_guid', matchGuid)
        .maybeSingle();
      apply(data as MatchResultRow | null);
    })();

    const channel = supabase
      .channel(`match_results:${matchGuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_results',
          filter: `match_guid=eq.${matchGuid}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as MatchResultRow | undefined;
          apply(row);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchGuid]);

  return winners;
}