import { motion, AnimatePresence } from 'framer-motion';
import type { MatchData } from '@/types/studio';
import {
  type StudioTheme,
  glassBarBlue,
  glassBarOrange,
  glassBarDead,
  glassScoreBox,
  glassScoreDigitWin,
  glassScoreDigitLose,
  glassChip,
  glassSpecularSweep,
  chamferLeft,
  chamferRight,
  glassName,
  glassNameDead,
  glassLabel,
  glassContentLayer,
} from '@/lib/studio-glass-theme';

interface RecentMatchesTableProps {
  matches: MatchData[];
  theme?: StudioTheme;
}

const STD_SKEW = -15;
const STD_UNSKEW = 15;

function Header({ skew, unskew }: { skew: number; unskew: number }) {
  return (
    <div
      className="flex items-stretch overflow-hidden mb-0.5"
      style={{
        transform: skew ? `skewX(${skew}deg)` : undefined,
        background: 'rgba(10, 15, 28, 0.95)',
        borderBottom: '2px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Team A side */}
      <div
        className="flex-1 flex items-center justify-end gap-4 px-4 py-1"
        style={{ transform: unskew ? `skewX(${unskew}deg)` : undefined }}
      >
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500 w-8 text-center">
          SEED
        </span>
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500 flex-1 text-right">
          TEAM
        </span>
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500 w-16 text-right">
          AVG MMR
        </span>
      </div>

      {/* Score header */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 100,
          transform: unskew ? `skewX(${unskew}deg)` : undefined,
        }}
      >
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500">
          SCORE
        </span>
      </div>

      {/* Team B side */}
      <div
        className="flex-1 flex items-center justify-start gap-4 px-4 py-1"
        style={{ transform: unskew ? `skewX(${unskew}deg)` : undefined }}
      >
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500 w-16 text-left">
          AVG MMR
        </span>
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500 flex-1 text-left">
          TEAM
        </span>
        <span className="font-esports text-[10px] uppercase tracking-[0.25em] text-slate-500 w-8 text-center">
          SEED
        </span>
      </div>
    </div>
  );
}

function SeedBadge({ seed }: { seed?: number }) {
  if (seed == null) return <div className="w-8" />;
  return (
    <div
      className="w-5 h-5 flex items-center justify-center font-esports text-[9px] font-bold shrink-0"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'hsl(215, 16%, 55%)',
      }}
    >
      {seed}
    </div>
  );
}

function MatchRow({
  match,
  index,
  theme,
}: {
  match: MatchData;
  index: number;
  theme: StudioTheme;
}) {
  const aWon = match.winner_team_id === match.team_a?.team_id;
  const bWon = match.winner_team_id === match.team_b?.team_id;
  const isGlass = theme === 'sharp-glass';
  const skew = isGlass ? 0 : STD_SKEW;
  const unskew = isGlass ? 0 : STD_UNSKEW;

  const borderColor = aWon
    ? '#2563eb'
    : bWon
      ? '#f97316'
      : 'rgba(255,255,255,0.06)';

  // Glass styling for halves
  const sideAStyle = isGlass
    ? (bWon ? glassBarDead : glassBarBlue)
    : undefined;
  const sideBStyle = isGlass
    ? (aWon ? glassBarDead : glassBarOrange)
    : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      className="flex items-stretch overflow-hidden"
      style={
        isGlass
          ? { gap: 4 }
          : {
              transform: `skewX(${skew}deg)`,
              background: 'linear-gradient(90deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%)',
              borderLeft: `4px solid ${borderColor}`,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }
      }
    >
      {/* Team A side */}
      <div
        className="flex-1 flex items-center justify-end gap-2 px-3 py-1 min-w-0"
        style={isGlass
          ? { ...sideAStyle!, ...chamferLeft(10) }
          : { transform: `skewX(${unskew}deg)` }}
      >
        {isGlass && <div style={glassSpecularSweep} aria-hidden />}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end" style={isGlass ? glassContentLayer : undefined}>
          <SeedBadge seed={match.team_a?.seed} />
          <span
            className="text-xs uppercase tracking-wider truncate flex-1 text-right"
            style={isGlass
              ? { ...(bWon ? glassNameDead : glassName), fontSize: 14 }
              : { fontFamily: 'Rajdhani, Inter, sans-serif', color: '#ffffff', fontWeight: 500 }}
          >
            {match.team_a?.name ?? 'TBD'}
          </span>
          <span
            className="font-mono text-[10px] shrink-0 w-14 text-right"
            style={{ color: isGlass ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}
          >
            {match.team_a?.avg_mmr ?? '—'}
          </span>
        </div>
      </div>

      {/* Central Score Block */}
      <div
        className="shrink-0 flex flex-col items-center justify-center relative"
        style={isGlass
          ? { width: 85, ...glassScoreBox }
          : {
              width: 85,
              background: 'rgba(8, 12, 24, 0.95)',
              transform: `skewX(${unskew}deg)`,
            }}
      >
        {isGlass && <div style={glassSpecularSweep} aria-hidden />}
        {!isGlass && (
          <>
            <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: '#2563eb', boxShadow: '0 0 8px rgba(37,99,235,0.8), 0 0 16px rgba(37,99,235,0.4)' }} />
            <div className="absolute right-0 top-0 bottom-0" style={{ width: 3, background: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.8), 0 0 16px rgba(249,115,22,0.4)' }} />
          </>
        )}

        <div style={isGlass ? glassContentLayer : undefined} className="flex flex-col items-center">
          {isGlass ? (
            <span className="text-base font-bold tracking-widest" style={{ ...glassLabel, fontStyle: 'normal', letterSpacing: '.08em', color: '#fff' }}>
              <span style={aWon ? glassScoreDigitWin : glassScoreDigitLose}>{match.score_a}</span>
              <span style={{ opacity: 0.5, margin: '0 4px' }}>:</span>
              <span style={bWon ? glassScoreDigitWin : glassScoreDigitLose}>{match.score_b}</span>
            </span>
          ) : (
            <span className="font-esports text-sm font-bold tracking-widest" style={{ color: 'hsl(210, 20%, 95%)' }}>
              {match.score_a} : {match.score_b}
            </span>
          )}

          <div
            className="mt-0.5 px-2 py-0.5"
            style={isGlass
              ? { ...glassChip, ...chamferTag, marginTop: 4 }
              : { background: 'rgba(255,255,255,0.05)' }}
          >
            <span
              className="font-esports text-[9px] uppercase tracking-[0.2em]"
              style={{ color: isGlass ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}
            >
              R{match.round_index}
              {match.match_index != null ? ` M${match.match_index}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Team B side */}
      <div
        className="flex-1 flex items-center justify-start gap-2 px-3 py-1 min-w-0"
        style={isGlass
          ? { ...sideBStyle!, ...chamferRight(10) }
          : { transform: `skewX(${unskew}deg)` }}
      >
        {isGlass && <div style={glassSpecularSweep} aria-hidden />}
        <div className="flex items-center gap-2 flex-1 min-w-0" style={isGlass ? glassContentLayer : undefined}>
          <span
            className="font-mono text-[10px] shrink-0 w-14 text-left"
            style={{ color: isGlass ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}
          >
            {match.team_b?.avg_mmr ?? '—'}
          </span>
          <span
            className="text-xs uppercase tracking-wider truncate flex-1 text-left"
            style={isGlass
              ? { ...(aWon ? glassNameDead : glassName), fontSize: 14 }
              : { fontFamily: 'Rajdhani, Inter, sans-serif', color: '#ffffff', fontWeight: 500 }}
          >
            {match.team_b?.name ?? 'TBD'}
          </span>
          <SeedBadge seed={match.team_b?.seed} />
        </div>
      </div>
    </motion.div>
  );
}

export function RecentMatchesTable({ matches, theme = 'standard' }: RecentMatchesTableProps) {
  const isGlass = theme === 'sharp-glass';
  const skew = isGlass ? 0 : STD_SKEW;
  const unskew = isGlass ? 0 : STD_UNSKEW;
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 font-esports text-lg" style={{ color: 'hsl(215, 16%, 45%)' }}>
        Brak zakończonych meczów
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-0.5 p-3 w-full mx-auto"
      style={{
        backdropFilter: 'blur(16px)',
      }}
    >
      <Header skew={skew} unskew={unskew} />
      <AnimatePresence mode="popLayout">
        {matches.map((match, index) => (
          <MatchRow key={match.match_id} match={match} index={index} theme={theme} />
        ))}
      </AnimatePresence>
    </div>
  );
}
