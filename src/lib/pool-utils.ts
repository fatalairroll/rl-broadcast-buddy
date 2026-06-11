import type { PoolData } from '@/types/studio';

export function poolIdFromMatchId(matchId: string): string | null {
  const m = matchId.match(/^(.+-POOL-\d+|.+-WINNERS)-R\d+-M\d+/);
  return m ? m[1] : null;
}

export function isPoolTournament(pools?: PoolData[]): boolean {
  return (pools ?? []).some((p) => p.index > 0);
}

/** Poole fazowe (index 1..N) + WINNERS jako osobna zakładka na końcu */
export function selectablePools(pools?: PoolData[]): PoolData[] {
  if (!pools?.length) return [];
  const phase = pools.filter((p) => p.index > 0).sort((a, b) => a.index - b.index);
  const winners = pools.find((p) => p.pool_id.includes('WINNERS') && p.index === 0);
  if (winners) return [...phase, winners];
  return phase;
}

export function poolTabLabel(pool: PoolData): string {
  if (pool.pool_id.includes('WINNERS')) return 'FINAŁ';
  return `POOL ${pool.index}`;
}

export function poolBadge(poolId?: string | null): string | null {
  if (!poolId) return null;
  const m = poolId.match(/-POOL-(\d+)/);
  if (m) return `P${m[1]}`;
  if (poolId.includes('WINNERS')) return 'F';
  return null;
}