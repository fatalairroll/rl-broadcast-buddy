import { useMemo } from 'react';
import type { MatchData } from '@/types/studio';
import type { BroadcastSession } from '@/types/broadcast';
import { getRankFromMmr, isValidRank, normalizeRankName } from '@/lib/rank-utils';

export interface MmrOverride {
  mmr: number | null;
  rank: string | null;
}

/**
 * Resolve MMR/rank for an active in-game player based on:
 *  - the broadcast session's player_pairings map
 *  - the chosen MMRivals match (with player rosters)
 *
 * Returns null when the player is not paired or the match has no data,
 * which lets the PlayerCard fall back to its existing rendering path.
 */
export function useActivePlayerMmrInfo(
  session: BroadcastSession | null,
  match: MatchData | null,
  activePlayerName: string | null,
): MmrOverride | null {
  return useMemo(() => {
    if (!session || !match || !activePlayerName) return null;
    const pairings = session.player_pairings ?? {};
    const entry = pairings[activePlayerName];
    if (!entry || entry.status === 'none') return null;

    const all = [...(match.team_a?.players ?? []), ...(match.team_b?.players ?? [])];
    const player = all.find((p) => p.discord_id === entry.discord_id);
    if (!player) return null;

    // Pick mode based on team size (default 3v3).
    const teamSize = Math.max(
      match.team_a?.players?.length ?? 0,
      match.team_b?.players?.length ?? 0,
    );
    let mmr: number | null = null;
    let rank: string | null = null;
    if (teamSize <= 1) {
      mmr = player.mmr_1v1 ?? null;
      rank = player.rank_1v1 ?? null;
    } else if (teamSize === 2) {
      mmr = player.mmr_2v2 ?? null;
      rank = player.rank_2v2 ?? null;
    } else {
      mmr = player.mmr_3v3 ?? null;
      rank = player.rank_3v3 ?? null;
    }
    // API potrafi zwrócić zaślepkę typu "v" — odrzucamy nieprawidłowe nazwy
    // i wyliczamy rangę z MMR (tak samo jak Studio MatchCard).
    if (rank && isValidRank(rank)) {
      rank = normalizeRankName(rank);
    } else {
      rank = mmr != null ? getRankFromMmr(mmr) : null;
    }
    if (mmr == null && rank == null) return null;
    return { mmr, rank };
  }, [session, match, activePlayerName]);
}