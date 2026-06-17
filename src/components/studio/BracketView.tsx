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
  glassChip,
  glassSpecularSweep,
  chamferLeft,
  chamferRight,
  chamferTag,
  glassTitleCool,
  glassName,
  glassNameDead,
  glassLabel,
  glassContentLayer,
  BRACKET_TOP_OFFSET,
  PAN_SPEED_PX_S,
} from '@/lib/studio-glass-theme';
import {
  NB_ACID,
  NB_BLUE,
  NB_BORDER,
  NB_BORDER_THIN,
  NB_DIM,
  NB_FONT,
  NB_INK,
  NB_MONO,
  NB_ORANGE,
  NB_WHITE,
  nbShadowSmall,
} from '@/lib/studio-neobrutal-theme';

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
const STD_LINE_COLOR = 'rgba(255,255,255,0.2)';
const GLASS_LINE_COLOR = 'rgba(255,255,255,0.35)';
const LINE_WIDTH = 1.5;
const STD_SKEW = -7;
const STD_UNSKEW = 7;
const CARD_WIDTH = 200;
const PREVIOUS_ROUNDS_WIDTH = 28;
const ROUND_WINDOW = 3;
const SCROLL_THRESHOLD_MATCHES = 12;

const TEAM_ROW_H = 28;
const SCORE_ROW_H = 16;
const GLASS_ROW_H = 28;
const GLASS_ROW_GAP = 2;
const GLASS_CHIP_W = 28;
const GLASS_SCORE_W = 36;

interface LineData {
  id: string;
  d: string;
}

function getContainerHeight(absoluteRoundIndex: number, base: number): number {
  if (absoluteRoundIndex === 0) return base;
  return 2 * getContainerHeight(absoluteRoundIndex - 1, base) + BASE_GAP;
}

function getSlotLayout(
  visualRoundOffset: number,
  base: number,
): {
  height: number;
  alignItems: 'flex-start' | 'center';
} {
  if (visualRoundOffset === 0) {
    return { height: base, alignItems: 'flex-start' };
  }
  return {
    height: getContainerHeight(visualRoundOffset, base),
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
  const isNeobrutal = theme === 'neobrutal';
  const isFlat = isGlass || isNeobrutal;
  const SKEW = isFlat ? 0 : STD_SKEW;
  const UNSKEW = isFlat ? 0 : STD_UNSKEW;
  const cardH = isGlass
    ? GLASS_ROW_H * 2 + GLASS_ROW_GAP
    : isNeobrutal
      ? GLASS_ROW_H * 2 + GLASS_ROW_GAP + 6
      : MATCH_HEIGHT;
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const maxScrollRef = useRef(0);
  const scrollGenerationRef = useRef(0);
  const panGenerationRef = useRef(0);
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
    if (isGlass) return;
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
    panGenerationRef.current += 1;
    if (outerRef.current) outerRef.current.scrollTop = 0;
    if (containerRef.current) containerRef.current.style.transform = 'translateY(0px)';
  }, [startIdx, selectedPoolId]);

  // Glass: vertical auto-pan via translateY (does not interfere with horizontal round window)
  useEffect(() => {
    if (!isGlass) return;
    const outer = outerRef.current;
    const container = containerRef.current;
    if (!outer || !container) return;

    const myGen = panGenerationRef.current;
    let rafId = 0;
    let running = true;
    let phase: 'pause-top' | 'down' | 'pause-bottom' | 'up' = 'pause-top';
    let phaseStart: number | null = null;
    const INITIAL_DELAY = 2000;
    const initialDelayUntil = performance.now() + INITIAL_DELAY;

    const ease = (t: number, durationMs: number): number => {
      const EASE_MS = 400;
      if (durationMs <= 2 * EASE_MS) {
        return t * t * (3 - 2 * t);
      }
      const elapsedMs = t * durationMs;
      if (elapsedMs < EASE_MS) {
        const p = elapsedMs / EASE_MS;
        return (p * p) * (EASE_MS / durationMs) * 0.5;
      }
      if (elapsedMs > durationMs - EASE_MS) {
        const p = (durationMs - elapsedMs) / EASE_MS;
        return 1 - (p * p) * (EASE_MS / durationMs) * 0.5;
      }
      const linStart = (EASE_MS / durationMs) * 0.5;
      const linEnd = 1 - (EASE_MS / durationMs) * 0.5;
      return linStart + (linEnd - linStart) * ((elapsedMs - EASE_MS) / (durationMs - 2 * EASE_MS));
    };

    const step = (timestamp: number) => {
      if (!running) return;
      if (panGenerationRef.current !== myGen) {
        running = false;
        return;
      }

      if (timestamp < initialDelayUntil) {
        container.style.transform = 'translateY(0px)';
        rafId = requestAnimationFrame(step);
        return;
      }

      const overhang = container.offsetHeight - outer.clientHeight;
      if (overhang <= 0) {
        container.style.transform = 'translateY(0px)';
        phase = 'pause-top';
        phaseStart = timestamp;
        rafId = requestAnimationFrame(step);
        return;
      }

      if (phaseStart === null) phaseStart = timestamp;
      const elapsed = timestamp - phaseStart;
      const travelMs = (overhang / PAN_SPEED_PX_S) * 1000;

      if (phase === 'pause-top') {
        container.style.transform = 'translateY(0px)';
        if (elapsed >= 3000) {
          phase = 'down';
          phaseStart = timestamp;
        }
      } else if (phase === 'down') {
        const t = Math.min(elapsed / travelMs, 1);
        const y = -overhang * ease(t, travelMs);
        container.style.transform = `translateY(${y}px)`;
        if (t >= 1) {
          phase = 'pause-bottom';
          phaseStart = timestamp;
        }
      } else if (phase === 'pause-bottom') {
        container.style.transform = `translateY(${-overhang}px)`;
        if (elapsed >= 3000) {
          phase = 'up';
          phaseStart = timestamp;
        }
      } else {
        const t = Math.min(elapsed / travelMs, 1);
        const y = -overhang * (1 - ease(t, travelMs));
        container.style.transform = `translateY(${y}px)`;
        if (t >= 1) {
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
      if (container) container.style.transform = 'translateY(0px)';
    };
  }, [isGlass, startIdx, selectedPoolId]);

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
              {isNeobrutal ? (
                <div
                  style={{
                    padding: '3px 10px',
                    background: NB_ACID,
                    border: NB_BORDER_THIN,
                    fontFamily: NB_MONO,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.18em',
                    color: NB_INK,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  R{roundIdx}{boInfo}
                </div>
              ) : isGlass ? (
                <div
                  className="px-3 py-1 relative"
                  style={{ ...glassBarDead, ...chamferTag }}
                >
                  <div style={glassSpecularSweep} aria-hidden />
                  <span style={{ ...glassLabel, fontSize: 11.5, position: 'relative', zIndex: 2 }}>
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
          maxHeight: isGlass ? 'calc(100vh - 200px)' : (enableAutoScroll ? 960 : undefined),
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          ...(isGlass ? { paddingTop: BRACKET_TOP_OFFSET } : null),
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={containerRef}
          className="relative flex items-start"
          style={{
            padding: '0 0 24px',
            gap: H_GAP,
            willChange: isGlass ? 'transform' : undefined,
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}
          >
            {lines.map((line) => (
              <path
                key={line.id}
                d={line.d}
                fill="none"
                stroke={isNeobrutal ? NB_INK : isGlass ? GLASS_LINE_COLOR : STD_LINE_COLOR}
                strokeWidth={isNeobrutal ? 3 : LINE_WIDTH}
              />
            ))}
          </svg>

          {hasPreviousRounds && (
            <div
              className="shrink-0 self-start"
              style={{
                width: PREVIOUS_ROUNDS_WIDTH,
                minWidth: PREVIOUS_ROUNDS_WIDTH,
                minHeight: cardH,
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          )}

          {visibleRounds.map(([roundIdx, roundMatches], roundOffset) => {
            const { height: slotHeight, alignItems: slotAlign } = getSlotLayout(roundOffset, cardH);

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
  const isNeobrutal = theme === 'neobrutal';

  if (isNeobrutal) {
    const aIsTbd = !match.team_a;
    const bIsTbd = !match.team_b;
    const aName = match.team_a?.name ?? 'TBD';
    const bName = match.team_b?.name ?? 'TBD';
    const rowH = (GLASS_ROW_H * 2 + GLASS_ROW_GAP + 6 - 3) / 2;

    const nameStyle = (won: boolean, otherWon: boolean, tbd: boolean): React.CSSProperties => ({
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      fontFamily: NB_FONT,
      fontWeight: 800,
      fontSize: 13,
      textTransform: 'uppercase',
      color: tbd || otherWon ? NB_DIM : NB_INK,
      background: won ? NB_ACID : NB_WHITE,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    const scoreStyle = (won: boolean): React.CSSProperties => ({
      width: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: NB_FONT,
      fontWeight: 900,
      fontSize: 18,
      color: won ? NB_INK : NB_DIM,
      background: won ? NB_ACID : NB_WHITE,
      borderLeft: NB_BORDER_THIN,
    });

    return (
      <div
        ref={refCallback}
        style={{
          width: CARD_WIDTH,
          background: NB_WHITE,
          border: NB_BORDER,
          boxShadow: nbShadowSmall,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Row A */}
        <div style={{ display: 'flex', height: rowH, borderLeft: `6px solid ${NB_BLUE}` }}>
          <div style={nameStyle(aWon, bWon, aIsTbd)}>{aName}</div>
          <div style={scoreStyle(aWon)}>{match.score_a ?? 0}</div>
        </div>
        {/* Row B */}
        <div
          style={{
            display: 'flex',
            height: rowH,
            borderLeft: `6px solid ${NB_ORANGE}`,
            borderTop: '3px solid #111',
          }}
        >
          <div style={nameStyle(bWon, aWon, bIsTbd)}>{bName}</div>
          <div style={scoreStyle(bWon)}>{match.score_b ?? 0}</div>
        </div>
        {isLive && (
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              padding: '2px 8px',
              background: NB_INK,
              color: NB_ACID,
              fontFamily: NB_MONO,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '.18em',
              border: NB_BORDER_THIN,
            }}
          >
            LIVE
          </div>
        )}
      </div>
    );
  }

  if (isGlass) {
    const aIsTbd = !match.team_a;
    const bIsTbd = !match.team_b;
    const aStyle = aIsTbd || bWon ? glassBarDead : glassBarBlue;
    const bStyle = bIsTbd || aWon ? glassBarDead : glassBarOrange;
    const aNameStyle = bWon || aIsTbd ? glassNameDead : glassName;
    const bNameStyle = aWon || bIsTbd ? glassNameDead : glassName;
    const aDigitStyle = aWon ? glassScoreDigitWin : (isFinished ? glassScoreDigitLose : { color: '#fff' });
    const bDigitStyle = bWon ? glassScoreDigitWin : (isFinished ? glassScoreDigitLose : { color: '#fff' });

    return (
      <div
        ref={refCallback}
        className="relative"
        style={{
          width: CARD_WIDTH,
          height: GLASS_ROW_H * 2 + GLASS_ROW_GAP,
          display: 'flex',
          flexDirection: 'column',
          gap: GLASS_ROW_GAP,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Team A row: [bar][score] */}
        <div style={{ display: 'flex', height: GLASS_ROW_H, gap: 0 }}>
          <div
            className="relative flex items-center"
            style={{ flex: 1, ...aStyle, ...chamferLeft(8), paddingLeft: 10, paddingRight: 6 }}
          >
            <div style={glassSpecularSweep} aria-hidden />
            <div className="flex items-center gap-1.5 min-w-0 w-full" style={glassContentLayer}>
              {showCheckIn && <CheckInDot team={match.team_a} />}
              <span className="truncate" style={{ ...aNameStyle, fontSize: 12 }}>
                {match.team_a?.name ?? 'TBD'}
              </span>
            </div>
          </div>
          <div
            className="relative flex items-center justify-center"
            style={{ width: GLASS_SCORE_W, ...glassScoreBox, ...chamferRight(8) }}
          >
            <div style={glassSpecularSweep} aria-hidden />
            <span className="tabular-nums" style={{ ...glassContentLayer, fontWeight: 800, fontSize: 18, lineHeight: 1, ...aDigitStyle }}>
              {match.score_a}
            </span>
          </div>
        </div>

        {/* Team B row: [bar][score] */}
        <div style={{ display: 'flex', height: GLASS_ROW_H, gap: 0 }}>
          <div
            className="relative flex items-center"
            style={{ flex: 1, ...bStyle, ...chamferLeft(8), paddingLeft: 10, paddingRight: 6 }}
          >
            <div style={glassSpecularSweep} aria-hidden />
            <div className="flex items-center gap-1.5 min-w-0 w-full" style={glassContentLayer}>
              {showCheckIn && <CheckInDot team={match.team_b} />}
              <span className="truncate" style={{ ...bNameStyle, fontSize: 12 }}>
                {match.team_b?.name ?? 'TBD'}
              </span>
            </div>
          </div>
          <div
            className="relative flex items-center justify-center"
            style={{ width: GLASS_SCORE_W, ...glassScoreBox, ...chamferRight(8) }}
          >
            <div style={glassSpecularSweep} aria-hidden />
            <span className="tabular-nums" style={{ ...glassContentLayer, fontWeight: 800, fontSize: 18, lineHeight: 1, ...bDigitStyle }}>
              {match.score_b}
            </span>
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
