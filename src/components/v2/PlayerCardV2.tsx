import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { RankIcon } from '@/components/studio/RankIcon';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import { gradientToCss } from '@/lib/gradient-utils';
import { glowToBoxShadow } from '@/lib/glow-utils';
import { positionToStyle } from '@/lib/position-utils';

interface Props {
  player: PlayerLive | null;
  registry: PlayerRegistry | null;
  config?: OverlayV2Config;
  mmrOverride?: { mmr: number | null; rank: string | null } | null;
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function PlayerCardV2({ player, registry, config = defaultOverlayV2Config, mmrOverride }: Props) {
  const c = config.playerCard;
  const debounced = useDebounced(player?.player_name ?? null, 250);
  const visible = c.visible && debounced != null && player != null && debounced === player.player_name;

  const team = (player?.team_num as 0 | 1) ?? 0;
  const teamGradient = team === 0 ? c.blueGradient : c.orangeGradient;

  const skewOuter = `skewX(${c.skewDeg}deg)`;
  const skewInner = `skewX(${-c.skewDeg}deg)`;

  return (
    <AnimatePresence mode="wait">
      {visible && player && (
        <div style={positionToStyle(c.position)}>
        <motion.div
          key={player.player_name}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: (config.general.transitionDuration ?? 350) / 1000, ease: 'easeOut' }}
        >
          <div
            className="relative flex items-stretch"
            style={{
              minWidth: c.width,
              height: c.height,
              transform: skewOuter,
              background: registry?.team_color
                ? `linear-gradient(135deg, ${registry.team_color}cc, ${registry.team_color}99)`
                : gradientToCss(teamGradient),
              boxShadow: glowToBoxShadow({ ...c.glow, color: team === 0 ? c.glow.color : c.glow.color }),
              border: `${c.borderWidth}px solid ${c.borderColor}`,
            }}
          >
            {/* MMR watermark */}
            {c.fields.mmrWatermark && <div
              className="absolute right-6 top-2 pointer-events-none select-none"
              style={{
                transform: skewInner,
                fontFamily: c.mmrFontFamily,
                fontSize: c.mmrFontSize,
                fontWeight: 900,
                lineHeight: 1,
                color: c.mmrColor,
                opacity: c.mmrOpacity,
              }}
            >
              {mmrOverride?.mmr ?? registry?.mmr ?? player.mmr ?? ''}
            </div>}

            {/* Photo */}
            {c.fields.photo && registry?.photo_url && (
              <div
                className="h-full overflow-hidden border-r-2 border-white/15"
                style={{ width: c.photoWidth, transform: skewInner, marginLeft: -12, marginRight: -12 }}
              >
                <img
                  src={registry.photo_url}
                  alt={registry.display_name ?? player.player_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Body */}
            <div className="flex-1 flex flex-col justify-center px-8 gap-2" style={{ transform: skewInner }}>
              <div className="flex items-center gap-3">
                {c.fields.country && registry?.country_code && (
                  <span
                    className="font-bold uppercase px-2 py-0.5 tracking-widest border border-white/20"
                    style={{ fontSize: 12, background: c.countryBg, color: c.countryColor }}
                  >
                    {registry.country_code}
                  </span>
                )}
                <span
                  className="font-black uppercase tracking-tight"
                  style={{
                    fontFamily: c.nickFontFamily,
                    fontSize: c.nickFontSize,
                    color: c.nickColor,
                    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                  }}
                >
                  {registry?.display_name ?? player.player_name}
                </span>
              </div>

              {c.fields.rank && (mmrOverride?.rank || registry?.rank_name) && (
                <div className="flex items-center gap-2">
                  <RankIcon rank={mmrOverride?.rank ?? registry?.rank_name ?? null} size="sm" />
                  <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                    {mmrOverride?.rank ?? registry?.rank_name}
                  </span>
                </div>
              )}

              <div
                className="flex items-center gap-5 mt-1"
                style={{ color: c.statsColor, fontSize: c.statsFontSize }}
              >
                {c.stats.goals && <Stat label="G" value={player.goals} size={c.statsFontSize} />}
                {c.stats.assists && <Stat label="A" value={player.assists} size={c.statsFontSize} />}
                {c.stats.saves && <Stat label="SV" value={player.saves} size={c.statsFontSize} />}
                {c.stats.shots && <Stat label="SH" value={player.shots} size={c.statsFontSize} />}
                {c.stats.demos && <Stat label="D" value={player.demos} size={c.statsFontSize} />}
                {c.stats.boost && <BoostStat boost={player.boost} supersonic={player.is_supersonic} size={c.statsFontSize} />}
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, size }: { label: string; value: number; size: number }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-white/50 font-bold uppercase tracking-wider" style={{ fontSize: Math.round(size * 0.55) }}>{label}</span>
      <span className="font-black tabular-nums" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: size }}>
        {value}
      </span>
    </div>
  );
}

function BoostStat({ boost, supersonic, size }: { boost: number; supersonic: boolean; size: number }) {
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
        className="font-black tabular-nums"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: size,
          color: supersonic ? 'hsl(48 100% 65%)' : 'white',
        }}
      >
        {boost}
      </span>
    </div>
  );
}
