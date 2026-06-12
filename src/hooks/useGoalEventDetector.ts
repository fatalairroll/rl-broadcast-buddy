import { useEffect, useRef, useState } from 'react';
import type { MatchMetadata, PlayerLive } from '@/types/livestats';

export interface GoalEvent {
  nonce: number;
  scorerName: string;
  assistName: string | null;
  teamSide: 'blue' | 'orange';
  scoredAt: number; // ms epoch
  matchTimer: string;
}

/**
 * Detects goal events by watching `blue_score` / `orange_score` increments on
 * `match` and attributing the goal to the player whose `goals` counter rose by
 * 1 in the same tick. Assist = same-team player whose `assists` rose by 1.
 */
export function useGoalEventDetector(
  match: MatchMetadata | null,
  blue: PlayerLive[],
  orange: PlayerLive[],
): GoalEvent | null {
  const prevScoreRef = useRef<{ blue: number; orange: number } | null>(null);
  const prevGoalsRef = useRef<Map<string, number>>(new Map());
  const prevAssistsRef = useRef<Map<string, number>>(new Map());
  const nonceRef = useRef(0);
  const [event, setEvent] = useState<GoalEvent | null>(null);

  useEffect(() => {
    if (!match) return;
    const prev = prevScoreRef.current;
    const curr = { blue: match.blue_score ?? 0, orange: match.orange_score ?? 0 };

    const all = [...blue, ...orange];
    const currGoals = new Map<string, number>();
    const currAssists = new Map<string, number>();
    for (const p of all) {
      currGoals.set(p.player_name, p.goals ?? 0);
      currAssists.set(p.player_name, p.assists ?? 0);
    }

    if (prev) {
      let side: 'blue' | 'orange' | null = null;
      if (curr.blue > prev.blue) side = 'blue';
      else if (curr.orange > prev.orange) side = 'orange';

      if (side) {
        const sidePlayers = side === 'blue' ? blue : orange;
        // Scorer: player whose goals increased by 1.
        let scorer = sidePlayers.find((p) => {
          const prevG = prevGoalsRef.current.get(p.player_name) ?? 0;
          return (p.goals ?? 0) > prevG;
        });
        if (!scorer && sidePlayers.length > 0) {
          scorer = [...sidePlayers].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0];
        }
        // Assist: same-team player ≠ scorer whose assists rose.
        const assist = sidePlayers.find((p) => {
          if (!scorer || p.player_name === scorer.player_name) return false;
          const prevA = prevAssistsRef.current.get(p.player_name) ?? 0;
          return (p.assists ?? 0) > prevA;
        });
        if (scorer) {
          nonceRef.current += 1;
          setEvent({
            nonce: nonceRef.current,
            scorerName: scorer.player_name,
            assistName: assist ? assist.player_name : null,
            teamSide: side,
            scoredAt: Date.now(),
            matchTimer: match.timer ?? '',
          });
        }
      }
    }

    prevScoreRef.current = curr;
    prevGoalsRef.current = currGoals;
    prevAssistsRef.current = currAssists;
  }, [match, blue, orange]);

  return event;
}