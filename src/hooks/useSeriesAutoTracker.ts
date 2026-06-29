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
  const lastTournamentSetRef = useRef<string>('');
  const initializedRef = useRef<boolean>(false);
  // Sledzimy ostatnio przeczytany seq z match_metadata. Init = -1 zeby
  // pierwsza wartosc (np. 0 lub 7 z DB) NIE wyzwolila ponownie ostatniego
  // zdarzenia po mount/F5.
  const lastSeqRef = useRef<number>(-1);

  // Hard reset when match changes.
  useEffect(() => {
    lastScoresRef.current = { blue: 0, orange: 0 };
    lastTournamentSetRef.current = '';
    initializedRef.current = false;
    // celowo NIE resetujemy lastSeqRef — chcemy traktowac to samo zdarzenie
    // jako juz przetworzone nawet jesli operator przepial mecz w MMRivals.
  }, [session?.mmr_match_id]);

  const blueScore = live.match?.blue_score;
  const orangeScore = live.match?.orange_score;
  const livePlayers = live.players;
  const eventSeq = live.match?.last_event_seq ?? 0;
  const eventName = live.match?.last_event ?? null;
  const winnerTeamNum = live.match?.last_winner_team_num ?? null;

  // === GLOWNY KANAL: zdarzenia z RL Stats API (MatchEnded / MatchDestroyed) ===
  useEffect(() => {
    if (!session) return;
    if (session.series_auto_enabled === false) return;
    // Inicjalizacja: pierwsza obserwacja po mount tylko ustawia baseline.
    if (lastSeqRef.current === -1) {
      lastSeqRef.current = eventSeq;
      return;
    }
    if (eventSeq === lastSeqRef.current) return;
    lastSeqRef.current = eventSeq;

    if (eventName === 'MatchDestroyed') {
      void updateSession({
        team_a_series_score: 0,
        team_b_series_score: 0,
      });
      lastScoresRef.current = { blue: 0, orange: 0 };
      return;
    }
    if (eventName === 'MatchEnded') {
      // Brak prawidlowego WinnerTeamNum (np. remis w trybach custom) — pomijamy.
      if (winnerTeamNum !== 0 && winnerTeamNum !== 1) return;
      const blueWon = winnerTeamNum === 0;
      const blueIsA = resolveBlueIsTeamA(livePlayers, session, currentMatch);
      const winnerIsA = blueWon ? blueIsA : !blueIsA;
      const field = winnerIsA ? 'team_a_series_score' : 'team_b_series_score';
      const current =
        (winnerIsA ? session.team_a_series_score : session.team_b_series_score) ?? 0;
      void updateSession({ [field]: current + 1 } as Partial<BroadcastSession>);
      lastScoresRef.current = { blue: 0, orange: 0 };
    }
  }, [eventSeq, eventName, winnerTeamNum, session, livePlayers, currentMatch, updateSession]);

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
        lastScoresRef.current = { blue: 0, orange: 0 };
      }
      lastTournamentSetRef.current = newKey;
      return;
    }

    // Sledzimy ostatni niezerowy wynik — przydaje sie do roster-diff baseline.
    const blue = blueScore ?? 0;
    const orange = orangeScore ?? 0;
    const prev = lastScoresRef.current;
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