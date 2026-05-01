import { motion } from 'framer-motion';
import type { MatchMetadata } from '@/types/livestats';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import { gradientToCss } from '@/lib/gradient-utils';
import { glowToBoxShadow } from '@/lib/glow-utils';
import { positionToStyle } from '@/lib/position-utils';

interface Props {
  match: MatchMetadata | null;
  config?: OverlayV2Config;
}

export function ScoreboardV2({ match, config = defaultOverlayV2Config }: Props) {
  const sb = config.scoreboard;
  if (!sb.visible) return null;

  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const timer = match?.timer ?? '5:00';
  const ot = match?.is_overtime ?? false;

  const skewOuter = `skewX(${sb.skewDeg}deg)`;
  const skewInner = `skewX(${-sb.skewDeg}deg)`;
  const detached = config.timer.detached;

  const sbPos = positionToStyle(sb.position);
  // Allow negative paddingY values to compress tile height below natural size
  // by mapping the negative portion to negative vertical margin.
  const compressY = (py: number) => ({
    paddingTop: Math.max(0, py),
    paddingBottom: Math.max(0, py),
    marginTop: Math.min(0, py),
    marginBottom: Math.min(0, py),
  });
  // motion adds animations; merge with positioning
  const containerStyle = {
    ...sbPos,
    gap: sb.gap,
    fontFamily: sb.fontFamily,
    opacity: sb.opacity,
  } as React.CSSProperties;

  const timerNode = (
    <div
      className="flex flex-col items-center justify-center border-y-2 border-white/10"
      style={{
        ...compressY(config.timer.paddingY),
        paddingLeft: config.timer.paddingX,
        paddingRight: config.timer.paddingX,
        background: config.timer.background,
        transform: skewOuter,
        boxShadow: glowToBoxShadow(config.timer.glow),
        fontFamily: config.timer.fontFamily,
      }}
    >
      <span
        className="tabular-nums tracking-wider"
        style={{
          transform: skewInner,
          fontFamily: config.timer.fontFamily,
          fontSize: config.timer.fontSize,
          fontWeight: 900,
          color: config.timer.textColor,
        }}
      >
        {timer}
      </span>
      {ot && config.timer.showOvertimeLabel && (
        <span
          className="text-xs font-bold uppercase tracking-[0.3em] mt-1 animate-pulse"
          style={{
            transform: skewInner,
            color: config.timer.overtimeLabelColor,
            textShadow: `0 0 8px ${config.timer.overtimeLabelColor}`,
          }}
        >
          Overtime
        </span>
      )}
    </div>
  );

  return (
    <>
      <div style={containerStyle}>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: sb.opacity }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-stretch select-none"
        style={{ gap: sb.gap, fontFamily: sb.fontFamily }}
      >
        {/* Blue */}
        <div
        className="flex items-center justify-center"
        style={{
          ...compressY(config.scoreBlue.paddingY),
          paddingLeft: config.scoreBlue.paddingX,
          paddingRight: config.scoreBlue.paddingX,
          transform: skewOuter,
          background: gradientToCss(config.scoreBlue.gradient),
          boxShadow: glowToBoxShadow(config.scoreBlue.glow),
        }}
      >
        <span
          className="tabular-nums tracking-tight"
          style={{
            transform: skewInner,
            fontSize: config.scoreBlue.fontSize,
            fontWeight: config.scoreBlue.fontWeight,
            color: config.scoreBlue.textColor,
            textShadow: config.scoreBlue.textShadow,
          }}
        >
          {blue}
        </span>
      </div>

      {/* Timer (inline mode) */}
      {!detached && timerNode}

      {/* Orange */}
      <div
        className="flex items-center justify-center"
        style={{
          ...compressY(config.scoreOrange.paddingY),
          paddingLeft: config.scoreOrange.paddingX,
          paddingRight: config.scoreOrange.paddingX,
          transform: skewOuter,
          background: gradientToCss(config.scoreOrange.gradient),
          boxShadow: glowToBoxShadow(config.scoreOrange.glow),
        }}
      >
        <span
          className="tabular-nums tracking-tight"
          style={{
            transform: skewInner,
            fontSize: config.scoreOrange.fontSize,
            fontWeight: config.scoreOrange.fontWeight,
            color: config.scoreOrange.textColor,
            textShadow: config.scoreOrange.textShadow,
          }}
        >
          {orange}
        </span>
      </div>
      </motion.div>
      </div>

      {/* Timer (detached mode) */}
      {detached && (
        <div style={positionToStyle(config.timer.position)}>{timerNode}</div>
      )}
    </>
  );
}
