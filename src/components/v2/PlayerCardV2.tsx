import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { RankIcon } from '@/components/studio/RankIcon';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';

interface Props {
  player: PlayerLive | null;
  registry: PlayerRegistry | null;
}

/** Debounced display so quick camera flips don't flicker the card. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const TEAM_BG = {
  0: 'linear-gradient(135deg, hsl(217 91% 22% / 0.95), hsl(217 91% 38% / 0.95))',
  1: 'linear-gradient(135deg, hsl(24 95% 28% / 0.95), hsl(24 95% 45% / 0.95))',
} as const;

const TEAM_GLOW = {
  0: 'hsl(217 91% 60%)',
  1: 'hsl(24 95% 60%)',
} as const;

export function PlayerCardV2({ player, registry }: Props) {
  const debounced = useDebounced(player?.player_name ?? null, 250);
  const visible = debounced != null && player != null && debounced === player.player_name;

  return (
    <AnimatePresence mode="wait">
      {visible && player && (
        <motion.div
          key={player.player_name}
          initial={{ y: 60, opacity: 0, skewX: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 60 }}
        >
          <div
            className="relative flex items-stretch min-w-[640px] h-[160px]"
            style={{
              transform: 'skewX(-15deg)',
              background: registry?.team_color
                ? `linear-gradient(135deg, ${registry.team_color}cc, ${registry.team_color}99)`
                : TEAM_BG[(player.team_num as 0 | 1) ?? 0],
              boxShadow: `0 0 48px ${TEAM_GLOW[(player.team_num as 0 | 1) ?? 0]}80`,
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {/* MMR watermark */}
            <div
              className="absolute right-6 top-2 pointer-events-none select-none"
              style={{
                transform: 'skewX(15deg)',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: 98,
                fontWeight: 900,
                lineHeight: 1,
                color: 'rgba(255,255,255,0.07)',
              }}
            >
              {registry?.mmr ?? player.mmr ?? ''}
            </div>

            {/* Photo (optional) */}
            {registry?.photo_url && (
              <div
                className="w-[160px] h-full overflow-hidden border-r-2 border-white/15"
                style={{ transform: 'skewX(15deg)', marginLeft: -12, marginRight: -12 }}
              >
                <img
                  src={registry.photo_url}
                  alt={registry.display_name ?? player.player_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Body */}
            <div
              className="flex-1 flex flex-col justify-center px-8 gap-2"
              style={{ transform: 'skewX(15deg)' }}
            >
              <div className="flex items-center gap-3">
                {registry?.country_code && (
                  <span
                    className="text-xs font-bold uppercase px-2 py-0.5 bg-black/40 text-white tracking-widest border border-white/20"
                  >
                    {registry.country_code}
                  </span>
                )}
                <span
                  className="text-white font-black uppercase text-3xl tracking-tight"
                  style={{ fontFamily: 'Rajdhani, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
                >
                  {registry?.display_name ?? player.player_name}
                </span>
              </div>

              {registry?.rank_name && (
                <div className="flex items-center gap-2">
                  <RankIcon rank={registry.rank_name} size="sm" />
                  <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                    {registry.rank_name}
                  </span>
                </div>
              )}

              {/* Live stats */}
              <div className="flex items-center gap-5 mt-1 text-white">
                <Stat label="G" value={player.goals} />
                <Stat label="A" value={player.assists} />
                <Stat label="SV" value={player.saves} />
                <Stat label="D" value={player.demos} />
                <BoostStat boost={player.boost} supersonic={player.is_supersonic} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-white/50 text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="font-black text-2xl tabular-nums" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        {value}
      </span>
    </div>
  );
}

function BoostStat({ boost, supersonic }: { boost: number; supersonic: boolean }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <div className="relative w-[120px] h-2 bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${boost}%`,
            background: supersonic
              ? 'linear-gradient(90deg, hsl(48 100% 50%), hsl(48 100% 70%))'
              : 'linear-gradient(90deg, hsl(48 95% 55%), hsl(36 95% 60%))',
            boxShadow: supersonic ? '0 0 10px hsl(48 100% 60%)' : undefined,
          }}
        />
      </div>
      <span
        className="font-black text-2xl tabular-nums"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          color: supersonic ? 'hsl(48 100% 65%)' : 'white',
        }}
      >
        {boost}
      </span>
    </div>
  );
}