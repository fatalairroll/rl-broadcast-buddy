import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { MatchData, PoolData, TeamData } from '@/types/studio';
import { poolIdFromMatchId, selectablePools, poolTabLabel } from '@/lib/pool-utils';
import {
  type StudioTheme,
  glassBarBlue,
  glassBarOrange,
  glassBarDead,
  glassScoreBox,
  glassScoreDigitWin,
  glassScoreDigitLose,
  glassSpecularSweep,
  chamferLeft,
  chamferRight,
  glassTitleCool,
  glassName,
  glassNameDead,
  glassLabel,
  glassContentLayer,
} from '@/lib/studio-glass-theme';

function CheckInDot({ team }: { team: TeamData | null }) {
  if (!team) return null;
  const checkedIn = team.checked_in === true;
  return (
    <span
      title={checkedIn ? 'Check-in OK' : 'Oczekuje na check-in'}
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: checkedIn ? '#22c55e' : 'rgba(255,255,255,0.25)',
        boxShadow: checkedIn ? '0 0 4px rgba(34,197,94,0.7)' : 'none',
        flexShrink: 0,
      }}
    />
  );
}

interface BracketViewProps {
  matches: MatchData[];
  pools?: PoolData[];
  usePools?: boolean;
  selectedPoolId?: string | null;
  onPoolChange?: (poolId: string) => void;
  obs?: boolean;
  theme?: StudioTheme;
}

const MATCH_HEIGHT = 72;
const BASE_GAP = 12;
const H_GAP = 60;
const SCROLL_CYCLE_MS = 30000;
const SCROLL_PAUSE_MS = 2000;
const LINE_COLOR = 'rgba(255,255,255,0.2)';
const LINE_WIDTH = 1.5;
const STD_SKEW = -7;
const STD_UNSKEW = 7;
const CARD_WIDTH = 200;
const PREVIOUS_ROUNDS_WIDTH = 28;
const ROUND_WINDOW = 3;
const SCROLL_THRESHOLD_MATCHES = 12;

const TEAM_ROW_H = 28;
const SCORE_ROW_H = 16;

interface LineData {
  id: string;
  d: string;
}

function getContainerHeight(absoluteRoundIndex: number): number {
  if (absoluteRoundIndex === 0) return MATCH_HEIGHT;
  return 2 * getContainerHeight(absoluteRoundIndex - 1) + BASE_GAP;
}

function getSlotLayout(visualRoundOffset: number): {
  height: number;
  alignItems: 'flex-start' | 'center';
} {
  if (visualRoundOffset === 0) {
    return { height: MATCH_HEIGHT, alignItems: 'flex-start' };
  }
  return {
    height: getContainerHeight(visualRoundOffset),
    alignItems: 'center',
  };
}

export function BracketView({
  matches,
  pools,
  usePools = false,
  selectedPoolId,
  onPoolChange,
  obs = false,
  theme = 'standard',
}: BracketViewProps) {
  const isGlass = theme === 'sharp-glass';
  const SKEW = isGlass ? 0 : STD_SKEW;
  const UNSKEW = isGlass ? 0 : STD_UNSKEW;
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const maxScrollRef = useRef(0);
  const scrollGenerationRef = useRef(0);
  const [lines, setLines] = useState<LineData[]>([]);

  const poolMatches = useMemo(() => {
    if (!usePools || !selectedPoolId) return matches;
    return matches.filter(
      (m) => (m.pool_id ?? poolIdFromMatchId(m.match_id)) === selectedPoolId,
    );
  }, [matches, usePools, selectedPoolId]);

  const sortedRounds = useMemo(() => {
    const rounds = new Map<number, MatchData[]>();
    poolMatches.forEach((match) => {
      const roundMatches = rounds.get(match.round_index) ?? [];
      roundMatches.push(match);
      rounds.set(match.round_index, roundMatches);
    });

    const sorted = [...rounds.entries()].sort(([a], [b]) => a - b);
    sorted.forEach(([, roundMatches]) => {
      roundMatches.sort((a, b) => (a.match_index ?? 0) - (b.match_index ?? 0));
    });

    return sorted;
  }, [poolMatches]);

  const { startIdx, visibleRounds } = useMemo(() => {
    if (sortedRounds.length <= ROUND_WINDOW) {
      return { startIdx: 0, visibleRounds: sortedRounds };
    }
    let anchorIdx = sortedRounds.findIndex(([, ms]) =>
      ms.some(
        (m) => m.state === 'scheduled' || m.state === 'live' || m.state === 'in_progress',
      ),
    );
    if (anchorIdx === -1) anchorIdx = sortedRounds.length - 1;
    let start = Math.max(0, anchorIdx - 1);
    if (start + ROUND_WINDOW > sortedRounds.length) {
      start = sortedRounds.length - ROUND_WINDOW;
    }
    return {
      startIdx: start,
      visibleRounds: sortedRounds.slice(start, start + ROUND_WINDOW),
    };
  }, [sortedRounds]);

  const hasPreviousRounds = startIdx > 0;
  const tallestColumnSize = useMemo(
    () => visibleRounds.reduce((max, [, ms]) => Math.max(max, ms.length), 0),
    [visibleRounds],
  );
  const enableAutoScroll = tallestColumnSize > SCROLL_THRESHOLD_MATCHES;

  const poolTabs = useMemo(() => selectablePools(pools), [pools]);
  const showPoolSelector = usePools && poolTabs.length > 1 && !obs;

  const calcLines = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const nextLines: LineData[] = [];

    for (let roundIndex = 0; roundIndex < visibleRounds.length - 1; roundIndex += 1) {
      const [, currentRoundMatches] = visibleRounds[roundIndex];
      const [, nextRoundMatches] = visibleRounds[roundIndex + 1];

      for (let matchIndex = 0; matchIndex < currentRoundMatches.length; matchIndex += 1) {
        const match = currentRoundMatches[matchIndex];
        const nextMatch = nextRoundMatches[Math.floor(matchIndex / 2)];
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

        nextLines.push({
          id: `${match.match_id}->${nextMatch.match_id}`,
          d: `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`,
        });
      }
    }

    setLines(nextLines);
  }, [visibleRounds]);

  const measureOverflow = useCallback(() => {
    const outer = outerRef.current;
    const container = containerRef.current;
    if (!outer || !container) return;

    const maxScroll = Math.max(0, container.offsetHeight - outer.clientHeight);
    maxScrollRef.current = maxScroll;

    if (maxScroll <= 0) {
      outer.scrollTop = 0;
    } else if (outer.scrollTop > maxScroll) {
      outer.scrollTop = maxScroll;
    }

    calcLines();
  }, [calcLines]);

  useEffect(() => {
    measureOverflow();

    const observer = new ResizeObserver(() => {
      measureOverflow();
    });

    if (outerRef.current) observer.observe(outerRef.current);
    if (containerRef.current) observer.observe(containerRef.current);

    window.addEventListener('resize', measureOverflow);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [measureOverflow]);

  useEffect(() => {
    if (!enableAutoScroll) return;
    const outer = outerRef.current;
    if (!outer) return;

    // (auto-scroll cycle below)

    const myGen = scrollGenerationRef.current;
    let rafId = 0;
    let running = true;
    let phase: 'pause-top' | 'scrolling-down' | 'pause-bottom' | 'scrolling-up' = 'pause-top';
    let phaseStart: number | null = null;

    const step = (timestamp: number) => {
      if (!running) return;
      if (scrollGenerationRef.current !== myGen) {
        running = false;
        return;
      }

      const maxScroll = maxScrollRef.current;
      if (phaseStart === null) phaseStart = timestamp;

      if (maxScroll <= 0) {
        outer.scrollTop = 0;
        phase = 'pause-top';
        phaseStart = timestamp;
        rafId = requestAnimationFrame(step);
        return;
      }

      const elapsed = timestamp - phaseStart;

      if (phase === 'pause-top') {
        outer.scrollTop = 0;
        if (elapsed >= SCROLL_PAUSE_MS) {
          phase = 'scrolling-down';
          phaseStart = timestamp;
        }
      } else if (phase === 'scrolling-down') {
        const progress = Math.min(elapsed / SCROLL_CYCLE_MS, 1);
        outer.scrollTop = progress * maxScroll;

        if (progress >= 1) {
          outer.scrollTop = maxScroll;
          phase = 'pause-bottom';
          phaseStart = timestamp;
        }
      } else if (phase === 'pause-bottom') {
        outer.scrollTop = maxScroll;
        if (elapsed >= SCROLL_PAUSE_MS) {
          phase = 'scrolling-up';
          phaseStart = timestamp;
        }
      } else {
        const progress = Math.min(elapsed / SCROLL_CYCLE_MS, 1);
        outer.scrollTop = maxScroll * (1 - progress);

        if (progress >= 1) {
          outer.scrollTop = 0;
          phase = 'pause-top';
          phaseStart = timestamp;
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [enableAutoScroll, startIdx, selectedPoolId]);

  useEffect(() => {
    scrollGenerationRef.current += 1;
    if (outerRef.current) outerRef.current.scrollTop = 0;
  }, [startIdx, selectedPoolId]);

  const setMatchRef = useCallback((matchId: string, el: HTMLDivElement | null) => {
    if (el) {
      matchRefs.current.set(matchId, el);
      return;
    }

    matchRefs.current.delete(matchId);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showPoolSelector && (
        <div
          className="flex items-center gap-2 mb-3"
          style={{ flexWrap: 'wrap' }}
        >
          {poolTabs.map((p) => {
            const active = selectedPoolId === p.pool_id;
            return (
              <button
                key={p.pool_id}
                onClick={() => onPoolChange?.(p.pool_id)}
                className="font-esports uppercase transition-colors"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  padding: '6px 14px',
                  background: active ? '#00A3FF' : 'rgba(255,255,255,0.08)',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {poolTabLabel(p)}
              </button>
            );
          })}
        </div>
      )}

      <div
        className="relative flex items-start shrink-0"
        style={{
          padding: '0 0 12px',
          gap: H_GAP,
        }}
      >
        {hasPreviousRounds && (
          <div
            className="flex items-start justify-center shrink-0"
            style={{
              width: PREVIOUS_ROUNDS_WIDTH,
              minWidth: PREVIOUS_ROUNDS_WIDTH,
            }}
          >
            <span
              className="font-esports uppercase"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: 9,
                letterSpacing: '0.3em',
                color: '#ffffff',
                whiteSpace: 'nowrap',
              }}
            >
              Poprzednie rundy zakończone
            </span>
          </div>
        )}

        {visibleRounds.map(([roundIdx, roundMatches]) => {
          const firstMatch = roundMatches[0];
          const boInfo = firstMatch?.best_of ? ` BO${firstMatch.best_of}` : '';

          return (
            <div key={roundIdx} className="flex flex-col items-center shrink-0" style={{ minWidth: CARD_WIDTH }}>
              {isGlass ? (
                <div
                  className="px-3 py-1 relative"
                  style={{ ...glassTitleCool }}
                >
                  <div style={glassSpecularSweep} aria-hidden />
                  <span style={{ ...glassLabel, fontSize: 10, position: 'relative', zIndex: 2 }}>
                    Runda {roundIdx}{boInfo}
                  </span>
                </div>
              ) : (
                <div
                  className="font-esports text-[10px] uppercase tracking-[0.25em] px-3 py-1"
                  style={{
                    transform: `skewX(${SKEW}deg)`,
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ display: 'inline-block', transform: `skewX(${UNSKEW}deg)` }}>
                    Runda {roundIdx}{boInfo}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={outerRef}
        style={{
          width: '100%',
          maxHeight: enableAutoScroll ? 960 : undefined,
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={containerRef}
          className="relative flex items-start"
          style={{
            padding: '0 0 24px',
            gap: H_GAP,
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}
          >
            {lines.map((line) => (
              <path key={line.id} d={line.d} fill="none" stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />
            ))}
          </svg>

          {hasPreviousRounds && (
            <div
              className="shrink-0 self-start"
              style={{
                width: PREVIOUS_ROUNDS_WIDTH,
                minWidth: PREVIOUS_ROUNDS_WIDTH,
                minHeight: MATCH_HEIGHT,
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          )}

          {visibleRounds.map(([roundIdx, roundMatches], roundOffset) => {
            const { height: slotHeight, alignItems: slotAlign } = getSlotLayout(roundOffset);

            return (
              <div key={roundIdx} className="flex flex-col items-center shrink-0 self-start" style={{ minWidth: CARD_WIDTH }}>
                {roundMatches.map((match, matchIndex) => (
                  <div
                    key={match.match_id}
                    style={{
                      height: slotHeight,
                      marginTop: matchIndex > 0 ? BASE_GAP : 0,
                      display: 'flex',
                      alignItems: slotAlign,
                    }}
                  >
                    <BracketMatchCard
                      match={match}
                      refCallback={(el) => setMatchRef(match.match_id, el)}
                      theme={theme}
                      skew={SKEW}
                      unskew={UNSKEW}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  refCallback,
  theme,
  skew,
  unskew,
}: {
  match: MatchData;
  refCallback: (el: HTMLDivElement | null) => void;
  theme: StudioTheme;
  skew: number;
  unskew: number;
}) {
  const isLive = match.state === 'in_progress' || match.state === 'live';
  const isFinished = match.state === 'finished' || match.state === 'done';
  const aWon = isFinished && match.winner_team_id === match.team_a?.team_id;
  const bWon = isFinished && match.winner_team_id === match.team_b?.team_id;
  const showCheckIn = match.state === 'scheduled';
  const isGlass = theme === 'sharp-glass';

  if (isGlass) {
    const aIsTbd = !match.team_a;
    const bIsTbd = !match.team_b;
    const aStyle = aIsTbd || bWon ? glassBarDead : glassBarBlue;
    const bStyle = bIsTbd || aWon ? glassBarDead : glassBarOrange;
    const aNameStyle = bWon || aIsTbd ? glassNameDead : glassName;
    const bNameStyle = aWon || bIsTbd ? glassNameDead : glassName;

    return (
      <div
        ref={refCallback}
        className="relative"
        style={{
          width: CARD_WIDTH,
          height: MATCH_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Team A row */}
        <div className="flex items-center" style={{ height: TEAM_ROW_H, ...aStyle, ...chamferLeft(8) }}>
          <div style={glassSpecularSweep} aria-hidden />
          <div className="flex items-center justify-between flex-1 px-2.5" style={{ ...glassContentLayer, height: '100%' }}>
            <div className="flex items-center gap-1.5 min-w-0">
              {showCheckIn && <CheckInDot team={match.team_a} />}
              <span className="text-xs truncate" style={{ ...aNameStyle, fontSize: 13 }}>
                {match.team_a?.name ?? 'TBD'}
              </span>
            </div>
            {match.team_a?.seed != null && (
              <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                #{match.team_a.seed}
              </span>
            )}
          </div>
        </div>

        {/* Score row */}
        <div className="relative flex items-center justify-center" style={{ height: SCORE_ROW_H, ...glassScoreBox }}>
          <div style={glassSpecularSweep} aria-hidden />
          <span className="font-esports text-xs font-bold tracking-widest" style={glassContentLayer}>
            <span style={aWon ? glassScoreDigitWin : (isFinished ? glassScoreDigitLose : { color: '#fff' })}>{match.score_a}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 4px' }}>:</span>
            <span style={bWon ? glassScoreDigitWin : (isFinished ? glassScoreDigitLose : { color: '#fff' })}>{match.score_b}</span>
          </span>
        </div>

        {/* Team B row */}
        <div className="flex items-center" style={{ height: TEAM_ROW_H, ...bStyle, ...chamferRight(8) }}>
          <div style={glassSpecularSweep} aria-hidden />
          <div className="flex items-center justify-between flex-1 px-2.5" style={{ ...glassContentLayer, height: '100%' }}>
            <div className="flex items-center gap-1.5 min-w-0">
              {showCheckIn && <CheckInDot team={match.team_b} />}
              <span className="text-xs truncate" style={{ ...bNameStyle, fontSize: 13 }}>
                {match.team_b?.name ?? 'TBD'}
              </span>
            </div>
            {match.team_b?.seed != null && (
              <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                #{match.team_b.seed}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refCallback}
      className="relative overflow-hidden"
      style={{
        transform: `skewX(${skew}deg)`,
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
      <div className="flex items-center" style={{ height: TEAM_ROW_H }}>
        <div style={{ width: 4, height: '100%', background: '#2563eb', flexShrink: 0 }} />
        <div
          className="flex items-center justify-between flex-1 px-2.5"
          style={{ transform: `skewX(${unskew}deg)`, height: '100%' }}
        >
          <div className="flex items-center gap-1.5 min-w-0 ml-2">
            {showCheckIn && <CheckInDot team={match.team_a} />}
            <span
              className="font-esports text-xs uppercase tracking-wider truncate"
              style={{ color: '#ffffff', fontWeight: 700, opacity: bWon ? 0.4 : 1 }}
            >
              {match.team_a?.name ?? 'TBD'}
            </span>
          </div>
          {match.team_a?.seed != null && (
            <span className="font-mono text-[9px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              #{match.team_a.seed}
            </span>
          )}
        </div>
      </div>

      <div
        className="relative flex items-center justify-center"
        style={{
          height: SCORE_ROW_H,
          background: 'rgba(8, 12, 24, 0.95)',
          transform: `skewX(${unskew}deg)`,
        }}
      >
        <span className="font-esports text-xs font-bold tracking-widest" style={{ color: 'hsl(210, 20%, 95%)' }}>
          {match.score_a} : {match.score_b}
        </span>
      </div>

      <div className="flex items-center" style={{ height: TEAM_ROW_H }}>
        <div style={{ width: 4, height: '100%', background: '#f97316', flexShrink: 0 }} />
        <div
          className="flex items-center justify-between flex-1 px-2.5"
          style={{ transform: `skewX(${unskew}deg)`, height: '100%' }}
        >
          <div className="flex items-center gap-1.5 min-w-0 ml-2">
            {showCheckIn && <CheckInDot team={match.team_b} />}
            <span
              className="font-esports text-xs uppercase tracking-wider truncate"
              style={{ color: '#ffffff', fontWeight: 700, opacity: aWon ? 0.4 : 1 }}
            >
              {match.team_b?.name ?? 'TBD'}
            </span>
          </div>
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
