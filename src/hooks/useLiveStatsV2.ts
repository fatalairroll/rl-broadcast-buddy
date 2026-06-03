import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocalRelayFeed, type LocalRelayFeed } from '@/hooks/useLocalRelayFeed';
import type {
  ActiveCamera,
  MatchMetadata,
  PlayerLive,
  PlayerRegistry,
} from '@/types/livestats';

/**
 * Live Stats V2:
 *   - WS (relay v3) jest pierwszym zrodlem dla match/players/camera, jezeli polaczone
 *     i ostatnia ramka < 1500 ms temu. Jezeli relay leci jeszcze w v2.4 (tylko boost)
 *     albo WS niedostepny, korzystamy z Supabase Realtime jako fallback.
 *   - players_registry: zawsze Supabase (admin-edited, low-frequency).
 *   - Boost w kazdym wypadku enrichujemy z relay.getBoost() — daje to plynny boost
 *     nawet pomiedzy pelnymi ramkami.
 */
export function useLiveStatsV2() {
  const [match, setMatch] = useState<MatchMetadata | null>(null);
  const [players, setPlayers] = useState<PlayerLive[]>([]);
  const [camera, setCamera] = useState<ActiveCamera | null>(null);
  const [registry, setRegistry] = useState<PlayerRegistry[]>([]);
  const relay = useLocalRelayFeed();

  // Trzymamy relay w refie zeby useEffect z subskrypcjami Realtime NIE
  // re-runowal sie przy kazdej zmianie revision WS.
  const relayRef = useRef<LocalRelayFeed>(relay);
  useEffect(() => {
    relayRef.current = relay;
  }, [relay]);

  // Initial Supabase load
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

  // Supabase Realtime — dziala caly czas (fallback gdy WS padnie / drugi OBS).
  useEffect(() => {
    const debug =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('debug') === '1';
    let debugTimer: ReturnType<typeof setInterval> | null = null;
    if (debug) {
      debugTimer = setInterval(() => {
        const r = relayRef.current;
        const age = r.getLastMessageAge();
        // eslint-disable-next-line no-console
        console.log(
          `[live-stats] ws.connected=${r.connected} wsAgeMs=${age == null ? 'n/a' : Math.round(age)} frame=${r.getLastFrame() ? 'v3' : 'none'}`,
        );
      }, 2000);
    }

    const channel = supabase
      .channel('live-stats-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_metadata' }, (payload) => {
        const row = (payload.new ?? payload.old) as MatchMetadata | undefined;
        if (row && row.id === 1) setMatch(row);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_camera' }, (payload) => {
        const row = (payload.new ?? payload.old) as ActiveCamera | undefined;
        if (row && row.id === 1) setCamera(row);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players_live' }, (payload) => {
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players_registry' }, (payload) => {
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
      })
      .subscribe();

    return () => {
      if (debugTimer) clearInterval(debugTimer);
      supabase.removeChannel(channel);
    };
    // Brak `relay` w deps — celowo.
  }, []);

  const registryMap = useMemo(() => {
    const m = new Map<string, PlayerRegistry>();
    for (const r of registry) m.set(r.player_name, r);
    return m;
  }, [registry]);

  // Czy WS jest pierwszym zrodlem?
  const liveWs =
    relay.connected &&
    relay.lastMessageAgeMs != null &&
    relay.lastMessageAgeMs < 1500;
  const frame = liveWs ? relay.getLastFrame() : null;

  // ---- MATCH ----
  const mergedMatch: MatchMetadata | null = useMemo(() => {
    if (frame?.match) return frame.match;
    return match;
  }, [frame, match]);

  // ---- CAMERA ----
  const mergedCamera: ActiveCamera | null = useMemo(() => {
    if (frame?.camera) {
      return {
        id: 1,
        target_name: frame.camera.target_name,
        updated_at: new Date().toISOString(),
      };
    }
    return camera;
  }, [frame, camera]);

  // ---- PLAYERS ----
  // Baza: ramka WS jezeli dostepna, inaczej Supabase z filtrem swiezosci.
  const basePlayers: PlayerLive[] = useMemo(() => {
    if (frame?.players && frame.players.length > 0) {
      return [...frame.players].sort((a, b) => {
        if (a.team_num !== b.team_num) return a.team_num - b.team_num;
        return a.player_name.localeCompare(b.player_name);
      });
    }
    const sorted = [...players].sort((a, b) => {
      if (a.team_num !== b.team_num) return a.team_num - b.team_num;
      return a.player_name.localeCompare(b.player_name);
    });
    if (sorted.length === 0) return sorted;
    // Filtr swiezosci tylko dla zrodla Supabase.
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
  }, [frame, players]);

  // Enrich boost z WS — dziala niezaleznie od zrodla bazy (smooth boost miedzy frame'ami).
  const enriched: PlayerLive[] = useMemo(() => {
    if (basePlayers.length === 0) return basePlayers;
    return basePlayers.map((p) => {
      const wsRow = relay.getBoost(p.player_name);
      if (!wsRow) return p;
      return {
        ...p,
        boost: wsRow.boost,
        speed: wsRow.speed,
        is_supersonic: wsRow.is_supersonic,
      };
    });
  }, [basePlayers, relay]);

  const blue = useMemo(() => enriched.filter((p) => p.team_num === 0), [enriched]);
  const orange = useMemo(() => enriched.filter((p) => p.team_num === 1), [enriched]);

  const activeCameraTarget = mergedCamera?.target_name ?? null;
  const activePlayer =
    activeCameraTarget != null
      ? enriched.find((p) => p.player_name === activeCameraTarget) ?? null
      : null;
  const activeRegistry =
    activeCameraTarget != null ? registryMap.get(activeCameraTarget) ?? null : null;

  return useMemo(
    () => ({
      match: mergedMatch,
      players: enriched,
      blue,
      orange,
      activeCameraTarget,
      activePlayer,
      activeRegistry,
      registryMap,
      relayConnected: relay.connected,
      relayLastMessageAgeMs: relay.lastMessageAgeMs,
      relayLastFrame: frame,
    }),
    [
      mergedMatch,
      enriched,
      blue,
      orange,
      activeCameraTarget,
      activePlayer,
      activeRegistry,
      registryMap,
      relay.connected,
      relay.lastMessageAgeMs,
      frame,
    ],
  );
}
