import { AnimatePresence, motion } from 'framer-motion';
import type { PlayerLive } from '@/types/livestats';
import type { OverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';
import {
  opaqueDark,
  fakeRefractionDark,
  glassName,
  glassScoreDigitWin,
  glassLabel,
} from '@/lib/studio-glass-theme';

interface Props {
  config: OverlayV2Config;
  activePlayer: PlayerLive | null;
}

export function GlassBoostGauge({ config, activePlayer }: Props) {
  const size = config.boostGauge.size ?? 230;
  const stroke = Math.max(8, Math.round(size * 0.048));
  const r = size / 2 - stroke - 4;
  const C = 2 * Math.PI * r;

  const side: 'blue' | 'orange' = activePlayer?.team_num === 1 ? 'orange' : 'blue';
  const boost = Math.max(0, Math.min(100, Math.round(activePlayer?.boost ?? 0)));
  const critical = boost < 10;
  const supersonic = boost === 100;
  const gradId = critical ? 'gauge-critical' : side === 'blue' ? 'gauge-blue' : 'gauge-orange';

  const digitColor = critical
    ? '#FF7A5C'
    : supersonic
      ? '#FFD27A'
      : '#fff';
  const digitGlow = critical
    ? '0 0 16px rgba(255,90,60,.6), 0 2px 6px rgba(0,0,0,.5)'
    : supersonic
      ? '0 0 18px rgba(255,200,90,.65), 0 2px 6px rgba(0,0,0,.5)'
      : glassScoreDigitWin.textShadow as string;

  return (
    <AnimatePresence>
      {activePlayer && (
        <motion.div
          key="boost-gauge"
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
              ...opaqueDark,
              width: size,
              height: size,
              borderRadius: '50%',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,10,.5))',
            }}
          >
            <div style={{ ...fakeRefractionDark, borderRadius: '50%' }} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: '40%',
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.32), transparent 65%)',
                pointerEvents: 'none',
              }}
            />
            <svg
              width={size}
              height={size}
              style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
            >
              <defs>
                <linearGradient id="gauge-blue" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00B2FF" />
                  <stop offset="100%" stopColor="#1B5FD6" />
                </linearGradient>
                <linearGradient id="gauge-orange" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF9430" />
                  <stop offset="100%" stopColor="#D44E00" />
                </linearGradient>
                <linearGradient id="gauge-critical" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF5C3C" />
                  <stop offset="100%" stopColor="#FF8A50" />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,.08)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth={stroke}
                strokeLinecap="round"
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
                  ...glassName,
                  fontSize: size * 0.245,
                  lineHeight: 1,
                  color: digitColor,
                  textShadow: digitGlow,
                }}
              >
                {boost}
              </div>
              <div
                style={{
                  ...glassLabel,
                  fontSize: Math.max(10, Math.round(size * 0.048)),
                  color: 'rgba(255,255,255,.55)',
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