import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BroadcastSession } from '@/types/broadcast';

export interface RegistryOverrides {
  hasTeamColorOverride: boolean;
  hasMmrMatchBinding: boolean;
}

export function useRegistryOverrides(session: BroadcastSession | null): RegistryOverrides {
  const [hasTeamColorOverride, setHasTeamColorOverride] = useState(false);
  const hasMmrMatchBinding = !!session?.mmr_match_id;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data } = await supabase
        .from('players_registry')
        .select('team_color')
        .not('team_color', 'is', null)
        .limit(1);
      if (!cancelled) setHasTeamColorOverride(!!data && data.length > 0);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  return { hasTeamColorOverride, hasMmrMatchBinding };
}