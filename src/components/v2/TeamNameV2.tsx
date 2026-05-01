import { motion } from 'framer-motion';
import type { TeamNameStyle, TeamNameShape } from '@/types/overlayV2';
import { gradientToCss } from '@/lib/gradient-utils';
import { glowToBoxShadow } from '@/lib/glow-utils';
import { positionToStyle } from '@/lib/position-utils';

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
      return { borderRadius: 0 }; // skew handles the look
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
  const raw = (name ?? '').trim();
  if (!raw) return null;

  let display = style.uppercase ? raw.toUpperCase() : raw;
  if (style.maxChars > 0 && display.length > style.maxChars) {
    display = display.slice(0, Math.max(1, style.maxChars - 1)) + '…';
  }

  // Skew ALWAYS applies to the outer box (background + border + clip-path).
  // The inner text gets a counter-skew so glyphs stay vertical regardless of shape.
  const skewOuter = style.skewDeg ? `skewX(${style.skewDeg}deg)` : undefined;
  const skewInner = style.skewDeg ? `skewX(${-style.skewDeg}deg)` : undefined;

  const compressY = (py: number) => ({
    paddingTop: Math.max(0, py),
    paddingBottom: Math.max(0, py),
    marginTop: Math.min(0, py),
    marginBottom: Math.min(0, py),
  });

  const shape = shapeStyle(style.shape, style.borderRadius);

  return (
    <div style={{ ...positionToStyle(style.position), opacity: style.opacity }} data-team={team}>
      <div style={{ transform: `translate(${style.offsetX ?? 0}px, ${style.offsetY ?? 0}px)` }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center justify-center select-none"
        style={{
          ...compressY(style.paddingY),
          paddingLeft: style.paddingX,
          paddingRight: style.paddingX,
          minWidth: style.minWidth,
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
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            color: style.textColor,
            letterSpacing: style.letterSpacing,
            textAlign: style.textAlign,
            whiteSpace: 'nowrap',
            width: '100%',
            display: 'inline-block',
          }}
        >
          {display}
        </span>
      </motion.div>
      </div>
    </div>
  );
}
