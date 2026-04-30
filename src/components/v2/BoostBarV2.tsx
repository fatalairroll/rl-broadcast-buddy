import { motion } from 'framer-motion';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';

interface Props {
  player: PlayerLive;
  registry?: PlayerRegistry | null;
  side: 'left' | 'right';
  isActive?: boolean;
  config?: OverlayV2Config;
}

export function BoostBarV2({ player, registry, side, isActive, config = defaultOverlayV2Config }: Props) {
  const c = config.boostBar;
  const team = (player.team_num as 0 | 1) ?? 0;
  const colors = team === 0
    ? { from: c.blueFrom, to: c.blueTo, glow: c.blueGlow }
    : { from: c.orangeFrom, to: c.orangeTo, glow: c.orangeGlow };

  const reverse = side === 'right';
  const displayName = registry?.display_name ?? player.player_name;
  const boost = Math.max(0, Math.min(100, player.boost ?? 0));

  return (
    <div
      className={`relative ${player.is_demolished ? 'opacity-50 grayscale' : ''}`}
      style={{
        width: c.width,
        transform: `skewX(${c.skewDeg}deg)`,
        filter: isActive ? `drop-shadow(0 0 16px ${colors.glow})` : undefined,
      }}
    >
      <div
        className="flex flex-col gap-1"
        style={{
          background: c.background,
          border: `1px solid ${c.borderColor}`,
          padding: `${c.paddingY}px ${c.paddingX}px`,
          direction: reverse ? 'rtl' : 'ltr',
        }}
      >
        {/* Nick + boost number */}
        <div className="flex items-center justify-between" style={{ transform: `skewX(${-c.skewDeg}deg)`, direction: 'ltr' }}>
          <span
            className={`uppercase truncate ${reverse ? 'order-2 text-right' : 'order-1 text-left'}`}
            style={{
              maxWidth: c.width - 80,
              fontFamily: c.nameFontFamily,
              letterSpacing: '0.05em',
              fontWeight: 700,
              fontSize: c.nameFontSize,
              color: c.nameColor,
            }}
          >
            {displayName}
          </span>
          <span
            className={`tabular-nums ${reverse ? 'order-1' : 'order-2'}`}
            style={{
              fontWeight: 900,
              fontSize: c.boostFontSize,
              color: player.is_supersonic ? c.supersonicColor : c.nameColor,
            }}
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
        {c.showStats && (
          <div
            className={`flex gap-3 tabular-nums uppercase tracking-wider ${reverse ? 'justify-start' : 'justify-end'}`}
            style={{
              transform: `skewX(${-c.skewDeg}deg)`,
              direction: 'ltr',
              fontSize: c.statsFontSize,
              fontWeight: 700,
              color: c.statsColor,
            }}
          >
            <span>G {player.goals}</span>
            <span style={{ opacity: 0.8 }}>A {player.assists}</span>
            <span style={{ opacity: 0.8 }}>SV {player.saves}</span>
            <span style={{ opacity: 0.6 }}>D {player.demos}</span>
          </div>
        )}
      </div>

      {player.is_demolished && (
        <div
          className="absolute inset-0 flex items-center justify-center font-black text-xs uppercase tracking-widest"
          style={{ transform: `skewX(${-c.skewDeg}deg)`, color: c.demolishedColor, textShadow: `0 0 8px ${c.demolishedColor}` }}
        >
          DEMOLISHED
        </div>
      )}
    </div>
  );
}
