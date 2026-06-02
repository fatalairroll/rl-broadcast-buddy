import { useEffect, useRef, useState } from 'react';

/**
 * Lokalny WebSocket feed boosta/speeda z relay.py v2.4 (ws://127.0.0.1:49300).
 *
 * - Auto-connect z exponential backoff.
 * - Brak setState na kazda wiadomosc — przechowujemy mape w refie i ekspozycja
 *   przez `getBoost(name)`. Dzieki temu nie generujemy 60 Hz re-renderow Reacta.
 *   Overlay i tak rerenderuje sie z Supabase Realtime na `players_live`, a w
 *   trakcie tego rerendera czytamy najswiezsza wartosc z refa.
 * - Gdy WS niedostepny (np. overlay na innej maszynie niz relay) — `getBoost`
 *   zwraca `null` i overlay leci wylacznie na Supabase (graceful degradation).
 */

const WS_URL = 'ws://127.0.0.1:49300';
const STALE_MS = 500;
const BACKOFF_MS = [1000, 2000, 5000, 10000];

interface BoostRow {
  boost: number;
  speed: number;
  is_supersonic: boolean;
  t: number; // performance.now() w momencie odbioru
}

interface IncomingPlayer {
  player_name: string;
  boost: number;
  speed: number;
  is_supersonic: boolean;
}

interface IncomingMsg {
  t: number;
  players: IncomingPlayer[];
}

export interface LocalBoostFeed {
  /** Aktualna wartosc z WS dla danego gracza, lub null jesli WS nieaktywny / stale. */
  getBoost: (name: string) => { boost: number; speed: number; is_supersonic: boolean; ageMs: number } | null;
  /** Czy socket jest aktualnie OPEN. */
  connected: boolean;
  /** Wiek (ms) ostatniej wiadomosci, lub null jesli zadnej nie bylo. */
  getLastMessageAge: () => number | null;
}

export function useLocalBoostFeed(): LocalBoostFeed {
  const mapRef = useRef<Map<string, BoostRow>>(new Map());
  const lastMsgRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const stoppedRef = useRef(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    stoppedRef.current = false;

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
        let msg: IncomingMsg | null = null;
        try {
          msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
        } catch {
          return;
        }
        if (!msg || !Array.isArray(msg.players)) return;
        const now = performance.now();
        lastMsgRef.current = now;
        const m = mapRef.current;
        for (const p of msg.players) {
          if (!p || typeof p.player_name !== 'string') continue;
          m.set(p.player_name, {
            boost: Number(p.boost) || 0,
            speed: Number(p.speed) || 0,
            is_supersonic: !!p.is_supersonic,
            t: now,
          });
        }
      };

      const onClose = () => {
        setConnected(false);
        wsRef.current = null;
        // Mapa zostanie wyczyszczona naturalnie przez STALE_MS w getBoost.
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

  const getBoost: LocalBoostFeed['getBoost'] = (name) => {
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
  };

  const getLastMessageAge = () => {
    const t = lastMsgRef.current;
    if (t == null) return null;
    return performance.now() - t;
  };

  return { getBoost, connected, getLastMessageAge };
}