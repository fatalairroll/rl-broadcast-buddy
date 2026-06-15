import type { MatchData } from '@/types/studio';
import { findBestMatch, flattenMatchPlayers, type PairingMap } from './player-matching';

export function minPlayersForMode(mode: string | undefined | null): number {
  const m = (mode ?? '').toLowerCase();
  if (m.includes('3v3')) return 6;
  if (m.includes('2v2')) return 4;
  if (m.includes('1v1')) return 2;
  return 2;
}

/**
 * Resolve which currently live RL players are tournament participants
 * (excludes commentators / random spectators). Returns a Set of discord_ids.
 *
 * 1) Use explicit player_pairings (auto or manual) when available.
 * 2) Otherwise fuzzy-match via findBestMatch against bracket roster.
 * 3) Unknown nicks -> excluded.
 */
export function getTournamentPlayerIds(args: {
  livePlayers: { player_name: string }[];
  currentMatch: MatchData | null;
  pairings?: PairingMap | null;
}): Set<string> {
  const { livePlayers, currentMatch, pairings } = args;
  const ids = new Set<string>();
  if (!currentMatch) return ids;
  const candidates = flattenMatchPlayers(currentMatch);
  if (candidates.length === 0) return ids;

  for (const p of livePlayers) {
    const name = p.player_name;
    const entry = pairings?.[name];
    if (entry && (entry.status === 'auto' || entry.status === 'manual') && entry.discord_id) {
      ids.add(entry.discord_id);
      continue;
    }
    const best = findBestMatch(name, candidates);
    if (best) ids.add(best.candidate.discord_id);
  }
  return ids;
}

export function setToKey(ids: Set<string>): string {
  return [...ids].sort().join('|');
}