import { motion } from 'framer-motion';
import type { MatchData, PlayerData } from '@/types/studio';
import { RankIcon } from './RankIcon';
import { getRankFromMmr } from '@/lib/rank-utils';

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
  if (rank) return rank;
  const mmr = getMmrForMode(player, mode);
  if (mmr != null) return getRankFromMmr(mmr);
  return null;
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

  const gradient =
    side === 'a'
      ? 'linear-gradient(180deg, #2563EB, #1E40AF)'
      : 'linear-gradient(180deg, #F97316, #C2410C)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative w-[140px] h-[280px] overflow-hidden"
      style={{
        background: gradient,
        clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
      }}
    >
      {/* Vertical nick along left edge */}
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90 font-black text-sm uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {player.nick}
      </span>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
        <RankIcon rank={rank} size="lg" showLabel />
        {mmr != null && (
          <span className="text-xs text-white/70 font-mono">{mmr}</span>
        )}
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
      className="w-[140px] h-[280px] flex items-center justify-center text-white/30 text-sm font-bold uppercase"
      style={{
        background: gradient,
        clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
      }}
    >
      TBD
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
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">
          Round {match.round_index + 1} · BO{match.best_of}
        </span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stateColor} text-white`}>
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
          className="mx-2 flex items-center justify-center z-10"
        >
          <span
            className="text-white/80 font-black text-4xl uppercase tracking-widest"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.3em' }}
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

      {/* Team names bar */}
      <div className="flex items-center justify-between mt-4 px-4">
        <span className="text-sm font-bold text-blue-400 uppercase tracking-wide">
          {match.team_a?.name ?? 'TBD'}
        </span>
        <span className="text-sm font-bold text-orange-400 uppercase tracking-wide">
          {match.team_b?.name ?? 'TBD'}
        </span>
      </div>
    </motion.div>
  );
}
