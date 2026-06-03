import { useEffect, useRef, useState } from 'react';
import type { MatchMetadata } from '@/types/livestats';

interface RelayLiveness {
  relayConnected: boolean;
  lastMessageAgeMs: number | null;
  lastFrameIsActive?: boolean;
}

const HIDE_DEBOUNCE_MS = 5000;
const STALE_MS = 30_000;
const TICK_MS = 1000;

/**
 * Returns whether the overlay should be visible.
 *
 * Show: match.is_active === true AND updated_at fresh (< 30s).
 * Hide: is_active === false sustained for >= 5s (debounce),
 *       OR updated_at older than 30s (fail-safe — bot lost).
 * Missing is_active field is treated as true (legacy compatibility).
 */
export function useOverlayVisibility(
  match: MatchMetadata | null,
  relay?: RelayLiveness,
): boolean {
  const [visible, setVisible] = useState<boolean>(false);
  const inactiveSinceRef = useRef<number | null>(null);

  const isActive = match?.is_active ?? true;
  const updatedAt = match?.updated_at ?? null;

  // Track when is_active flipped to false
  useEffect(() => {
    if (!match) {
      inactiveSinceRef.current = null;
      return;
    }
    if (isActive) {
      inactiveSinceRef.current = null;
    } else if (inactiveSinceRef.current == null) {
      inactiveSinceRef.current = Date.now();
    }
  }, [match, isActive, updatedAt]);

  // Recompute visibility on each tick + on signal change
  useEffect(() => {
    const compute = () => {
      // WS override: jezeli relay zywy i swiezy, wierzymy mu bez wzgledu na Supabase.
      if (
        relay?.relayConnected &&
        relay.lastMessageAgeMs != null &&
        relay.lastMessageAgeMs < 1500
      ) {
        setVisible(relay.lastFrameIsActive !== false);
        return;
      }
      if (!match || !updatedAt) {
        setVisible(false);
        return;
      }
      const now = Date.now();
      const staleness = now - new Date(updatedAt).getTime();
      const stale = !Number.isFinite(staleness) || staleness > STALE_MS;

      const inactiveSince = inactiveSinceRef.current;
      const debounceElapsed =
        inactiveSince != null && now - inactiveSince >= HIDE_DEBOUNCE_MS;

      const shouldHide = stale || debounceElapsed;
      setVisible(!shouldHide);
    };

    compute();
    const id = window.setInterval(compute, TICK_MS);
    return () => window.clearInterval(id);
  }, [match, updatedAt, isActive, relay?.relayConnected, relay?.lastMessageAgeMs, relay?.lastFrameIsActive]);

  return visible;
}