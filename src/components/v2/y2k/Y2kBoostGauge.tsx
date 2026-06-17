import { AnimatePresence, motion } from 'framer-motion';
import type { PlayerLive } from '@/types/livestats';
import type { OverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';
import {
  Y2K_FONT,
  Y2K_MONO,
  Y2K_CHROME,
  y2kBorder,
  y2kScoreShadow,
  y2kChromeTextShadow,
} from '@/lib/y2k-theme';

interface Props {
  config: OverlayV2Config;
  activePlayer: PlayerLive | null;
}

export function Y2kBoostGauge({ config, activePlayer }: Props) {
  const size = config.boostGauge.size ?? 230;
  const stroke = 7;
  const r = size / 2 - 13;
  const C = 2 * Math.PI * r;

  const side: 'blue' | 'orange' = activePlayer?.team_num === 1 ? 'orange' : 'blue';
  const boost = Math.max(0, Math.min(100, Math.round(activePlayer?.boost ?? 0)));
  const critical = boost < 10;
  const supersonic = boost === 100;
  const gradId = critical
    ? 'gauge-y2k-critical'
    : side === 'blue'
      ? 'gauge-y2k-blue'
      : 'gauge-y2k-orange';

  const digitColor = critical ? '#FF8A6B' : supersonic ? '#FFD9A0' : '#ffffff';
  const digitShadow = critical
    ? '0 0 16px rgba(255,90,50,.7), 0 2px 0 rgba(0,0,0,.55)'
    : supersonic
      ? '0 0 18px rgba(255,180,90,.8), 0 2px 0 rgba(0,0,0,.55)'
      : (y2kScoreShadow as string);

  const dialShadow = critical
    ? '0 0 30px rgba(255,90,60,.35), inset 0 2px 3px rgba(255,255,255,.35), inset 0 -10px 20px rgba(0,0,10,.5)'
    : '0 0 30px rgba(91,141,239,.3), inset 0 2px 3px rgba(255,255,255,.35), inset 0 -10px 20px rgba(0,0,10,.5)';

  return (
    <AnimatePresence>
      {activePlayer && (
        <motion.div
          key="y2k-boost-gauge"
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
              background: 'linear-gradient(180deg, #2a3550 0%, #10141f 50%, #1a2236 100%)',
              border: y2kBorder,
              boxShadow: dialShadow,
            }}
          >
            <svg
              width={size}
              height={size}
              style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
            >
              <defs>
                <linearGradient id="gauge-y2k-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cfe3ff" />
                  <stop offset="50%" stopColor="#5B8DEF" />
                  <stop offset="100%" stopColor="#3460c8" />
                </linearGradient>
                <linearGradient id="gauge-y2k-orange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffe0cc" />
                  <stop offset="50%" stopColor="#FF6B35" />
                  <stop offset="100%" stopColor="#c84e20" />
                </linearGradient>
                <linearGradient id="gauge-y2k-critical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd0c0" />
                  <stop offset="50%" stopColor="#FF5E3A" />
                  <stop offset="100%" stopColor="#c8281a" />
                </linearGradient>
              </defs>
              {/* track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(180,200,255,.12)"
                strokeWidth={stroke}
              />
              {/* progress */}
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
              {/* dotted chrome scale */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 5}
                fill="none"
                stroke="rgba(196,181,253,.2)"
                strokeWidth={1}
                strokeDasharray="2 7"
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
                  fontFamily: Y2K_FONT,
                  fontWeight: 900,
                  fontSize: size * 0.30,
                  lineHeight: 1,
                  color: digitColor,
                  textShadow: digitShadow,
                }}
              >
                {boost}
              </div>
              <div
                style={{
                  fontFamily: Y2K_MONO,
                  fontSize: Math.max(10, Math.round(size * 0.053)),
                  color: Y2K_CHROME,
                  textShadow: y2kChromeTextShadow,
                  marginTop: 4,
                  letterSpacing: 2,
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