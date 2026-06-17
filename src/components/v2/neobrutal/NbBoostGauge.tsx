import { AnimatePresence, motion } from 'framer-motion';
import type { PlayerLive } from '@/types/livestats';
import type { OverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';
import {
  NB_FONT,
  NB_MONO,
  NB_BLUE,
  NB_ORANGE,
  NB_ACID,
  NB_INK,
  NB_PAPER,
  NB_BORDER,
  nbShadow,
} from '@/lib/neobrutal-theme';

interface Props {
  config: OverlayV2Config;
  activePlayer: PlayerLive | null;
}

export function NbBoostGauge({ config, activePlayer }: Props) {
  const size = config.boostGauge.size ?? 230;
  const stroke = 10;
  const r = size / 2 - 16;
  const C = 2 * Math.PI * r;

  const side: 'blue' | 'orange' = activePlayer?.team_num === 1 ? 'orange' : 'blue';
  const boost = Math.max(0, Math.min(100, Math.round(activePlayer?.boost ?? 0)));
  const critical = boost < 10;
  const supersonic = boost === 100;
  const ringColor = critical ? NB_ORANGE : supersonic ? NB_ACID : side === 'blue' ? NB_BLUE : NB_ORANGE;

  return (
    <AnimatePresence>
      {activePlayer && (
        <motion.div
          key="nb-boost-gauge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            ...positionToStyle(config.boostGauge.position),
            width: size,
            height: size,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: size,
              height: size,
              borderRadius: '50%',
              background: NB_PAPER,
              border: NB_BORDER,
              boxShadow: nbShadow,
            }}
          >
            <svg
              width={size}
              height={size}
              style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(17,17,17,.15)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - boost / 100)}
                style={{ transition: 'stroke-dashoffset .12s linear' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <div
                style={{
                  fontFamily: NB_FONT,
                  fontWeight: 900,
                  fontSize: size * 0.32,
                  lineHeight: 1,
                  color: NB_INK,
                  letterSpacing: '-.03em',
                }}
              >
                {boost}
              </div>
              <div
                style={{
                  fontFamily: NB_MONO,
                  fontWeight: 700,
                  fontSize: Math.max(10, Math.round(size * 0.05)),
                  color: NB_INK,
                  letterSpacing: '.18em',
                  marginTop: 4,
                }}
              >
                BOOST
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}