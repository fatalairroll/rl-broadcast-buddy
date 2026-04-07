import type { MatchData } from '@/types/studio';

interface RecentMatchesTableProps {
  matches: MatchData[];
}

export function RecentMatchesTable({ matches }: RecentMatchesTableProps) {
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400 font-esports text-lg">
        Brak zakończonych meczów
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 w-full max-w-[1200px] mx-auto">
      {matches.map((match) => {
        const aWon = match.winner_team_id === match.team_a?.team_id;
        const bWon = match.winner_team_id === match.team_b?.team_id;

        return (
          <div
            key={match.match_id}
            className="flex items-center gap-0 rounded-lg overflow-hidden"
            style={{
              background: 'rgba(10, 15, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Seed A */}
            <div className="w-[60px] shrink-0 text-center font-esports text-sm"
              style={{ color: 'hsl(215, 16%, 47%)' }}>
              {match.team_a?.seed ? `#${match.team_a.seed}` : ''}
            </div>

            {/* Team A name */}
            <div
              className="flex-1 text-right pr-4 font-esports text-base truncate"
              style={{
                color: aWon ? 'hsl(217, 91%, 70%)' : 'hsl(215, 16%, 40%)',
                fontWeight: aWon ? 700 : 400,
              }}
            >
              {match.team_a?.name ?? 'TBD'}
            </div>

            {/* Score + Round */}
            <div className="w-[120px] shrink-0 flex flex-col items-center py-2">
              <span
                className="font-esports text-xl tracking-wider"
                style={{ color: 'hsl(210, 20%, 93%)' }}
              >
                {match.score_a} : {match.score_b}
              </span>
              <span
                className="font-esports text-xs mt-0.5"
                style={{ color: 'hsl(215, 16%, 47%)' }}
              >
                R{match.round_index}
                {match.match_index != null ? ` M${match.match_index}` : ''}
              </span>
            </div>

            {/* Team B name */}
            <div
              className="flex-1 text-left pl-4 font-esports text-base truncate"
              style={{
                color: bWon ? 'hsl(24, 95%, 58%)' : 'hsl(215, 16%, 40%)',
                fontWeight: bWon ? 700 : 400,
              }}
            >
              {match.team_b?.name ?? 'TBD'}
            </div>

            {/* Seed B */}
            <div className="w-[60px] shrink-0 text-center font-esports text-sm"
              style={{ color: 'hsl(215, 16%, 47%)' }}>
              {match.team_b?.seed ? `#${match.team_b.seed}` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
