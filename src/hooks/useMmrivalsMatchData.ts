import { useEffect, useState } from 'react';
import { fetchMatches } from '@/lib/mmrivals-api';
import type { MatchData } from '@/types/studio';

/**
 * Loads bracket matches for a tournament. Returns all matches (used for
 * round/match selection) plus a helper to find one by id.
 */
export function useMmrivalsBracket(tournamentId: string | null | undefined) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMatches(tournamentId, 'bracket')
      .then((res) => {
        if (cancelled) return;
        setMatches(res.matches ?? []);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  return { matches, loading, error };
}

export function findMatchById(matches: MatchData[], id: string | null | undefined): MatchData | null {
  if (!id) return null;
  return matches.find((m) => m.match_id === id) ?? null;
}