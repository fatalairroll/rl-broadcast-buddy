import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { MatchData } from '@/types/studio';

interface BracketViewProps {
  matches: MatchData[];
}

const MATCH_HEIGHT = 72;
const BASE_GAP = 12;
const H_GAP = 60;
const SCROLL_CYCLE_MS = 30000; // 30s one-way
const LINE_COLOR = 'rgba(255,255,255,0.2)';
const LINE_WIDTH = 1.5;
const SKEW = -7;
const UNSKEW = 7;
const CARD_WIDTH = 200;

// Row heights inside the card must sum to MATCH_HEIGHT
const TEAM_ROW_H = 28;
const SCORE_ROW_H = 16;
// TEAM_ROW_H * 2 + SCORE_ROW_H = 72 ✓

interface LineData {
  id: string;
  d: string;
}

function getContainerHeight(absoluteRoundIndex: number): number {
  if (absoluteRoundIndex === 0) return MATCH_HEIGHT;
  return 2 * getContainerHeight(absoluteRoundIndex - 1) + BASE_GAP;
}

export function BracketView({ matches }: BracketViewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [lines, setLines] = useState<LineData[]>([]);

  const sortedRounds = useMemo(() => {
    const rounds = new Map<number, MatchData[]>();
    matches.forEach((m) => {
      const arr = rounds.get(m.round_index) ?? [];
      arr.push(m);
      rounds.set(m.round_index, arr);
    });
    const sorted = [...rounds.entries()].sort(([a], [b]) => a - b);
    sorted.forEach(([, rm]) => rm.sort((a, b) => (a.match_index ?? 0) - (b.match_index ?? 0)));
    return sorted;
  }, [matches]);

  const startIdx = useMemo(() => {
    const idx = sortedRounds.findIndex(([, ms]) =>
      ms.some(m => m.state !== 'finished' && m.state !== 'done')
    );
    return idx === -1 ? Math.max(0, sortedRounds.length - 1) : idx;
  }, [sortedRounds]);

  const visibleRounds = useMemo(() => sortedRounds.slice(startIdx), [sortedRounds, startIdx]);

  // --- SVG lines ---
  const calcLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: LineData[] = [];

    for (let ri = 0; ri < visibleRounds.length - 1; ri++) {
      const [, currentRoundMatches] = visibleRounds[ri];
      const [, nextRoundMatches] = visibleRounds[ri + 1];

      for (let mi = 0; mi < currentRoundMatches.length; mi++) {
        const match = currentRoundMatches[mi];
        const nextMatch = nextRoundMatches[Math.floor(mi / 2)];
        if (!nextMatch) continue;

        const fromEl = matchRefs.current.get(match.match_id);
        const toEl = matchRefs.current.get(nextMatch.match_id);
        if (!fromEl || !toEl) continue;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const startX = fromRect.right - containerRect.left;
        const startY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const endX = toRect.left - containerRect.left;
        const endY = toRect.top + toRect.height / 2 - containerRect.top;
        const midX = startX + (endX - startX) / 2;

        newLines.push({
          id: `${match.match_id}->${nextMatch.match_id}`,
          d: `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`,
        });
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

  // --- Time-based autoscroll with overflow detection ---
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    let rafId: number;
    let running = true;
    let phase: 'pause-top' | 'scrolling-down' | 'pause-bottom' | 'scrolling-up' = 'pause-top';
    let phaseStart: number | null = null;
    const PAUSE_MS = 2000; // pause at top/bottom

    const step = (timestamp: number) => {
      if (!running) return;
      const maxScroll = outer.scrollHeight - outer.clientHeight;
      if (maxScroll <= 0) {
        outer.scrollTop = 0;
        rafId = requestAnimationFrame(step);
        return;
      }

      if (phaseStart === null) phaseStart = timestamp;
      const elapsed = timestamp - phaseStart;

      switch (phase) {
        case 'pause-top':
          outer.scrollTop = 0;
          if (elapsed >= PAUSE_MS) {
            phase = 'scrolling-down';
            phaseStart = timestamp;
          }
          break;
        case 'scrolling-down': {
          const progress = Math.min(elapsed / SCROLL_CYCLE_MS, 1);
          outer.scrollTop = progress * maxScroll;
          if (progress >= 1) {
            outer.scrollTop = maxScroll;
            phase = 'pause-bottom';
            phaseStart = timestamp;
          }
          break;
        }
        case 'pause-bottom':
          outer.scrollTop = maxScroll;
          if (elapsed >= PAUSE_MS) {
            phase = 'scrolling-up';
            phaseStart = timestamp;
          }
          break;
        case 'scrolling-up': {
          const progress = Math.min(elapsed / SCROLL_CYCLE_MS, 1);
          outer.scrollTop = maxScroll * (1 - progress);
          if (progress >= 1) {
            outer.scrollTop = 0;
            phase = 'pause-top';
            phaseStart = timestamp;
          }
          break;
        }
      }

      rafId = requestAnimationFrame(step);
    };

    const timeout = setTimeout(() => {
      rafId = requestAnimationFrame(step);
    }, 500);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      clearTimeout(timeout);
    };
  }, [visibleRounds]);

  const setMatchRef = useCallback((matchId: string, el: HTMLDivElement | null) => {
    if (el) matchRefs.current.set(matchId, el);
    else matchRefs.current.delete(matchId);
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        height: '100vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="[&::-webkit-scrollbar]:hidden"
    >
      <div
        ref={containerRef}
        className="relative flex items-start"
        style={{ padding: '24px 40px', gap: H_GAP }}
      >
        {/* SVG connector layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}
        >
          {lines.map((line) => (
            <path key={line.id} d={line.d} fill="none" stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />
          ))}
        </svg>

        {/* Previous rounds indicator */}
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
                color: '#ffffff',
                textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap',
              }}
            >
              Poprzednie rundy zakończone
            </span>
          </div>
        )}

        {/* Round columns */}
        {visibleRounds.map(([roundIdx, roundMatches], ri) => {
          const absolutePosition = startIdx + ri;
          const containerHeight = getContainerHeight(absolutePosition);
          const firstMatch = roundMatches[0];
          const boInfo = firstMatch?.best_of ? ` BO${firstMatch.best_of}` : '';

          return (
            <div key={roundIdx} className="flex flex-col items-center shrink-0" style={{ minWidth: CARD_WIDTH }}>
              <div
                className="font-esports text-[10px] uppercase tracking-[0.25em] px-3 py-1"
                style={{
                  transform: `skewX(${SKEW}deg)`,
                  color: '#ffffff',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                <span style={{ display: 'inline-block', transform: `skewX(${UNSKEW}deg)` }}>
                  Runda {roundIdx}{boInfo}
                </span>
              </div>

              {roundMatches.map((match, mi) => (
                <div
                  key={match.match_id}
                  style={{
                    height: containerHeight,
                    marginTop: mi > 0 ? BASE_GAP : 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <BracketMatchCard match={match} refCallback={(el) => setMatchRef(match.match_id, el)} />
                </div>
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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        border: isLive
          ? '1px solid rgba(239,68,68,0.6)'
          : '0.5px solid rgba(255,255,255,0.15)',
        boxShadow: isLive ? '0 0 12px rgba(239,68,68,0.3), 0 0 24px rgba(239,68,68,0.15)' : undefined,
        width: CARD_WIDTH,
        height: MATCH_HEIGHT,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Team A */}
      <div className="flex items-center" style={{ height: TEAM_ROW_H }}>
        <div style={{ width: 4, height: '100%', background: '#2563eb', flexShrink: 0 }} />
        <div
          className="flex items-center justify-between flex-1 px-2.5"
          style={{ transform: `skewX(${UNSKEW}deg)`, height: '100%' }}
        >
          <span
            className="font-esports text-xs uppercase tracking-wider truncate ml-2"
            style={{ color: '#ffffff', fontWeight: 700, opacity: bWon ? 0.4 : 1 }}
          >
            {match.team_a?.name ?? 'TBD'}
          </span>
          {match.team_a?.seed != null && (
            <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              #{match.team_a.seed}
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: SCORE_ROW_H,
          background: 'rgba(8, 12, 24, 0.95)',
          transform: `skewX(${UNSKEW}deg)`,
        }}
      >
        <span className="font-esports text-xs font-bold tracking-widest" style={{ color: 'hsl(210, 20%, 95%)' }}>
          {match.score_a} : {match.score_b}
        </span>
      </div>

      {/* Team B */}
      <div className="flex items-center" style={{ height: TEAM_ROW_H }}>
        <div style={{ width: 4, height: '100%', background: '#f97316', flexShrink: 0 }} />
        <div
          className="flex items-center justify-between flex-1 px-2.5"
          style={{ transform: `skewX(${UNSKEW}deg)`, height: '100%' }}
        >
          <span
            className="font-esports text-xs uppercase tracking-wider truncate ml-2"
            style={{ color: '#ffffff', fontWeight: 700, opacity: aWon ? 0.4 : 1 }}
          >
            {match.team_b?.name ?? 'TBD'}
          </span>
          {match.team_b?.seed != null && (
            <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              #{match.team_b.seed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
