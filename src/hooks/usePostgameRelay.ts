import { useEffect, useRef, useState } from 'react';
import type { PostgamePayload, PostgameState } from '@/types/postgame';

const WS_URL = 'ws://127.0.0.1:49300';
const HTTP_URL = 'http://127.0.0.1:49301/postgame';
const RECONNECT_MS = 5000;
const POLL_MS = 2000;
const STORAGE_KEY = 'studio_last_postgame';

function isPayload(x: unknown): x is PostgamePayload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.phase === 'number' && Array.isArray(o.pairs);
}

function loadInitial(): PostgamePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function usePostgameRelay(): PostgameState {
  const [postgame, setPostgame] = useState<PostgamePayload | null>(() => loadInitial());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedRef = useRef(false);
  const fetchFailedOnceRef = useRef(false);

  const persist = (pg: PostgamePayload) => {
    setPostgame(pg);
    if (pg.phase === 2 && typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pg));
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    closedRef.current = false;

    const connect = () => {
      if (closedRef.current) return;
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          setConnected(true);
          setError(null);
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
            if (msg && msg.v === 3 && isPayload(msg.postgame)) {
              persist(msg.postgame as PostgamePayload);
            }
          } catch {
            /* ignore parse */
          }
        };
        ws.onerror = () => {
          /* handled by onclose */
        };
        ws.onclose = () => {
          setConnected(false);
          wsRef.current = null;
          if (!closedRef.current) {
            reconnectTimerRef.current = setTimeout(connect, RECONNECT_MS);
          }
        };
      } catch {
        if (!closedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_MS);
        }
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(HTTP_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        fetchFailedOnceRef.current = false;
        if (data && data.available === false) return;
        if (isPayload(data)) {
          persist(data as PostgamePayload);
          setError(null);
        }
      } catch (e) {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          if (fetchFailedOnceRef.current) {
            setError('Relay niedostępny (127.0.0.1:49300)');
          }
          fetchFailedOnceRef.current = true;
        }
      }
    };

    connect();
    poll();
    pollTimerRef.current = setInterval(poll, POLL_MS);

    return () => {
      closedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
    };
  }, []);

  return { postgame, connected, error };
}