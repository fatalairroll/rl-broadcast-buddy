import { motion } from 'framer-motion';
import type { SeriesType, OverlayV2Config } from '@/types/overlayV2';
import { defaultOverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';

interface Props {
  type: SeriesType;
  blueScore: number;
  orangeScore: number;
  config?: OverlayV2Config;
}

const GAMES_BY_TYPE: Record<SeriesType, number> = {
  bo1: 1,
  bo3: 2, // first to 2
  bo5: 3, // first to 3
  bo7: 4, // first to 4
};

function Dot({
  filled,
  color,
  size,
  border,
  shape,
  skew,
}: {
  filled: boolean;
  color: string;
  size: number;
  border: string;
  shape: 'circle' | 'square' | 'pill';
  skew: number;
}) {
  const radius = shape === 'circle' ? '50%' : shape === 'pill' ? '999px' : '2px';
  return (
    <span
      style={{
        display: 'inline-block',
        width: shape === 'pill' ? size * 1.6 : size,
        height: size,
        borderRadius: radius,
        background: filled ? color : 'transparent',
        border: `2px solid ${filled ? color : border}`,
        boxShadow: filled ? `0 0 12px ${color}` : 'none',
        transform: shape === 'square' ? `skewX(${skew}deg)` : undefined,
      }}
    />
  );
}

export function SeriesScoreV2({ type, blueScore, orangeScore, config = defaultOverlayV2Config }: Props) {
  const s = config.seriesScore;
  if (!s.visible) return null;

  const total = GAMES_BY_TYPE[type];
  const blueFilled = Math.max(0, Math.min(total, blueScore));
  const orangeFilled = Math.max(0, Math.min(total, orangeScore));

  const blueDots = Array.from({ length: total }, (_, i) => i < blueFilled);
  const orangeDots = Array.from({ length: total }, (_, i) => i < orangeFilled);

  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        ...positionToStyle(s.position),
        fontFamily: s.fontFamily,
        // Zerowy „punkt" — etykieta BO jest twardo zakotwiczona w środku
        // tego punktu, a obie grupy kropek rozrastają się symetrycznie
        // na zewnątrz. Dzięki temu zmiana BO1↔BO7 nie przesuwa środka.
        width: 0,
        height: 0,
      }}
    >
      {/* Etykieta BO — środek etykiety = punkt kotwiczenia (offsetX, offsetY) */}
      {s.showLabel && (
        <span
          className="uppercase font-black tracking-widest"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            color: s.labelColor,
            fontSize: s.labelFontSize,
            lineHeight: 1,
          }}
        >
          {type.toUpperCase()}
        </span>
      )}

      {/* Niebieskie kropki — rosną w lewo od środka, najnowsza najbliżej etykiety */}
      <div
        style={{
          position: 'absolute',
          right: `calc(0px + ${s.groupGap}px)`,
          top: 0,
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: s.gap,
          direction: 'rtl',
        }}
      >
        {blueDots.map((f, i) => (
          <Dot
            key={`b-${i}`}
            filled={f}
            color={s.blueColor}
            size={s.dotSize}
            border={s.borderColor}
            shape={s.shape}
            skew={s.skewDeg}
          />
        ))}
      </div>

      {/* Pomarańczowe kropki — rosną w prawo od środka */}
      <div
        style={{
          position: 'absolute',
          left: `calc(0px + ${s.groupGap}px)`,
          top: 0,
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: s.gap,
        }}
      >
        {orangeDots.map((f, i) => (
          <Dot
            key={`o-${i}`}
            filled={f}
            color={s.orangeColor}
            size={s.dotSize}
            border={s.borderColor}
            shape={s.shape}
            skew={s.skewDeg}
          />
        ))}
      </div>
    </motion.div>
  );
}
