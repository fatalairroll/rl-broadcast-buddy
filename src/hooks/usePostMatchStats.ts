import { useEffect, useRef, useState } from 'react';
import type { MatchMetadata, PlayerLive } from '@/types/livestats';

/**
 * Aggregates per-player stats across the lifetime of a match for the
 * post-match recap card. Resets when match_guid changes or is_active
 * transitions from false -> true.
 *
 * Speed is assumed to be in uu/s; we convert to km/h with * 0.036.
 * Adjust UU_TO_KMH if the bot already sends km/h.
 */
const UU_TO_KMH = 0.036;
const MAX_DELTA_MS = 2000;

interface RunningStats {
  maxDemos: number;
  prevGoals: number;
  goalSpeedMax: number; // uu/s
  speedSum: number;
  speedSamples: number;
  supersonicMs: number;
  airMs: number;
  groundMs: number;
  lastTs: number;
}

export interface Winner {
  player_name: string;
  value: number;
}

export interface PostMatchWinners {
  fastestShot: Winner | null; // km/h
  mostDemos: Winner | null; // count
  mostAir: Winner | null; // seconds
  mostGround: Winner | null; // seconds
  fastestAvg: Winner | null; // km/h
  mostSupersonic: Winner | null; // seconds
}

function emptyStats(): RunningStats {
  return {
    maxDemos: 0,
    prevGoals: 0,
    goalSpeedMax: 0,
    speedSum: 0,
    speedSamples: 0,
    supersonicMs: 0,
    airMs: 0,
    groundMs: 0,
    lastTs: 0,
  };
}

function pickMax(
  map: Map<string, RunningStats>,
  selector: (s: RunningStats) => number,
): Winner | null {
  let best: Winner | null = null;
  map.forEach((s, name) => {
    const v = selector(s);
    if (v > 0 && (!best || v > best.value)) {
      best = { player_name: name, value: v };
    }
  });
  return best;
}

export function usePostMatchStats(
  players: PlayerLive[],
  match: MatchMetadata | null,
): PostMatchWinners {
  const statsRef = useRef<Map<string, RunningStats>>(new Map());
  const matchKeyRef = useRef<string | null>(null);
  const prevActiveRef = useRef<boolean | null>(null);
  const [winners, setWinners] = useState<PostMatchWinners>({
    fastestShot: null,
    mostDemos: null,
    mostAir: null,
    mostGround: null,
    fastestAvg: null,
    mostSupersonic: null,
  });

  // Reset on new match (match_guid change OR resume from inactive)
  useEffect(() => {
    if (!match) return;
    const key = match.match_guid ?? '__no_guid__';
    const wasActive = prevActiveRef.current;
    const becameActive = wasActive === false && match.is_active === true;
    if (matchKeyRef.current !== key || becameActive) {
      statsRef.current = new Map();
      matchKeyRef.current = key;
    }
    prevActiveRef.current = match.is_active ?? true;
  }, [match]);

  // Aggregate on each players_live update
  useEffect(() => {
    if (!players || players.length === 0) return;
    const active = match?.is_active ?? true;
    const now = Date.now();
    const map = statsRef.current;

    for (const p of players) {
      let s = map.get(p.player_name);
      if (!s) {
        s = emptyStats();
        s.lastTs = now;
        s.prevGoals = p.goals;
        map.set(p.player_name, s);
      }

      // Only accumulate while match is live; still seed on first tick.
      if (active) {
        const rawDelta = now - s.lastTs;
        const delta = Math.max(0, Math.min(MAX_DELTA_MS, rawDelta));

        if (p.is_supersonic) s.supersonicMs += delta;
        if (p.is_on_ground) s.groundMs += delta;
        else s.airMs += delta;

        s.speedSum += p.speed;
        s.speedSamples += 1;

        if (p.goals > s.prevGoals) {
          if (p.last_goal_speed > s.goalSpeedMax) s.goalSpeedMax = p.last_goal_speed;
          s.prevGoals = p.goals;
        }
        if (p.demos > s.maxDemos) s.maxDemos = p.demos;
      }

      s.lastTs = now;
    }

    // Recompute winners snapshot
    setWinners({
      fastestShot: (() => {
        const w = pickMax(map, (s) => s.goalSpeedMax);
        return w ? { player_name: w.player_name, value: Math.round(w.value * UU_TO_KMH) } : null;
      })(),
      mostDemos: pickMax(map, (s) => s.maxDemos),
      mostAir: (() => {
        const w = pickMax(map, (s) => s.airMs);
        return w ? { player_name: w.player_name, value: Math.round(w.value / 1000) } : null;
      })(),
      mostGround: (() => {
        const w = pickMax(map, (s) => s.groundMs);
        return w ? { player_name: w.player_name, value: Math.round(w.value / 1000) } : null;
      })(),
      fastestAvg: (() => {
        const w = pickMax(map, (s) =>
          s.speedSamples > 0 ? s.speedSum / s.speedSamples : 0,
        );
        return w ? { player_name: w.player_name, value: Math.round(w.value * UU_TO_KMH) } : null;
      })(),
      mostSupersonic: (() => {
        const w = pickMax(map, (s) => s.supersonicMs);
        return w ? { player_name: w.player_name, value: Math.round(w.value / 1000) } : null;
      })(),
    });
  }, [players, match]);

  return winners;
}