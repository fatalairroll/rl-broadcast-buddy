import { motion } from 'framer-motion';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';

interface Props {
  player: PlayerLive;
  registry?: PlayerRegistry | null;
  side: 'left' | 'right';
  isActive?: boolean;
}

const TEAM_COLORS = {
  0: { from: 'hsl(217 91% 45%)', to: 'hsl(217 91% 65%)', glow: 'hsl(217 91% 60%)' },
  1: { from: 'hsl(24 95% 50%)', to: 'hsl(24 95% 65%)', glow: 'hsl(24 95% 60%)' },
} as const;

export function BoostBarV2({ player, registry, side, isActive }: Props) {
  const colors = TEAM_COLORS[(player.team_num as 0 | 1) ?? 0] ?? TEAM_COLORS[0];
  const reverse = side === 'right';
  const displayName = registry?.display_name ?? player.player_name;
  const boost = Math.max(0, Math.min(100, player.boost ?? 0));

  return (
    <div
      className={`relative w-[300px] ${player.is_demolished ? 'opacity-50 grayscale' : ''}`}
      style={{
        transform: 'skewX(-15deg)',
        filter: isActive ? `drop-shadow(0 0 16px ${colors.glow})` : undefined,
      }}
    >
      <div
        className="bg-black/80 border border-white/10 px-3 py-2 flex flex-col gap-1"
        style={{ direction: reverse ? 'rtl' : 'ltr' }}
      >
        {/* Nick + boost number */}
        <div className="flex items-center justify-between" style={{ transform: 'skewX(15deg)', direction: 'ltr' }}>
          <span
            className={`text-white font-bold text-base uppercase truncate ${reverse ? 'order-2 text-right' : 'order-1 text-left'}`}
            style={{ maxWidth: 200, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
          >
            {displayName}
          </span>
          <span
            className={`text-white font-black text-lg tabular-nums ${reverse ? 'order-1' : 'order-2'}`}
            style={{ color: player.is_supersonic ? 'hsl(48 100% 65%)' : 'white' }}
          >
            {boost}
          </span>
        </div>

        {/* Boost bar */}
        <div className="relative h-2 bg-white/10 overflow-hidden">
          <motion.div
            className="absolute inset-y-0"
            style={{
              left: reverse ? 'auto' : 0,
              right: reverse ? 0 : 'auto',
              background: `linear-gradient(${reverse ? '270deg' : '90deg'}, ${colors.from}, ${colors.to})`,
              boxShadow: player.is_supersonic ? `0 0 12px ${colors.glow}` : undefined,
            }}
            animate={{ width: `${boost}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>

        {/* Mini stats */}
        <div
          className={`flex gap-3 text-[11px] font-bold tabular-nums uppercase tracking-wider ${reverse ? 'justify-start' : 'justify-end'}`}
          style={{ transform: 'skewX(15deg)', direction: 'ltr' }}
        >
          <span className="text-white/90">G {player.goals}</span>
          <span className="text-white/70">A {player.assists}</span>
          <span className="text-white/70">SV {player.saves}</span>
          <span className="text-white/50">D {player.demos}</span>
        </div>
      </div>

      {player.is_demolished && (
        <div
          className="absolute inset-0 flex items-center justify-center text-red-500 font-black text-xs uppercase tracking-widest"
          style={{ transform: 'skewX(15deg)', textShadow: '0 0 8px rgba(255,0,0,0.8)' }}
        >
          DEMOLISHED
        </div>
      )}
    </div>
  );
}