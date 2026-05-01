import type { MatchData, PlayerData } from '@/types/studio';

export interface MmrivalsPlayerCandidate {
  discord_id: string;
  nick: string;
  nick_in_game: string | null;
  team_id: string;
  team_name: string;
}

export type PairingStatus = 'auto' | 'manual' | 'none';

export interface PairingEntry {
  discord_id: string;
  status: PairingStatus;
}

export type PairingMap = Record<string, PairingEntry>;

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array(n + 1)
    .fill(0)
    .map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) dp[j] = prev;
      else dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

export function flattenMatchPlayers(match: MatchData | null): MmrivalsPlayerCandidate[] {
  if (!match) return [];
  const out: MmrivalsPlayerCandidate[] = [];
  for (const team of [match.team_a, match.team_b]) {
    if (!team) continue;
    for (const p of team.players ?? []) {
      out.push({
        discord_id: p.discord_id,
        nick: p.nick,
        nick_in_game: p.nick_in_game ?? null,
        team_id: team.team_id,
        team_name: team.name,
      });
    }
  }
  return out;
}

export function findBestMatch(
  inGameName: string,
  candidates: MmrivalsPlayerCandidate[],
): { candidate: MmrivalsPlayerCandidate; score: number } | null {
  const target = norm(inGameName);
  if (!target || candidates.length === 0) return null;

  // 1. Exact match on nick_in_game
  for (const c of candidates) {
    if (c.nick_in_game && norm(c.nick_in_game) === target) {
      return { candidate: c, score: 0 };
    }
  }
  // 2. Exact match on nick
  for (const c of candidates) {
    if (norm(c.nick) === target) {
      return { candidate: c, score: 0 };
    }
  }
  // 3. Fuzzy: substring or Levenshtein <= 2 on nick_in_game first, then nick
  let best: { candidate: MmrivalsPlayerCandidate; score: number } | null = null;
  for (const c of candidates) {
    const fields = [c.nick_in_game, c.nick].filter(Boolean) as string[];
    for (const f of fields) {
      const fn = norm(f);
      if (!fn) continue;
      if (fn.includes(target) || target.includes(fn)) {
        const score = Math.abs(fn.length - target.length) + 0.5;
        if (!best || score < best.score) best = { candidate: c, score };
        continue;
      }
      const dist = levenshtein(fn, target);
      if (dist <= 2) {
        const score = dist + 1;
        if (!best || score < best.score) best = { candidate: c, score };
      }
    }
  }
  return best;
}

export function autoPair(
  inGameNames: string[],
  candidates: MmrivalsPlayerCandidate[],
): PairingMap {
  const used = new Set<string>();
  const result: PairingMap = {};
  // Sort: prefer exact matches first by trying short names later? simpler: process all and avoid double-assigning
  // Greedy with score order: compute all candidate matches, then pick best non-conflicting
  const proposals: Array<{
    name: string;
    discord_id: string;
    score: number;
  }> = [];
  for (const name of inGameNames) {
    const m = findBestMatch(name, candidates);
    if (m) proposals.push({ name, discord_id: m.candidate.discord_id, score: m.score });
  }
  proposals.sort((a, b) => a.score - b.score);
  for (const p of proposals) {
    if (used.has(p.discord_id)) continue;
    if (result[p.name]) continue;
    used.add(p.discord_id);
    result[p.name] = { discord_id: p.discord_id, status: 'auto' };
  }
  return result;
}