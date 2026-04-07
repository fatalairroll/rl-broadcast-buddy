import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMatches, fetchTournaments } from '@/lib/mmrivals-api';
import type { Tournament, MatchData, MatchResponse, StudioMode } from '@/types/studio';

interface UseStudioDataOptions {
  tournamentId: string;
  mode: StudioMode;
  count?: number;
  enabled?: boolean;
  pollInterval?: number;
}

interface UseStudioDataReturn {
  tournament: MatchResponse['tournament'] | null;
  matches: MatchData[];
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStudioData({
  tournamentId,
  mode,
  count = 1,
  enabled = true,
  pollInterval = 5000,
}: UseStudioDataOptions): UseStudioDataReturn {
  const [tournament, setTournament] = useState<MatchResponse['tournament'] | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      if (!tournamentId) {
        const res = await fetchTournaments();
        setTournaments(res.tournaments ?? []);
        setIsLoading(false);
        return;
      }

      // Map mode + count to API mode
      let apiMode: string = mode;
      if (mode === 'next_match' && count > 1) {
        apiMode = 'next_3';
      }
      if (mode === 'recent') {
        apiMode = 'bracket';
      }

      const res = await fetchMatches(tournamentId, apiMode);
      setTournament(res.tournament);

      let resultMatches = res.matches ?? [];

      if (mode === 'recent') {
        resultMatches = resultMatches
          .filter((m) => m.state === 'done')
          .sort((a, b) => {
            if (b.round_index !== a.round_index) return b.round_index - a.round_index;
            return (b.match_index ?? 0) - (a.match_index ?? 0);
          })
          .slice(0, 10);
      }

      // Limit to requested count for next_match modes
      if (mode === 'next_match' || mode === 'next_3') {
        resultMatches = resultMatches.slice(0, count);
      }

      setMatches(resultMatches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, mode, count, enabled]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();

    if (enabled && pollInterval > 0) {
      intervalRef.current = setInterval(fetchData, pollInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, enabled, pollInterval]);

  return { tournament, matches, tournaments, isLoading, error, refetch: fetchData };
}
