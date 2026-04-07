import { motion, AnimatePresence } from 'framer-motion';
import type { MatchData } from '@/types/studio';

interface RecentMatchesTableProps {
  matches: MatchData[];
}

function TeamSide({
  name,
  seed,
  avgMmr,
  isWinner,
  side,
}: {
  name: string;
  seed?: number;
  avgMmr?: number;
  isWinner: boolean;
  side: 'a' | 'b';
}) {
  const winColor = side === 'a' ? '#2563eb' : '#f97316';
  const loseColor = 'hsl(215, 16%, 40%)';
  const textShadow = isWinner
    ? `0 0 8px ${side === 'a' ? 'rgba(37,99,235,0.6)' : 'rgba(249,115,22,0.6)'}`
    : 'none';

  const isLeft = side === 'a';

  return (
    <div
      className={`flex items-center gap-3 flex-1 min-w-0 ${isLeft ? 'justify-end' : 'justify-start'}`}
      style={{ transform: 'skewX(5deg)' }}
    >
      {isLeft && (
        <>
          {seed != null && (
            <span
              className="font-esports text-xs shrink-0"
              style={{ color: 'hsl(215, 16%, 47%)' }}
            >
              #{seed}
            </span>
          )}
          <span
            className="font-esports text-base uppercase truncate"
            style={{
              color: isWinner ? winColor : loseColor,
              fontWeight: isWinner ? 700 : 400,
              textShadow,
            }}
          >
            {name}
          </span>
          {avgMmr != null && (
            <span
              className="font-mono text-xs shrink-0"
              style={{ color: 'hsl(215, 16%, 47%)' }}
            >
              {avgMmr}
            </span>
          )}
        </>
      )}
      {!isLeft && (
        <>
          {avgMmr != null && (
            <span
              className="font-mono text-xs shrink-0"
              style={{ color: 'hsl(215, 16%, 47%)' }}
            >
              {avgMmr}
            </span>
          )}
          <span
            className="font-esports text-base uppercase truncate"
            style={{
              color: isWinner ? winColor : loseColor,
              fontWeight: isWinner ? 700 : 400,
              textShadow,
            }}
          >
            {name}
          </span>
          {seed != null && (
            <span
              className="font-esports text-xs shrink-0"
              style={{ color: 'hsl(215, 16%, 47%)' }}
            >
              #{seed}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function ScoreBlock({
  scoreA,
  scoreB,
  roundIndex,
  matchIndex,
}: {
  scoreA: number;
  scoreB: number;
  roundIndex: number;
  matchIndex?: number;
}) {
  return (
    <div
      className="shrink-0 flex flex-col items-center justify-center px-6 py-2"
      style={{
        background: 'linear-gradient(90deg, rgba(37,99,235,0.5), rgba(249,115,22,0.5))',
        minWidth: '120px',
      }}
    >
      <span
        className="font-esports text-xl font-bold tracking-wider"
        style={{ color: 'hsl(210, 20%, 95%)' }}
      >
        {scoreA} : {scoreB}
      </span>
      <span
        className="font-esports text-[10px] uppercase tracking-widest mt-0.5"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        Runda {roundIndex}
        {matchIndex != null ? ` Mecz ${matchIndex}` : ''}
      </span>
    </div>
  );
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
    <div className="flex flex-col gap-3 p-6 w-full max-w-[1100px] mx-auto">
      <AnimatePresence mode="popLayout">
        {matches.map((match, index) => {
          const aWon = match.winner_team_id === match.team_a?.team_id;
          const bWon = match.winner_team_id === match.team_b?.team_id;

          return (
            <motion.div
              key={match.match_id}
              layout
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: 'easeOut',
              }}
              className="flex items-stretch overflow-hidden"
              style={{
                background: 'rgba(10, 15, 30, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '2px solid transparent',
                borderImage: 'linear-gradient(90deg, #2563eb, #f97316) 1',
                borderImageSlice: 1,
                transform: 'skewX(-5deg)',
                boxShadow: aWon
                  ? '0 0 12px rgba(37,99,235,0.15)'
                  : bWon
                    ? '0 0 12px rgba(249,115,22,0.15)'
                    : 'none',
              }}
            >
              {/* Team A */}
              <div className="flex-1 flex items-center px-4 py-3 min-w-0">
                <TeamSide
                  name={match.team_a?.name ?? 'TBD'}
                  seed={match.team_a?.seed}
                  avgMmr={match.team_a?.avg_mmr}
                  isWinner={aWon}
                  side="a"
                />
              </div>

              {/* Score */}
              <ScoreBlock
                scoreA={match.score_a}
                scoreB={match.score_b}
                roundIndex={match.round_index}
                matchIndex={match.match_index}
              />

              {/* Team B */}
              <div className="flex-1 flex items-center px-4 py-3 min-w-0">
                <TeamSide
                  name={match.team_b?.name ?? 'TBD'}
                  seed={match.team_b?.seed}
                  avgMmr={match.team_b?.avg_mmr}
                  isWinner={bWon}
                  side="b"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
