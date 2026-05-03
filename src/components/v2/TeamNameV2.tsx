import { motion } from 'framer-motion';
import type { TeamNameStyle, TeamNameShape } from '@/types/overlayV2';
import { gradientToCss } from '@/lib/gradient-utils';
import { glowToBoxShadow } from '@/lib/glow-utils';
import { positionToStyle } from '@/lib/position-utils';
import { useScoreboardBounds } from '@/lib/scoreboard-bounds-context';

interface Props {
  name: string | null | undefined;
  style: TeamNameStyle;
  team: 'blue' | 'orange';
}

function shapeStyle(shape: TeamNameShape, borderRadius: number): React.CSSProperties {
  switch (shape) {
    case 'sharp':
      return { borderRadius: 0 };
    case 'rounded':
      return { borderRadius };
    case 'pill':
      return { borderRadius: 9999 };
    case 'parallelogram':
      return { borderRadius: 0 };
    case 'hexagon':
      return {
        clipPath: 'polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)',
        borderRadius: 0,
      };
    default:
      return { borderRadius: 0 };
  }
}

export function TeamNameV2({ name, style, team }: Props) {
  if (!style.visible) return null;
  const { bounds } = useScoreboardBounds();
  const raw = (name ?? '').trim();
  if (!raw) return null;

  let display = style.uppercase ? raw.toUpperCase() : raw;
  if (style.maxChars > 0 && display.length > style.maxChars) {
    display = display.slice(0, Math.max(1, style.maxChars - 1)) + '…';
  }

  // Skew ALWAYS applies to the outer box; counter-skew on inner span keeps
  // glyphs vertical. We MUST keep skew off any framer-motion node, because
  // framer-motion overwrites the inline `transform` while animating.
  const skewOuter = style.skewDeg ? `skewX(${style.skewDeg}deg)` : undefined;
  const skewInner = style.skewDeg ? `skewX(${-style.skewDeg}deg)` : undefined;

  const shape = shapeStyle(style.shape, style.borderRadius);

  // Position resolution: attach mode uses scoreboard bounds, else PositionV2.
  let outerStyle: React.CSSProperties;
  if (style.attachToScoreboard && bounds) {
    outerStyle =
      team === 'blue'
        ? {
            position: 'absolute',
            left: bounds.left - style.width + (style.attachOffsetX ?? 0),
            top: bounds.top + (style.attachOffsetY ?? 0),
          }
        : {
            position: 'absolute',
            left: bounds.right + (style.attachOffsetX ?? 0),
            top: bounds.top + (style.attachOffsetY ?? 0),
          };
  } else {
    outerStyle = positionToStyle(style.position);
  }

  return (
    <div style={{ ...outerStyle, opacity: style.opacity }} data-team={team}>
      {/* motion handles only entry animation (y/opacity) + fine offset.
          DO NOT put skew on this node — framer-motion would clobber it. */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Static skew wrapper — owns the box appearance and skew. */}
        <div
          className="flex items-center select-none overflow-hidden"
          style={{
            width: style.width,
            height: style.height,
            paddingLeft: style.paddingX,
            paddingRight: style.paddingX,
            justifyContent:
              style.textAlign === 'left' ? 'flex-start' :
              style.textAlign === 'right' ? 'flex-end' : 'center',
            background: gradientToCss(style.gradient, style.background) ?? style.background,
            boxShadow: glowToBoxShadow(style.glow),
            border: style.borderWidth > 0 ? `${style.borderWidth}px solid ${style.borderColor}` : undefined,
            transform: skewOuter,
            ...shape,
          }}
        >
          <span
            className="tracking-wider"
            style={{
              transform: skewInner,
              display: 'inline-block',
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              color: style.textColor,
              letterSpacing: style.letterSpacing,
              textAlign: style.textAlign,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {display}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
