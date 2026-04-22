import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMatches, fetchTournaments } from '@/lib/mmrivals-api';
import type { Tournament, MatchData, MatchResponse, StudioMode } from '@/types/studio';

function extractMatchNumber(matchId: string): number {
  const m = matchId.match(/-M(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

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
      if (mode === 'recent' || mode === 'next_3') {
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
            return extractMatchNumber(b.match_id) - extractMatchNumber(a.match_id);
          })
          .slice(0, 10);
      }

      // Limit to requested count for next_match modes
      if (mode === 'next_3') {
        const RECENT_CHECKIN_MS = 3 * 60 * 1000;
        const now = Date.now();
        const isRecentCheckIn = (iso?: string | null) => {
          if (!iso) return false;
          const t = new Date(iso).getTime();
          return !isNaN(t) && now - t <= RECENT_CHECKIN_MS && now - t >= 0;
        };
        resultMatches = resultMatches
          .filter((m) => {
            if (m.state === 'done' || m.state === 'finished') return false;
            if (m.state === 'scheduled') return true;
            return (
              isRecentCheckIn(m.team_a?.checked_in_at) ||
              isRecentCheckIn(m.team_b?.checked_in_at)
            );
          })
          .sort((a, b) => {
            const aHasCheckIn =
              isRecentCheckIn(a.team_a?.checked_in_at) ||
              isRecentCheckIn(a.team_b?.checked_in_at);
            const bHasCheckIn =
              isRecentCheckIn(b.team_a?.checked_in_at) ||
              isRecentCheckIn(b.team_b?.checked_in_at);
            if (aHasCheckIn !== bHasCheckIn) return aHasCheckIn ? -1 : 1;
            if (a.round_index !== b.round_index) return a.round_index - b.round_index;
            return extractMatchNumber(a.match_id) - extractMatchNumber(b.match_id);
          })
          .slice(0, count);
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
