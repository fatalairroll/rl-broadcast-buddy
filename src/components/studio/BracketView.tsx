import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { MatchData } from '@/types/studio';

interface BracketViewProps {
  matches: MatchData[];
}

const SKEW = -7;
const UNSKEW = 7;
const BLUE = '#2563eb';
const ORANGE = '#f97316';
const GRAY = 'rgba(255,255,255,0.12)';
const SCROLL_SPEED = 0.3;

interface LineData {
  id: string;
  d: string;
  color: string;
  glow: boolean;
}

export function BracketView({ matches }: BracketViewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lines, setLines] = useState<LineData[]>([]);

  // Group by round
  const sortedRounds = useMemo(() => {
    const rounds = new Map<number, MatchData[]>();
    matches.forEach((m) => {
      const arr = rounds.get(m.round_index) ?? [];
      arr.push(m);
      rounds.set(m.round_index, arr);
    });
    const sorted = [...rounds.entries()].sort(([a], [b]) => a - b);
    sorted.forEach(([, roundMatches]) => {
      roundMatches.sort((a, b) => (a.match_index ?? 0) - (b.match_index ?? 0));
    });
    return sorted;
  }, [matches]);

  // Find first visible round (first with unfinished match)
  const startIdx = useMemo(() => {
    const idx = sortedRounds.findIndex(([, ms]) =>
      ms.some(m => m.state !== 'finished' && m.state !== 'done')
    );
    return idx === -1 ? Math.max(0, sortedRounds.length - 1) : idx;
  }, [sortedRounds]);

  const visibleRounds = useMemo(() => sortedRounds.slice(startIdx), [sortedRounds, startIdx]);

  const calcLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: LineData[] = [];

    for (let ri = 0; ri < visibleRounds.length - 1; ri++) {
      const [, currentRoundMatches] = visibleRounds[ri];
      const [, nextRoundMatches] = visibleRounds[ri + 1];

      for (let mi = 0; mi < currentRoundMatches.length; mi++) {
        const match = currentRoundMatches[mi];
        const nextMatchIdx = Math.floor(mi / 2);
        const nextMatch = nextRoundMatches[nextMatchIdx];
        if (!nextMatch) continue;

        const fromEl = matchRefs.current.get(match.match_id);
        const toEl = matchRefs.current.get(nextMatch.match_id);
        if (!fromEl || !toEl) continue;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const startX = fromRect.right - containerRect.left;
        const startY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const endX = toRect.left - containerRect.left;
        const isUpper = mi % 2 === 0;
        const endY = toRect.top + (isUpper ? toRect.height * 0.3 : toRect.height * 0.7) - containerRect.top;

        const midX = startX + (endX - startX) / 2;
        const d = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;

        let color = GRAY;
        let glow = false;
        if (match.state === 'finished' || match.state === 'done') {
          if (match.winner_team_id === match.team_a?.team_id) {
            color = BLUE;
            glow = true;
          } else if (match.winner_team_id === match.team_b?.team_id) {
            color = ORANGE;
            glow = true;
          }
        }

        newLines.push({ id: `${match.match_id}->${nextMatch.match_id}`, d, color, glow });
      }
    }

    setLines(newLines);
  }, [visibleRounds]);

  useEffect(() => {
    calcLines();
    const ro = new ResizeObserver(() => calcLines());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [calcLines]);

  // Autoscroll ping-pong
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    let rafId: number;
    let direction = 1;
    let running = true;

    const checkAndScroll = () => {
      if (!running) return;
      const maxScroll = outer.scrollHeight - outer.clientHeight;
      if (maxScroll <= 0) {
        rafId = requestAnimationFrame(checkAndScroll);
        return;
      }

      outer.scrollTop += SCROLL_SPEED * direction;
      if (outer.scrollTop >= maxScroll) direction = -1;
      if (outer.scrollTop <= 0) direction = 1;

      rafId = requestAnimationFrame(checkAndScroll);
    };

    // Delay start to allow layout
    const timeout = setTimeout(() => {
      rafId = requestAnimationFrame(checkAndScroll);
    }, 1000);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      clearTimeout(timeout);
    };
  }, [visibleRounds]);

  const setMatchRef = useCallback((matchId: string, el: HTMLDivElement | null) => {
    if (el) {
      matchRefs.current.set(matchId, el);
    } else {
      matchRefs.current.delete(matchId);
    }
  }, []);

  return (
    <div
      ref={outerRef}
      style={{ overflow: 'hidden', height: '100vh' }}
    >
      <div
        ref={containerRef}
        className="relative flex items-start gap-10 p-6"
        style={{ minHeight: 400, overflowX: 'auto' }}
      >
        {/* SVG connector layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {lines.map((line) => (
            <path
              key={line.id}
              d={line.d}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              style={line.glow ? { filter: `drop-shadow(0 0 4px ${line.color}) drop-shadow(0 0 8px ${line.color})` } : undefined}
            />
          ))}
        </svg>

        {/* "Previous rounds finished" indicator */}
        {startIdx > 0 && (
          <div
            className="flex items-center justify-center shrink-0 self-stretch"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            <span
              className="font-esports uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                color: 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              Poprzednie rundy zakończone
            </span>
          </div>
        )}

        {/* Round columns */}
        {visibleRounds.map(([roundIdx, roundMatches], ri) => {
          const originalPosition = startIdx + ri;
          const gap = 16 * Math.pow(2, originalPosition);
          return (
            <div key={roundIdx} className="flex flex-col items-center shrink-0" style={{ gap, minWidth: 200 }}>
              <div
                className="font-esports text-[10px] uppercase tracking-[0.25em] mb-2 px-3 py-1"
                style={{
                  transform: `skewX(${SKEW}deg)`,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ display: 'inline-block', transform: `skewX(${UNSKEW}deg)` }}>
                  Runda {roundIdx + 1}
                </span>
              </div>

              {roundMatches.map((match) => (
                <BracketMatchCard
                  key={match.match_id}
                  match={match}
                  refCallback={(el) => setMatchRef(match.match_id, el)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  refCallback,
}: {
  match: MatchData;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const isLive = match.state === 'in_progress' || match.state === 'live';
  const isFinished = match.state === 'finished' || match.state === 'done';
  const aWon = isFinished && match.winner_team_id === match.team_a?.team_id;
  const bWon = isFinished && match.winner_team_id === match.team_b?.team_id;

  return (
    <div
      ref={refCallback}
      className="relative overflow-hidden"
      style={{
        transform: `skewX(${SKEW}deg)`,
        backdropFilter: 'blur(12px)',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.75) 100%)',
        border: isLive
          ? '1px solid rgba(239,68,68,0.6)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isLive ? '0 0 12px rgba(239,68,68,0.3), 0 0 24px rgba(239,68,68,0.15)' : undefined,
        width: 200,
      }}
    >
      <div
        className="flex items-center justify-between px-2.5 py-1.5"
        style={{
          borderLeft: `3px solid ${BLUE}`,
          transform: `skewX(${UNSKEW}deg)`,
        }}
      >
        <span
          className="font-esports text-xs uppercase tracking-wider truncate"
          style={{ color: '#ffffff', fontWeight: 700, opacity: bWon ? 0.4 : 1 }}
        >
          {match.team_a?.name ?? 'TBD'}
        </span>
        {match.team_a?.seed != null && (
          <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            #{match.team_a.seed}
          </span>
        )}
      </div>

      <div
        className="relative flex items-center justify-center py-0.5"
        style={{
          background: 'rgba(8, 12, 24, 0.95)',
          transform: `skewX(${UNSKEW}deg)`,
        }}
      >
        <div className="absolute left-0 top-0 bottom-0" style={{ width: 2, background: BLUE, boxShadow: `0 0 6px rgba(37,99,235,0.8), 0 0 12px rgba(37,99,235,0.4)` }} />
        <div className="absolute right-0 top-0 bottom-0" style={{ width: 2, background: ORANGE, boxShadow: `0 0 6px rgba(249,115,22,0.8), 0 0 12px rgba(249,115,22,0.4)` }} />
        <span className="font-esports text-xs font-bold tracking-widest" style={{ color: 'hsl(210, 20%, 95%)' }}>
          {match.score_a} : {match.score_b}
        </span>
      </div>

      <div
        className="flex items-center justify-between px-2.5 py-1.5"
        style={{
          borderLeft: `3px solid ${ORANGE}`,
          transform: `skewX(${UNSKEW}deg)`,
        }}
      >
        <span
          className="font-esports text-xs uppercase tracking-wider truncate"
          style={{ color: '#ffffff', fontWeight: 700, opacity: aWon ? 0.4 : 1 }}
        >
          {match.team_b?.name ?? 'TBD'}
        </span>
        {match.team_b?.seed != null && (
          <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            #{match.team_b.seed}
          </span>
        )}
      </div>
    </div>
  );
}
