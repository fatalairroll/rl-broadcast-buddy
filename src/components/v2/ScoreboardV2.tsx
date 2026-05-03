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

const STAGE_W = 1920;
const STAGE_H = 1080;

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

  // Allow negative paddingY values to compress tile height below natural size
  // by mapping the negative portion to negative vertical margin.
  const compressY = (py: number) => ({
    paddingTop: Math.max(0, py),
    paddingBottom: Math.max(0, py),
    marginTop: Math.min(0, py),
    marginBottom: Math.min(0, py),
  });

  // Fixed-anchor positioning: the visual center of the scoreboard (timer center
  // when inline, mid-gap when detached) is glued to (960 + offsetX). Vertical
  // anchor behaviour mirrors positionToStyle so existing layouts keep working.
  const anchorLeft = STAGE_W / 2 + sb.position.offsetX;
  const anchorTop = STAGE_H / 2 + sb.position.offsetY;
  const verticalTransform =
    sb.position.anchorV === 'middle'
      ? 'translateY(-50%)'
      : sb.position.anchorV === 'bottom'
        ? 'translateY(-100%)'
        : '';

  // Estimated half-width of the inline timer tile (M:SS, tabular-nums) so the
  // Blue/Orange slots can be placed symmetrically around the anchor without
  // measuring the DOM. Tabular-nums keeps width stable across digits.
  const inlineTimerHalf = !detached
    ? config.timer.paddingX + config.timer.fontSize * 1.2
    : 0;
  const halfCenter = inlineTimerHalf + sb.gap;

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
      <div
        className="flex flex-col items-center"
        style={{
          transform: `translate(${config.timer.textOffsetX}px, ${config.timer.textOffsetY}px)`,
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
    </div>
  );

  // Common style for Blue and Orange tiles
  const blueTile = (
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
  );

  const orangeTile = (
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
  );

  return (
    <>
      {/* Zero-size anchor stuck at (960 + offsetX, top + offsetY). Blue grows
          to the left of it, Orange grows to the right, the inline timer is
          perfectly centered on it. This guarantees that offsetX = 0 always
          puts the visual centre of the scoreboard at screen-x = 960,
          regardless of asymmetric tile widths or skew. */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: sb.opacity }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="select-none"
        style={{
          position: 'absolute',
          left: anchorLeft,
          top: anchorTop,
          width: 0,
          height: 0,
          fontFamily: sb.fontFamily,
          transform: verticalTransform || undefined,
        }}
      >
        {/* Blue: right edge sits at (anchor − halfCenter) */}
        <div
          style={{
            position: 'absolute',
            right: halfCenter,
            top: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {blueTile}
        </div>

        {/* Timer (inline) — centered on the anchor */}
        {!detached && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(calc(-50% + ${config.timer.boxOffsetX}px), ${config.timer.boxOffsetY}px)`,
              display: 'flex',
            }}
          >
            {timerNode}
          </div>
        )}

        {/* Orange: left edge sits at (anchor + halfCenter) */}
        <div
          style={{
            position: 'absolute',
            left: halfCenter,
            top: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {orangeTile}
        </div>
      </motion.div>

      {/* Timer (detached mode) */}
      {detached && (
        <div
          style={{
            ...positionToStyle(config.timer.position),
            transform: `translate(${config.timer.boxOffsetX}px, ${config.timer.boxOffsetY}px)`,
          }}
        >
          {timerNode}
        </div>
      )}
    </>
  );
}
