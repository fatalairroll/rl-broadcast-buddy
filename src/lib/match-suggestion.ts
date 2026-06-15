import type { MatchData } from '@/types/studio';
import type { SeriesType } from '@/types/broadcast';
import { findBestMatch, flattenMatchPlayers } from './player-matching';

export interface MatchSuggestion {
  match: MatchData;
  matchedPlayers: number;
  totalLiveNames: number;
  totalRosterSlots: number;
  liveState: 'live' | 'in_progress' | 'scheduled' | 'other';
}

export interface SuggestArgs {
  livePlayerNames: string[];
  matches: MatchData[];
  tournamentMode?: string;
  limit?: number;
}

function modeToTeamSize(mode?: string): number {
  const m = (mode ?? '').match(/(\d+)\s*v\s*\d+/i);
  if (m) return Math.max(1, parseInt(m[1], 10));
  return 3;
}

function isExcludedState(state: MatchData['state']): boolean {
  return state === 'finished' || state === 'done';
}

function liveStateOf(state: MatchData['state']): MatchSuggestion['liveState'] {
  if (state === 'live') return 'live';
  if (state === 'in_progress') return 'in_progress';
  if (state === 'scheduled') return 'scheduled';
  return 'other';
}

function countMatchedPlayers(livePlayerNames: string[], match: MatchData): number {
  const candidates = flattenMatchPlayers(match);
  if (candidates.length === 0) return 0;
  const proposals: Array<{ name: string; discord_id: string; score: number }> = [];
  for (const name of livePlayerNames) {
    const m = findBestMatch(name, candidates);
    if (m) proposals.push({ name, discord_id: m.candidate.discord_id, score: m.score });
  }
  proposals.sort((a, b) => a.score - b.score);
  const usedDiscord = new Set<string>();
  const usedName = new Set<string>();
  let matched = 0;
  for (const p of proposals) {
    if (usedDiscord.has(p.discord_id)) continue;
    if (usedName.has(p.name)) continue;
    usedDiscord.add(p.discord_id);
    usedName.add(p.name);
    matched += 1;
  }
  return matched;
}

export function suggestMatches(args: SuggestArgs): MatchSuggestion[] {
  const { livePlayerNames, matches, tournamentMode, limit } = args;
  if (!livePlayerNames || livePlayerNames.length === 0) return [];
  if (!matches || matches.length === 0) return [];

  const teamSize = modeToTeamSize(tournamentMode);
  const totalRosterSlots = teamSize * 2;

  const candidates = matches.filter((m) => {
    if (!m.team_a?.team_id || !m.team_b?.team_id) return false;
    if (isExcludedState(m.state)) return false;
    const rosterCount =
      (m.team_a?.players?.length ?? 0) + (m.team_b?.players?.length ?? 0);
    return rosterCount > 0;
  });

  const scored: MatchSuggestion[] = [];
  for (const m of candidates) {
    const matchedPlayers = countMatchedPlayers(livePlayerNames, m);
    if (matchedPlayers === 0) continue;
    scored.push({
      match: m,
      matchedPlayers,
      totalLiveNames: livePlayerNames.length,
      totalRosterSlots,
      liveState: liveStateOf(m.state),
    });
  }

  scored.sort((a, b) => {
    if (b.matchedPlayers !== a.matchedPlayers) return b.matchedPlayers - a.matchedPlayers;
    const aLive = a.liveState === 'live' || a.liveState === 'in_progress' ? 1 : 0;
    const bLive = b.liveState === 'live' || b.liveState === 'in_progress' ? 1 : 0;
    if (bLive !== aLive) return bLive - aLive;
    const aRound = a.match.round_index ?? 0;
    const bRound = b.match.round_index ?? 0;
    if (aRound !== bRound) return aRound - bRound;
    const aIdx = a.match.match_index ?? 0;
    const bIdx = b.match.match_index ?? 0;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.match.match_id.localeCompare(b.match.match_id);
  });

  return scored.slice(0, limit ?? 3);
}

export function bestOfToSeriesType(bestOf: number | null | undefined): SeriesType {
  switch (bestOf) {
    case 1:
      return 'bo1';
    case 5:
      return 'bo5';
    case 7:
      return 'bo7';
    case 3:
    default:
      return 'bo3';
  }
}