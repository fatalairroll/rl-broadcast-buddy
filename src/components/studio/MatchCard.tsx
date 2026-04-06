import { motion } from 'framer-motion';
import type { MatchData } from '@/types/studio';
import { PlayerRow } from './PlayerRow';

interface MatchCardProps {
  match: MatchData;
  gameMode: string;
}

export function MatchCard({ match, gameMode }: MatchCardProps) {
  const stateLabel =
    match.state === 'in_progress' ? 'LIVE' :
    match.state === 'finished' ? 'FINISHED' :
    'UPCOMING';

  const stateColor =
    match.state === 'in_progress' ? 'bg-red-500' :
    match.state === 'finished' ? 'bg-green-600' :
    'bg-blue-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl border border-slate-700/60 bg-slate-900/90 p-4 shadow-lg shadow-black/30 backdrop-blur-sm w-[480px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          Round {match.round_index + 1} &middot; BO{match.best_of}
        </span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stateColor} text-white`}>
          {stateLabel}
        </span>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Team A */}
        <TeamSide team={match.team_a} score={match.score_a} gameMode={gameMode} />

        <div className="text-xl font-bold text-slate-500 text-center">VS</div>

        {/* Team B */}
        <TeamSide team={match.team_b} score={match.score_b} gameMode={gameMode} />
      </div>
    </motion.div>
  );
}

function TeamSide({
  team,
  score,
  gameMode,
}: {
  team: MatchData['team_a'];
  score: number;
  gameMode: string;
}) {
  if (!team) {
    return <div className="text-sm text-slate-500 italic">TBD</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-white truncate">{team.name}</span>
        <span className="text-2xl font-black text-white ml-2">{score}</span>
      </div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">
        Avg MMR: <span className="text-slate-300 font-semibold">{team.avg_mmr}</span>
        {' · '}Seed #{team.seed}
      </div>
      <div className="space-y-0.5">
        {team.players.map((p) => (
          <PlayerRow key={p.discord_id} player={p} gameMode={gameMode} />
        ))}
      </div>
    </div>
  );
}
