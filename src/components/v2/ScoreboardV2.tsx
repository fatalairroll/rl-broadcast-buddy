import { motion } from 'framer-motion';
import type { MatchMetadata } from '@/types/livestats';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import { gradientToCss } from '@/lib/gradient-utils';
import { glowToBoxShadow } from '@/lib/glow-utils';
import { positionToStyle } from '@/lib/position-utils';
import { useScoreboardBounds } from '@/lib/scoreboard-bounds-context';
import { useEffect } from 'react';

interface Props {
  match: MatchMetadata | null;
  config?: OverlayV2Config;
}

const STAGE_W = 1920;
const STAGE_H = 1080;

export function ScoreboardV2({ match, config = defaultOverlayV2Config }: Props) {
  const sb = config.scoreboard;
  const { setBounds } = useScoreboardBounds();
  if (!sb.visible) return null;

  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const timer = match?.timer ?? '5:00';
  const ot = match?.is_overtime ?? false;

  const detached = config.timer.detached;

  // Effective skews per sub-component (each can override or inherit parent).
  const blueSkew = config.scoreBlue.inheritParentSkew ? sb.skewDeg : config.scoreBlue.skewDeg;
  const orangeSkew = config.scoreOrange.inheritParentSkew ? sb.skewDeg : config.scoreOrange.skewDeg;
  const timerSkew = config.timer.inheritParentSkew ? sb.skewDeg : config.timer.skewDeg;

  // Allow negative paddingY values to compress tile height below natural size
  // by mapping the negative portion to negative vertical margin.
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

  // Fixed Box Model: timer width is now an explicit dimension.
  const inlineTimerHalf = !detached ? config.timer.width / 2 : 0;
  const halfCenter = inlineTimerHalf + sb.gap;

  // Publish scoreboard bounds for attached team names. The visual top
  // is anchorTop offset by anchorV; we approximate with the tallest tile.
  const tallest = Math.max(
    config.scoreBlue.height,
    config.scoreOrange.height,
    !detached ? config.timer.height : 0,
  );
  const verticalShift =
    sb.position.anchorV === 'middle' ? -tallest / 2 :
    sb.position.anchorV === 'bottom' ? -tallest : 0;
  const top = anchorTop + verticalShift;
  const totalWidth =
    config.scoreBlue.width + (detached ? 0 : config.timer.width + 2 * sb.gap) + config.scoreOrange.width;
  const left = anchorLeft - (config.scoreBlue.width + (detached ? 0 : config.timer.width / 2 + sb.gap));
  useEffect(() => {
    setBounds({
      left,
      right: left + totalWidth,
      top,
      bottom: top + tallest,
      centerX: anchorLeft,
      centerY: top + tallest / 2,
    });
    return () => setBounds(null);
  }, [left, totalWidth, top, tallest, anchorLeft, setBounds]);

  const timerNode = (
    <div
      className="flex flex-col items-center justify-center border-y-2 border-white/10 overflow-hidden"
      style={{
        width: config.timer.width,
        height: config.timer.height,
        background: config.timer.background,
        transform: `skewX(${timerSkew}deg)`,
        boxShadow: glowToBoxShadow(config.timer.glow),
        fontFamily: config.timer.fontFamily,
      }}
    >
      <div
        className="flex flex-col items-center justify-center"
        style={{ transform: `skewX(${-timerSkew}deg)`, height: '100%' }}
      >
        <span
          className="tabular-nums tracking-wider"
          style={{
            fontFamily: config.timer.fontFamily,
            fontSize: config.timer.fontSize,
            fontWeight: 900,
            color: config.timer.textColor,
            lineHeight: 1,
            display: 'block',
          }}
        >
          {timer}
        </span>
        {ot && config.timer.showOvertimeLabel && (
          <span
            className="text-xs font-bold uppercase tracking-[0.3em] mt-1 animate-pulse"
            style={{
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
      className="flex items-center justify-center overflow-hidden"
      style={{
        width: config.scoreBlue.width,
        height: config.scoreBlue.height,
        transform: `skewX(${blueSkew}deg)`,
        background: gradientToCss(config.scoreBlue.gradient),
        boxShadow: glowToBoxShadow(config.scoreBlue.glow),
      }}
    >
      <span
        className="tabular-nums tracking-tight"
        style={{
          transform: `skewX(${-blueSkew}deg)`,
          fontFamily: config.scoreBlue.fontFamily,
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
      className="flex items-center justify-center overflow-hidden"
      style={{
        width: config.scoreOrange.width,
        height: config.scoreOrange.height,
        transform: `skewX(${orangeSkew}deg)`,
        background: gradientToCss(config.scoreOrange.gradient),
        boxShadow: glowToBoxShadow(config.scoreOrange.glow),
      }}
    >
      <span
        className="tabular-nums tracking-tight"
        style={{
          transform: `skewX(${-orangeSkew}deg)`,
          fontFamily: config.scoreOrange.fontFamily,
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
            transform: `translate(${config.scoreBlue.offsetX}px, ${config.scoreBlue.offsetY}px)`,
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
              transform: `translate(-50%, 0)`,
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
            transform: `translate(${config.scoreOrange.offsetX}px, ${config.scoreOrange.offsetY}px)`,
          }}
        >
          {orangeTile}
        </div>
      </motion.div>

      {/* Timer (detached mode) */}
      {detached && (() => {
        const baseStyle = positionToStyle(config.timer.position);
        return (
          <div style={baseStyle}>
            {timerNode}
          </div>
        );
      })()}
    </>
  );
}
