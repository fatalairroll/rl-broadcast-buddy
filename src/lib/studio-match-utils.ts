import type { MatchData } from '@/types/studio';

/** Drużyna bez przypisanej nazwy lub literalnie "TBD". */
export function isTeamTbd(team: MatchData['team_a']): boolean {
  const name = team?.name?.trim();
  if (!name) return true;
  return name.toUpperCase() === 'TBD';
}

/** Oba sloty puste / TBD — mecz nie powinien być w overlayu next_3. */
export function isFullyTbdMatch(match: MatchData): boolean {
  return isTeamTbd(match.team_a) && isTeamTbd(match.team_b);
}

export function filterNext3VisibleMatches(matches: MatchData[]): MatchData[] {
  return matches.filter((m) => !isFullyTbdMatch(m));
}