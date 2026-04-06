import { motion } from 'framer-motion';
import type { MatchData, PlayerData } from '@/types/studio';
import { RankIcon } from './RankIcon';

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

function PlayerCard({
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
  const rank = getRankForMode(player, gameMode);

  const gradient =
    side === 'a'
      ? 'linear-gradient(180deg, #F97316, #EA580C)'
      : 'linear-gradient(180deg, #3B82F6, #1D4ED8)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      className="w-[120px] h-[180px] rounded-md shadow-lg shadow-black/40 overflow-hidden"
      style={{
        background: gradient,
        transform: 'skewX(-15deg)',
      }}
    >
      <div
        className="h-full flex flex-col items-center justify-center gap-2 px-3 py-4"
        style={{ transform: 'skewX(15deg)' }}
      >
        <span className="text-sm font-bold text-white text-center truncate w-full">
          {player.nick}
        </span>
        <RankIcon rank={rank} />
        {mmr != null && (
          <span className="text-xs text-white/80 font-mono">{mmr} MMR</span>
        )}
      </div>
    </motion.div>
  );
}

export function MatchCard({ match, gameMode }: MatchCardProps) {
  const stateLabel =
    match.state === 'in_progress' ? 'LIVE' :
    match.state === 'finished' ? 'FINISHED' :
    'UPCOMING';

  const stateColor =
    match.state === 'in_progress' ? 'bg-destructive' :
    match.state === 'finished' ? 'bg-success' :
    'bg-primary';

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
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Round {match.round_index + 1} · BO{match.best_of}
        </span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stateColor} text-primary-foreground`}>
          {stateLabel}
        </span>
      </div>

      {/* Players layout */}
      <div className="flex items-center justify-center">
        {/* Team A */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-team-orange mb-2 uppercase tracking-wide">
            {match.team_a?.name ?? 'TBD'}
          </span>
          <div className="flex items-center gap-2">
            {match.team_a?.players.map((p, i) => (
              <PlayerCard key={p.discord_id} player={p} gameMode={gameMode} side="a" index={i} />
            )) ?? (
              <div className="w-[120px] h-[180px] rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs" style={{ transform: 'skewX(-15deg)' }}>
                TBD
              </div>
            )}
          </div>
        </div>

        {/* VS */}
        <div className="mx-1 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-muted-foreground/60 select-none">
            VS
          </span>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-team-blue mb-2 uppercase tracking-wide">
            {match.team_b?.name ?? 'TBD'}
          </span>
          <div className="flex items-center gap-2">
            {match.team_b?.players.map((p, i) => (
              <PlayerCard key={p.discord_id} player={p} gameMode={gameMode} side="b" index={i + 2} />
            )) ?? (
              <div className="w-[120px] h-[180px] rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs" style={{ transform: 'skewX(-15deg)' }}>
                TBD
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
