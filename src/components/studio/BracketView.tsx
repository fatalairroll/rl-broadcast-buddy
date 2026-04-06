import type { MatchData } from '@/types/studio';

interface BracketViewProps {
  matches: MatchData[];
}

export function BracketView({ matches }: BracketViewProps) {
  // Group matches by round_index
  const rounds = new Map<number, MatchData[]>();
  matches.forEach((m) => {
    const arr = rounds.get(m.round_index) ?? [];
    arr.push(m);
    rounds.set(m.round_index, arr);
  });

  const sortedRounds = [...rounds.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="flex gap-6 overflow-x-auto p-4">
      {sortedRounds.map(([roundIdx, roundMatches]) => (
        <div key={roundIdx} className="flex flex-col gap-4 min-w-[220px]">
          <div className="text-xs text-slate-400 uppercase tracking-wider text-center font-semibold mb-1">
            Round {roundIdx + 1}
          </div>
          {roundMatches.map((match) => (
            <BracketMatchCard key={match.match_id} match={match} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BracketMatchCard({ match }: { match: MatchData }) {
  const isLive = match.state === 'in_progress';
  const isFinished = match.state === 'finished';

  return (
    <div
      className={`rounded-lg border p-2.5 text-xs backdrop-blur-sm ${
        isLive
          ? 'border-red-500/60 bg-slate-900/95 shadow-red-500/20 shadow-md'
          : isFinished
          ? 'border-green-600/40 bg-slate-900/80'
          : 'border-slate-700/50 bg-slate-900/70'
      }`}
    >
      <BracketTeamRow
        name={match.team_a?.name ?? 'TBD'}
        score={match.score_a}
        isWinner={isFinished && match.winner_team_id === match.team_a?.team_id}
      />
      <div className="border-t border-slate-700/40 my-1" />
      <BracketTeamRow
        name={match.team_b?.name ?? 'TBD'}
        score={match.score_b}
        isWinner={isFinished && match.winner_team_id === match.team_b?.team_id}
      />
    </div>
  );
}

function BracketTeamRow({
  name,
  score,
  isWinner,
}: {
  name: string;
  score: number;
  isWinner: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 py-0.5 ${isWinner ? 'text-white font-bold' : 'text-slate-400'}`}>
      <span className="truncate">{name}</span>
      <span className="font-mono">{score}</span>
    </div>
  );
}
