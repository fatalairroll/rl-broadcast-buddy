import { TEXT_SHADOW } from './PostgameShared';

interface Props {
  teamNames: { blue: string; orange: string };
  blueScore: number;
  orangeScore: number;
}

const SKEW = -15;
const BLUE_W = 140;
const ORANGE_W = 140;
const MID_W = 260;
const TILE_H = 100;
const TOTAL_W = BLUE_W + MID_W + ORANGE_W;

const BLUE_GRADIENT = 'linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)';
const ORANGE_GRADIENT = 'linear-gradient(135deg,#9a3412,#f97316,#fb923c)';
const BLUE_GLOW = '0 0 18px rgba(37,99,235,0.55)';
const ORANGE_GLOW = '0 0 18px rgba(249,115,22,0.55)';

export function PostgameScoreboardHeader({
  teamNames,
  blueScore,
  orangeScore,
}: Props) {
  return (
    <div className="select-none" style={{ width: TOTAL_W }}>
      <div
        className="flex items-stretch"
        style={{ width: TOTAL_W, height: TILE_H }}
      >
        {/* Blue tile */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: BLUE_W,
            height: TILE_H,
            transform: `skewX(${SKEW}deg)`,
            background: BLUE_GRADIENT,
            boxShadow: BLUE_GLOW,
          }}
        >
          <span
            className="font-esports tabular-nums tracking-tight"
            style={{
              transform: `skewX(${-SKEW}deg)`,
              fontSize: 60,
              fontWeight: 900,
              color: '#fff',
              textShadow: TEXT_SHADOW,
              lineHeight: 1,
            }}
          >
            {blueScore}
          </span>
        </div>

        {/* Middle "PODSUMOWANIE" */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: MID_W,
            height: TILE_H,
            transform: `skewX(${SKEW}deg)`,
            background: 'rgba(0,0,0,0.85)',
            borderTop: '2px solid rgba(255,255,255,0.1)',
            borderBottom: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <span
            className="font-esports uppercase"
            style={{
              transform: `skewX(${-SKEW}deg)`,
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: '0.22em',
              color: '#fff',
              textShadow: TEXT_SHADOW,
              lineHeight: 1,
            }}
          >
            PODSUMOWANIE
          </span>
        </div>

        {/* Orange tile */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: ORANGE_W,
            height: TILE_H,
            transform: `skewX(${SKEW}deg)`,
            background: ORANGE_GRADIENT,
            boxShadow: ORANGE_GLOW,
          }}
        >
          <span
            className="font-esports tabular-nums tracking-tight"
            style={{
              transform: `skewX(${-SKEW}deg)`,
              fontSize: 60,
              fontWeight: 900,
              color: '#fff',
              textShadow: TEXT_SHADOW,
              lineHeight: 1,
            }}
          >
            {orangeScore}
          </span>
        </div>
      </div>

      {/* Team names row */}
      <div
        className="flex items-center justify-between font-esports uppercase"
        style={{
          width: TOTAL_W,
          marginTop: 6,
          fontSize: 16,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.85)',
          textShadow: TEXT_SHADOW,
        }}
      >
        <span className="truncate" style={{ maxWidth: TOTAL_W / 2 - 20 }}>
          {teamNames.blue}
        </span>
        <span
          className="truncate text-right"
          style={{ maxWidth: TOTAL_W / 2 - 20 }}
        >
          {teamNames.orange}
        </span>
      </div>
    </div>
  );
}

export default PostgameScoreboardHeader;