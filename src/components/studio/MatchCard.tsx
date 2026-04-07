import { motion } from 'framer-motion';
import type { MatchData, PlayerData } from '@/types/studio';
import { RankIcon } from './RankIcon';
import { getRankFromMmr, normalizeRankName, isValidRank } from '@/lib/rank-utils';

interface MatchCardProps {
  match: MatchData;
  gameMode: string;
}

function getMmrForMode(player: PlayerData, mode: string): number | null {
  if (mode === '1v1') return player.mmr_1v1;
  if (mode === '2v2') return player.mmr_2v2;
  if (mode === '3v3') return player.mmr_3v3;
  return player.mmr_2v2;
}

function getRankForMode(player: PlayerData, mode: string): string | null {
  if (mode === '1v1') return player.rank_1v1;
  if (mode === '2v2') return player.rank_2v2;
  if (mode === '3v3') return player.rank_3v3;
  return player.rank_2v2;
}

function resolveRank(player: PlayerData, mode: string): string | null {
  const rank = getRankForMode(player, mode);
  if (rank && isValidRank(rank)) return normalizeRankName(rank);
  const mmr = getMmrForMode(player, mode);
  if (mmr != null) return getRankFromMmr(mmr);
  return null;
}

const SMOKE_BLUE = [
  'radial-gradient(ellipse 80% 60% at 30% 70%, rgba(37,99,235,0.35) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 80% at 70% 30%, rgba(59,130,246,0.2) 0%, transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 50% 90%, rgba(30,64,175,0.25) 0%, transparent 70%)',
];

const SMOKE_ORANGE = [
  'radial-gradient(ellipse 80% 60% at 70% 70%, rgba(249,115,22,0.35) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 80% at 30% 30%, rgba(251,146,60,0.2) 0%, transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 50% 90%, rgba(194,65,12,0.25) 0%, transparent 70%)',
];

function SmokeLayer({ side }: { side: 'a' | 'b' }) {
  const layers = side === 'a' ? SMOKE_BLUE : SMOKE_ORANGE;
  return (
    <>
      <div
        className="absolute inset-0 animate-smoke-drift pointer-events-none"
        style={{ background: layers[0] }}
      />
      <div
        className="absolute inset-0 animate-smoke-drift-alt pointer-events-none"
        style={{ background: layers[1] }}
      />
      <div
        className="absolute inset-0 animate-smoke-drift pointer-events-none"
        style={{ background: layers[2], animationDelay: '-3s' }}
      />
    </>
  );
}

function MmrHeroText({ mmr, side }: { mmr: number | null; side: 'a' | 'b' }) {
  if (mmr == null) return null;
  const color = side === 'a' ? 'rgba(30,64,175,0.9)' : 'rgba(154,52,18,0.9)';
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2]"
      style={{
        mixBlendMode: 'overlay',
        opacity: 0.4,
      }}
    >
      <span
        className="font-esports font-black select-none"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '90px',
          lineHeight: 1,
          letterSpacing: '0.05em',
          color,
        }}
      >
        {mmr}
      </span>
    </div>
  );
}

function PlayerPanel({
  player,
  gameMode,
  side,
  index,
}: {
  player: PlayerData;
  gameMode: string;
  side: 'a' | 'b';
  index: number;
}) {
  const mmr = getMmrForMode(player, gameMode);
  const rank = resolveRank(player, gameMode);
  const displayName = player.nick_in_game ?? player.nick;

  const gradient =
    side === 'a'
      ? 'linear-gradient(180deg, #2563EB, #1E40AF)'
      : 'linear-gradient(180deg, #F97316, #C2410C)';

  const glowColor = side === 'a' ? '#3B82F6' : '#F97316';
  const boxGlow =
    side === 'a'
      ? '0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15)'
      : '0 0 20px rgba(249,115,22,0.4), 0 0 40px rgba(249,115,22,0.15)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative w-[160px] h-[320px] overflow-hidden"
      style={{
        background: gradient,
        clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: boxGlow,
        transform: 'skewX(-5deg)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Smoke effects */}
      <SmokeLayer side={side} />

      {/* MMR hero watermark */}
      <MmrHeroText mmr={mmr} side={side} />

      {/* Content — counter-skew to keep text upright */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-between py-5 px-4 z-10"
        style={{ transform: 'skewX(5deg)' }}
      >
        {/* Nick at top — centered relative to visible top edge (clipPath 15%-100%) */}
        <div className="w-full text-center" style={{ paddingRight: '15%' }}>
          <span
            className="font-esports font-bold text-white text-sm uppercase tracking-wider drop-shadow-md leading-tight block truncate"
            title={displayName}
          >
            {displayName}
          </span>
        </div>

        {/* Rank icon — center */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <RankIcon rank={rank} size="xl" glowColor={glowColor} />
        </div>
      </div>
    </motion.div>
  );
}

function TbdPanel({ side }: { side: 'a' | 'b' }) {
  const gradient =
    side === 'a'
      ? 'linear-gradient(180deg, #2563EB33, #1E40AF33)'
      : 'linear-gradient(180deg, #F9731633, #C2410C33)';

  return (
    <div
      className="w-[160px] h-[320px] flex items-center justify-center text-white/30 text-sm font-esports font-bold uppercase"
      style={{
        background: gradient,
        clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        transform: 'skewX(-5deg)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ transform: 'skewX(5deg)' }}>TBD</span>
    </div>
  );
}

export function MatchCard({ match, gameMode }: MatchCardProps) {
  const stateLabel =
    match.state === 'in_progress' ? 'LIVE' :
    match.state === 'finished' ? 'FINISHED' :
    'UPCOMING';

  const stateColor =
    match.state === 'in_progress' ? 'bg-red-600' :
    match.state === 'finished' ? 'bg-green-600' :
    'bg-blue-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="font-esports text-xs text-white/50 uppercase tracking-[0.2em] font-semibold">
          Round {match.round_index + 1} · BO{match.best_of}
        </span>
        <span className={`font-esports text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stateColor} text-white`}>
          {stateLabel}
        </span>
      </div>

      {/* Players + VERSUS */}
      <div className="flex items-center justify-center">
        {/* Team A panels */}
        <div className="flex" style={{ gap: '-10px', marginRight: '-8px' }}>
          {match.team_a?.players.map((p, i) => (
            <PlayerPanel key={p.discord_id} player={p} gameMode={gameMode} side="a" index={i} />
          )) ?? <TbdPanel side="a" />}
        </div>

        {/* VERSUS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-3 flex items-center justify-center z-10"
        >
          <span
            className="font-esports text-white/80 font-bold text-4xl uppercase tracking-[0.3em]"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            VS
          </span>
        </motion.div>

        {/* Team B panels */}
        <div className="flex" style={{ gap: '-10px', marginLeft: '-8px' }}>
          {match.team_b?.players.map((p, i) => (
            <PlayerPanel key={p.discord_id} player={p} gameMode={gameMode} side="b" index={i + 2} />
          )) ?? <TbdPanel side="b" />}
        </div>
      </div>

      {/* Team names — white, tight under cards */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex-1 text-center">
          <span className="font-esports text-sm font-bold text-white uppercase tracking-wider">
            {match.team_a?.name ?? 'TBD'}
          </span>
        </div>
        <div className="w-16" />
        <div className="flex-1 text-center">
          <span className="font-esports text-sm font-bold text-white uppercase tracking-wider">
            {match.team_b?.name ?? 'TBD'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
