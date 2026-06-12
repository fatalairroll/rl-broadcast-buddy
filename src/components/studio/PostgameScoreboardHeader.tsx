import { TEXT_SHADOW } from './PostgameShared';
import {
  type StudioTheme,
  glassBarBlue,
  glassBarOrange,
  glassChip,
  glassScoreBox,
  glassScoreDigitWin,
  glassScoreDigitLose,
  glassSpecularSweep,
  chamferLeft,
  chamferRight,
  glassName,
  glassLabel,
  glassContentLayer,
} from '@/lib/studio-glass-theme';

interface Props {
  teamNames: { blue: string; orange: string };
  blueScore: number;
  orangeScore: number;
  theme?: StudioTheme;
}

const SKEW = -15;
const BLUE_W = 85;
const ORANGE_W = 85;
const MID_W = 190;
const TILE_H = 50;
const TOTAL_W = BLUE_W + MID_W + ORANGE_W;

const BLUE_GRADIENT = 'linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)';
const ORANGE_GRADIENT = 'linear-gradient(135deg,#9a3412,#f97316,#fb923c)';
const BLUE_GLOW = '0 0 18px rgba(37,99,235,0.55)';
const ORANGE_GLOW = '0 0 18px rgba(249,115,22,0.55)';

export function PostgameScoreboardHeader({
  teamNames,
  blueScore,
  orangeScore,
  theme = 'standard',
}: Props) {
  if (theme === 'sharp-glass') {
    return <GlassHeader teamNames={teamNames} blueScore={blueScore} orangeScore={orangeScore} />;
  }
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
              fontSize: 34,
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
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: '0.18em',
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
              fontSize: 34,
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
    </div>
  );
}

function GlassHeader({
  teamNames,
  blueScore,
  orangeScore,
}: {
  teamNames: { blue: string; orange: string };
  blueScore: number;
  orangeScore: number;
}) {
  const blueWon = blueScore > orangeScore;
  const orangeWon = orangeScore > blueScore;
  const CHIP_W = 50;
  const NAME_W = 280;
  const SCORE_W = 80;
  const H = 56;

  return (
    <div className="select-none flex items-stretch" style={{ height: H, gap: 4 }}>
      {/* Chip A */}
      <div className="relative flex items-center justify-center" style={{ width: CHIP_W, height: H, ...glassChip, ...chamferLeft(10) }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span style={{ ...glassLabel, fontSize: 13, ...glassContentLayer }}>A</span>
      </div>

      {/* Name A */}
      <div className="relative flex items-center justify-end px-4" style={{ width: NAME_W, height: H, ...glassBarBlue }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span style={{ ...glassName, fontSize: 22, ...glassContentLayer, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {teamNames.blue}
        </span>
      </div>

      {/* Score A */}
      <div className="relative flex items-center justify-center" style={{ width: SCORE_W, height: H, ...glassScoreBox }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span className="tabular-nums" style={{ ...glassContentLayer, fontSize: 34, fontWeight: 900, lineHeight: 1, ...(blueWon ? glassScoreDigitWin : glassScoreDigitLose) }}>
          {blueScore}
        </span>
      </div>

      {/* Score B */}
      <div className="relative flex items-center justify-center" style={{ width: SCORE_W, height: H, ...glassScoreBox }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span className="tabular-nums" style={{ ...glassContentLayer, fontSize: 34, fontWeight: 900, lineHeight: 1, ...(orangeWon ? glassScoreDigitWin : glassScoreDigitLose) }}>
          {orangeScore}
        </span>
      </div>

      {/* Name B */}
      <div className="relative flex items-center justify-start px-4" style={{ width: NAME_W, height: H, ...glassBarOrange }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span style={{ ...glassName, fontSize: 22, ...glassContentLayer, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {teamNames.orange}
        </span>
      </div>

      {/* Chip B */}
      <div className="relative flex items-center justify-center" style={{ width: CHIP_W, height: H, ...glassChip, ...chamferRight(10) }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span style={{ ...glassLabel, fontSize: 13, ...glassContentLayer }}>B</span>
      </div>
    </div>
  );
}

export default PostgameScoreboardHeader;