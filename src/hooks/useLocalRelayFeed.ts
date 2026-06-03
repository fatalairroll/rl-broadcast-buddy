import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveCamera, MatchMetadata, PlayerLive } from '@/types/livestats';

/**
 * Lokalny WebSocket feed z relay.py (ws://127.0.0.1:49300).
 *
 * Akceptuje DWA formaty wiadomosci (kompatybilnosc miedzy v2.4 i v3):
 *  v2: { t, players: [{player_name, boost, speed, is_supersonic}] }
 *  v3: { v:3, t, match, players: PlayerLive[], camera, series?, teams? }
 *
 * Wszystkie wiadomosci sa koalescjowane do JEDNEGO setRevision na ramke (rAF),
 * nawet jesli relay zasypie nas 60+ wiadomosciami/s. Boost trzymamy w refie i
 * dodatkowo zachowujemy ostatnia pelna ramke v3 dla overlaya (match/players/camera).
 */

const WS_URL = 'ws://127.0.0.1:49300';
const STALE_MS = 500;
const BACKOFF_MS = [1000, 2000, 5000, 10000];

interface BoostRow {
  boost: number;
  speed: number;
  is_supersonic: boolean;
  t: number; // performance.now()
}

export interface RelayFrameV3 {
  v: 3;
  t: number;
  match?: MatchMetadata;
  players?: PlayerLive[];
  camera?: { target_name: string | null };
  series?: unknown;
  teams?: unknown;
}

export interface LocalRelayFeed {
  connected: boolean;
  /** Wiek (ms) ostatniej wiadomosci, lub null. Re-evaluowane przy zmianie revision. */
  lastMessageAgeMs: number | null;
  /** Boost/speed/supersonic dla danego gracza lub null gdy WS martwy/stale. */
  getBoost: (name: string) => { boost: number; speed: number; is_supersonic: boolean; ageMs: number } | null;
  /** Ostatnia pelna ramka v3 (null gdy brak / dostalismy tylko v2). */
  getLastFrame: () => RelayFrameV3 | null;
  /** Live wiek (ms) — wolaj kiedy potrzebujesz aktualnej wartosci poza renderem. */
  getLastMessageAge: () => number | null;
}

export function useLocalRelayFeed(): LocalRelayFeed {
  const mapRef = useRef<Map<string, BoostRow>>(new Map());
  const lastFrameRef = useRef<RelayFrameV3 | null>(null);
  const lastMsgRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const stoppedRef = useRef(false);
  const rafScheduledRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    stoppedRef.current = false;

    const scheduleRender = () => {
      if (rafScheduledRef.current) return;
      rafScheduledRef.current = true;
      requestAnimationFrame(() => {
        rafScheduledRef.current = false;
        setRevision((r) => (r + 1) | 0);
      });
    };

    const connect = () => {
      if (stoppedRef.current) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        let msg: unknown = null;
        try {
          msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
        } catch {
          return;
        }
        if (!msg || typeof msg !== 'object') return;
        const m = msg as Record<string, unknown>;
        const players = Array.isArray(m.players) ? (m.players as Array<Record<string, unknown>>) : null;
        if (!players) return;

        const now = performance.now();
        lastMsgRef.current = now;

        // Wypelnij map boostow z players (dziala dla v2 i v3 — pola te same).
        const boostMap = mapRef.current;
        for (const p of players) {
          const name = p?.player_name;
          if (typeof name !== 'string') continue;
          boostMap.set(name, {
            boost: Number(p.boost) || 0,
            speed: Number(p.speed) || 0,
            is_supersonic: !!p.is_supersonic,
            t: now,
          });
        }

        // v3: dodatkowo zachowaj pelna ramke.
        if (m.v === 3) {
          lastFrameRef.current = {
            v: 3,
            t: typeof m.t === 'number' ? m.t : Date.now() / 1000,
            match: (m.match as MatchMetadata | undefined) ?? lastFrameRef.current?.match,
            players: (players as unknown as PlayerLive[]),
            camera: (m.camera as { target_name: string | null } | undefined) ?? lastFrameRef.current?.camera,
            series: m.series ?? lastFrameRef.current?.series,
            teams: m.teams ?? lastFrameRef.current?.teams,
          };
        }

        scheduleRender();
      };

      const onClose = () => {
        setConnected(false);
        wsRef.current = null;
        lastFrameRef.current = null;
        scheduleReconnect();
      };
      ws.onclose = onClose;
      ws.onerror = () => {
        try { ws.close(); } catch { /* noop */ }
      };
    };

    const scheduleReconnect = () => {
      if (stoppedRef.current) return;
      if (reconnectTimerRef.current) return;
      const delay = BACKOFF_MS[Math.min(attemptRef.current, BACKOFF_MS.length - 1)];
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        try {
          ws.onopen = null;
          ws.onmessage = null;
          ws.onclose = null;
          ws.onerror = null;
          ws.close();
        } catch { /* noop */ }
      }
    };
  }, []);

  // Stabilny obiekt — zmienia identycznosc tylko przy zmianie connected lub revision.
  return useMemo<LocalRelayFeed>(() => {
    const getLastMessageAge = () => {
      const t = lastMsgRef.current;
      if (t == null) return null;
      return performance.now() - t;
    };
    return {
      connected,
      lastMessageAgeMs: getLastMessageAge(),
      getBoost: (name) => {
        const row = mapRef.current.get(name);
        if (!row) return null;
        const ageMs = performance.now() - row.t;
        if (ageMs > STALE_MS) return null;
        return {
          boost: row.boost,
          speed: row.speed,
          is_supersonic: row.is_supersonic,
          ageMs,
        };
      },
      getLastFrame: () => lastFrameRef.current,
      getLastMessageAge,
    };
  }, [connected, revision]);
}
