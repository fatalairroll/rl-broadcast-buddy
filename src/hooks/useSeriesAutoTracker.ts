import { useEffect, useMemo, useRef, useState } from 'react';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { useMmrivalsBracket, findMatchById } from '@/hooks/useMmrivalsMatchData';
import { fetchTournaments } from '@/lib/mmrivals-api';
import { findBestMatch, flattenMatchPlayers, type PairingMap } from '@/lib/player-matching';
import {
  getTournamentPlayerIds,
  minPlayersForMode,
  setToKey,
} from '@/lib/tournament-roster';
import type { MatchData } from '@/types/studio';
import type { BroadcastSession } from '@/types/broadcast';
import type { PlayerLive } from '@/types/livestats';

/**
 * Map RL blue/orange side to broadcast team A/B using player pairings
 * + bracket roster. Fallback: blue -> team A.
 */
function resolveBlueIsTeamA(
  players: PlayerLive[],
  session: BroadcastSession,
  currentMatch: MatchData | null,
): boolean {
  if (!currentMatch || !session.mmr_team_a_id) return true;
  const pairings = (session.player_pairings ?? null) as PairingMap | null;
  const candidates = flattenMatchPlayers(currentMatch);
  if (candidates.length === 0) return true;
  const discordToTeam = new Map<string, string>();
  for (const c of candidates) discordToTeam.set(c.discord_id, c.team_id);

  let blueVotesA = 0;
  let blueVotesB = 0;
  for (const p of players) {
    if (p.team_num !== 0) continue;
    let discordId: string | undefined =
      pairings?.[p.player_name]?.discord_id ?? undefined;
    if (!discordId) {
      const m = findBestMatch(p.player_name, candidates);
      discordId = m?.candidate.discord_id;
    }
    if (!discordId) continue;
    const teamId = discordToTeam.get(discordId);
    if (!teamId) continue;
    if (teamId === session.mmr_team_a_id) blueVotesA += 1;
    else blueVotesB += 1;
  }
  if (blueVotesA === blueVotesB) return true;
  return blueVotesA > blueVotesB;
}

export function useSeriesAutoTracker(): void {
  const { session, updateSession } = useBroadcast();
  const live = useLiveStatsV2();
  const { matches } = useMmrivalsBracket(session?.mmr_tournament_id ?? null);
  const currentMatch = useMemo(
    () => findMatchById(matches, session?.mmr_match_id ?? null),
    [matches, session?.mmr_match_id],
  );

  // Lazily cache tournaments list for mode lookup.
  const [tournamentMode, setTournamentMode] = useState<string | undefined>(undefined);
  useEffect(() => {
    const tid = session?.mmr_tournament_id;
    if (!tid) {
      setTournamentMode(undefined);
      return;
    }
    let cancelled = false;
    fetchTournaments()
      .then((r) => {
        if (cancelled) return;
        const t = (r.tournaments ?? []).find((x) => x.tournament_id === tid);
        setTournamentMode(t?.mode);
      })
      .catch(() => {
        if (!cancelled) setTournamentMode(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.mmr_tournament_id]);

  const lastScoresRef = useRef<{ blue: number; orange: number }>({ blue: 0, orange: 0 });
  const lastIncRef = useRef<number>(0);
  const lastTournamentSetRef = useRef<string>('');
  const initializedRef = useRef<boolean>(false);

  // Hard reset when match changes.
  useEffect(() => {
    lastScoresRef.current = { blue: 0, orange: 0 };
    lastTournamentSetRef.current = '';
    lastIncRef.current = 0;
    initializedRef.current = false;
  }, [session?.mmr_match_id]);

  const blueScore = live.match?.blue_score;
  const orangeScore = live.match?.orange_score;
  const livePlayers = live.players;

  useEffect(() => {
    if (!session) return;
    if (session.series_auto_enabled === false) return;
    if (!live.match) return;

    // 1) Roster diff on tournament participants only.
    const newSet = getTournamentPlayerIds({
      livePlayers,
      currentMatch,
      pairings: (session.player_pairings ?? null) as PairingMap | null,
    });
    const newKey = setToKey(newSet);
    const min = minPlayersForMode(tournamentMode);

    if (lastTournamentSetRef.current === '' && !initializedRef.current) {
      lastTournamentSetRef.current = newKey;
      initializedRef.current = true;
      // seed scores too
      if ((blueScore ?? 0) > 0 || (orangeScore ?? 0) > 0) {
        lastScoresRef.current = { blue: blueScore ?? 0, orange: orangeScore ?? 0 };
      }
      return;
    }

    if (newKey !== lastTournamentSetRef.current) {
      const oldIds = new Set(
        lastTournamentSetRef.current ? lastTournamentSetRef.current.split('|') : [],
      );
      const oldSize = oldIds.size;
      let symDiff = 0;
      for (const id of newSet) if (!oldIds.has(id)) symDiff += 1;
      for (const id of oldIds) if (!newSet.has(id)) symDiff += 1;

      if (symDiff >= 1 && oldSize >= min) {
        void updateSession({
          team_a_series_score: 0,
          team_b_series_score: 0,
        });
        lastIncRef.current = Date.now();
        lastScoresRef.current = { blue: 0, orange: 0 };
      }
      lastTournamentSetRef.current = newKey;
      return;
    }

    // 2) End-of-game detection: RL score reset to 0:0 after non-zero.
    const blue = blueScore ?? 0;
    const orange = orangeScore ?? 0;
    const prev = lastScoresRef.current;

    if (blue === 0 && orange === 0 && (prev.blue > 0 || prev.orange > 0)) {
      const now = Date.now();
      if (now - lastIncRef.current < 10_000) return;
      if (prev.blue === prev.orange) {
        lastScoresRef.current = { blue: 0, orange: 0 };
        return;
      }
      const blueWon = prev.blue > prev.orange;
      const blueIsTeamA = resolveBlueIsTeamA(livePlayers, session, currentMatch);
      const winnerIsA = blueWon ? blueIsTeamA : !blueIsTeamA;
      const field = winnerIsA ? 'team_a_series_score' : 'team_b_series_score';
      const current = (winnerIsA ? session.team_a_series_score : session.team_b_series_score) ?? 0;
      void updateSession({ [field]: current + 1 } as Partial<BroadcastSession>);
      lastIncRef.current = now;
      lastScoresRef.current = { blue: 0, orange: 0 };
      return;
    }

    // 3) Track last non-zero score.
    if (blue > 0 || orange > 0) {
      if (prev.blue !== blue || prev.orange !== orange) {
        lastScoresRef.current = { blue, orange };
      }
    }
  }, [
    session,
    blueScore,
    orangeScore,
    livePlayers,
    currentMatch,
    tournamentMode,
    updateSession,
    live.match,
  ]);
}