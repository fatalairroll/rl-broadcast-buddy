import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  ActiveCamera,
  MatchMetadata,
  PlayerLive,
  PlayerRegistry,
} from '@/types/livestats';

/**
 * Subscribes to Live Stats V2 tables (fed by external Python bot
 * reading the official Rocket League Stats API WebSocket).
 *
 * Source of truth = match_metadata + players_live + active_camera.
 * players_registry is an optional LEFT JOIN by player_name to enrich
 * the active player card with photo / rank / country.
 */
export function useLiveStatsV2() {
  const [match, setMatch] = useState<MatchMetadata | null>(null);
  const [players, setPlayers] = useState<PlayerLive[]>([]);
  const [camera, setCamera] = useState<ActiveCamera | null>(null);
  const [registry, setRegistry] = useState<PlayerRegistry[]>([]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    (async () => {
      const [mRes, pRes, cRes, rRes] = await Promise.all([
        supabase.from('match_metadata').select('*').eq('id', 1).maybeSingle(),
        supabase.from('players_live').select('*'),
        supabase.from('active_camera').select('*').eq('id', 1).maybeSingle(),
        supabase.from('players_registry').select('*'),
      ]);
      if (!mounted) return;
      if (mRes.data) setMatch(mRes.data as MatchMetadata);
      if (pRes.data) setPlayers(pRes.data as PlayerLive[]);
      if (cRes.data) setCamera(cRes.data as ActiveCamera);
      if (rRes.data) setRegistry(rRes.data as PlayerRegistry[]);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const debug =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('debug') === '1';
    let lastEventAt = 0;
    let evtCount = 0;
    let debugTimer: ReturnType<typeof setInterval> | null = null;
    if (debug) {
      debugTimer = setInterval(() => {
        // eslint-disable-next-line no-console
        console.log(
          `[live-stats] players_live events/2s=${evtCount} lastGapMs=${
            lastEventAt ? Math.round(performance.now() - lastEventAt) : 'n/a'
          }`,
        );
        evtCount = 0;
      }, 2000);
    }

    const channel = supabase
      .channel('live-stats-v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_metadata' },
        (payload) => {
          const row = (payload.new ?? payload.old) as MatchMetadata | undefined;
          if (row && row.id === 1) setMatch(row);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_camera' },
        (payload) => {
          const row = (payload.new ?? payload.old) as ActiveCamera | undefined;
          if (row && row.id === 1) setCamera(row);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players_live' },
        (payload) => {
          if (debug) {
            evtCount += 1;
            lastEventAt = performance.now();
          }
          setPlayers((prev) => {
            if (payload.eventType === 'DELETE') {
              const old = payload.old as PlayerLive;
              return prev.filter((p) => p.player_name !== old.player_name);
            }
            const next = payload.new as PlayerLive;
            const idx = prev.findIndex((p) => p.player_name === next.player_name);
            if (idx === -1) return [...prev, next];
            const copy = prev.slice();
            copy[idx] = next;
            return copy;
          });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players_registry' },
        (payload) => {
          setRegistry((prev) => {
            if (payload.eventType === 'DELETE') {
              const old = payload.old as PlayerRegistry;
              return prev.filter((r) => r.player_name !== old.player_name);
            }
            const next = payload.new as PlayerRegistry;
            const idx = prev.findIndex((r) => r.player_name === next.player_name);
            if (idx === -1) return [...prev, next];
            const copy = prev.slice();
            copy[idx] = next;
            return copy;
          });
        },
      )
      .subscribe();

    return () => {
      if (debugTimer) clearInterval(debugTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const registryMap = useMemo(() => {
    const m = new Map<string, PlayerRegistry>();
    for (const r of registry) m.set(r.player_name, r);
    return m;
  }, [registry]);

  const sorted = useMemo(
    () =>
      [...players].sort((a, b) => {
        if (a.team_num !== b.team_num) return a.team_num - b.team_num;
        return a.player_name.localeCompare(b.player_name);
      }),
    [players],
  );

  // Awaryjny filtr swiezosci: jezeli w tabeli zostana stare rekordy
  // (np. boty z poprzedniej sesji testowej, ktorych relay z jakiegos powodu
  // nie zdazyl skasowac), odcinamy wpisy starsze o ponad 30 s od najswiezszego.
  const fresh = useMemo(() => {
    if (sorted.length === 0) return sorted;
    const times = sorted
      .map((p) => (p.updated_at ? new Date(p.updated_at).getTime() : 0))
      .filter((t) => Number.isFinite(t) && t > 0);
    if (times.length === 0) return sorted;
    const newest = Math.max(...times);
    const STALE_MS = 30_000;
    return sorted.filter((p) => {
      const t = p.updated_at ? new Date(p.updated_at).getTime() : 0;
      return t > 0 && newest - t <= STALE_MS;
    });
  }, [sorted]);

  const blue = useMemo(() => fresh.filter((p) => p.team_num === 0), [fresh]);
  const orange = useMemo(() => fresh.filter((p) => p.team_num === 1), [fresh]);

  const activeCameraTarget = camera?.target_name ?? null;
  const activePlayer =
    activeCameraTarget != null
      ? players.find((p) => p.player_name === activeCameraTarget) ?? null
      : null;
  const activeRegistry =
    activeCameraTarget != null ? registryMap.get(activeCameraTarget) ?? null : null;

  return {
    match,
    players: fresh,
    blue,
    orange,
    activeCameraTarget,
    activePlayer,
    activeRegistry,
    registryMap,
  };
}