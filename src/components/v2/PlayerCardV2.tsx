import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getRankIcon, getRankFromMmr } from '@/lib/rank-utils';
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

  // Resolve effective MMR / rank with fallback chain so the rank icon
  // shows up in live mode (where players_registry can be empty) by
  // deriving the rank from players_live.mmr supplied by the Python bot.
  const effectiveMmr =
    mmrOverride?.mmr ?? registry?.mmr ?? player?.mmr ?? null;
  const effectiveRank =
    mmrOverride?.rank ??
    registry?.rank_name ??
    (effectiveMmr != null ? getRankFromMmr(effectiveMmr) : null);
  const rankIconSrc = effectiveRank ? getRankIcon(effectiveRank) : null;

  // Anchors for absolute child elements inside the card. The body area
  // starts after the optional photo. Nick sits ~30% from top, stats ~70%.
  const photoOffset = c.fields.photo && registry?.photo_url ? c.photoWidth : 0;
  const bodyLeft = photoOffset + 32;

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
          <div className="relative" style={{ width: c.width, height: c.height }}>
          <div
            className="relative flex items-stretch"
            style={{
              width: c.width,
              height: c.height,
              overflow: 'hidden',
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
              {effectiveMmr ?? ''}
            </div>}

            {/* Rank icon — absolutely positioned so its size/offset
                never affects nick or stats layout. */}
            {c.fields.rank && rankIconSrc && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: photoOffset + 24,
                  top: '50%',
                  transform: `translateY(-50%) translate(${c.rankOffsetX ?? 0}px, ${c.rankOffsetY ?? 0}px) ${skewInner}`,
                  transformOrigin: 'left center',
                }}
              >
                <img
                  src={rankIconSrc}
                  alt={effectiveRank ?? ''}
                  width={c.rankIconSize}
                  height={c.rankIconSize}
                  className="object-contain drop-shadow-lg"
                  draggable={false}
                />
              </div>
            )}

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

            {/* Stats row (absolute — independent of nick) */}
            <div
              className="absolute flex items-center gap-5"
              style={{
                left: bodyLeft,
                top: '72%',
                transform: `translateY(-50%) translate(${c.statsOffsetX ?? 0}px, ${c.statsOffsetY ?? 0}px) ${skewInner}`,
                transformOrigin: 'left center',
                color: c.statsColor,
                fontSize: c.statsFontSize,
                whiteSpace: 'nowrap',
              }}
            >
              {c.stats.goals && <Stat label="G" value={player.goals} size={c.statsFontSize} />}
              {c.stats.assists && <Stat label="A" value={player.assists} size={c.statsFontSize} />}
              {c.stats.saves && <Stat label="SV" value={player.saves} size={c.statsFontSize} />}
              {c.stats.shots && <Stat label="SH" value={player.shots} size={c.statsFontSize} />}
              {c.stats.demos && <Stat label="D" value={player.demos} size={c.statsFontSize} />}
              {c.stats.boost && <BoostStat boost={player.boost} supersonic={player.is_supersonic} size={c.statsFontSize} />}
            </div>
          </div>

          {/* Nick row — rendered OUTSIDE the clip-box so offsets can push it
              freely beyond the card boundaries. */}
          <div
            className="absolute flex items-center gap-3 pointer-events-none"
            style={{
              left: bodyLeft,
              top: '32%',
              transform: `translateY(-50%) translate(${c.nickOffsetX ?? 0}px, ${c.nickOffsetY ?? 0}px)`,
              transformOrigin: 'left center',
              whiteSpace: 'nowrap',
            }}
          >
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
                lineHeight: 1,
              }}
            >
              {registry?.display_name ?? player.player_name}
            </span>
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
    <div className="flex items-center gap-2 ml-3">
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
