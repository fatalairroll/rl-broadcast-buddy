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
import {
  NB_ACID,
  NB_BLUE,
  NB_BORDER,
  NB_FONT,
  NB_INK,
  NB_ORANGE,
  NB_WHITE,
  nbShadow,
} from '@/lib/studio-neobrutal-theme';

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

const SHOW_TEAM_LOGOS = false;

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
  if (theme === 'neobrutal') {
    return <NbHeader teamNames={teamNames} blueScore={blueScore} orangeScore={orangeScore} />;
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
      {SHOW_TEAM_LOGOS && (
        <div className="relative flex items-center justify-center" style={{ width: CHIP_W, height: H, ...glassChip, ...chamferLeft(10) }}>
          <div style={glassSpecularSweep} aria-hidden />
          <span style={{ ...glassLabel, fontSize: 13, ...glassContentLayer }}>A</span>
        </div>
      )}

      {/* Name A */}
      <div className="relative flex items-center justify-end px-4" style={{ width: NAME_W, height: H, ...glassBarBlue, ...chamferLeft(10) }}>
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
      <div className="relative flex items-center justify-start px-4" style={{ width: NAME_W, height: H, ...glassBarOrange, ...chamferRight(10) }}>
        <div style={glassSpecularSweep} aria-hidden />
        <span style={{ ...glassName, fontSize: 22, ...glassContentLayer, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {teamNames.orange}
        </span>
      </div>

      {SHOW_TEAM_LOGOS && (
        <div className="relative flex items-center justify-center" style={{ width: CHIP_W, height: H, ...glassChip, ...chamferRight(10) }}>
          <div style={glassSpecularSweep} aria-hidden />
          <span style={{ ...glassLabel, fontSize: 13, ...glassContentLayer }}>B</span>
        </div>
      )}
    </div>
  );
}

export default PostgameScoreboardHeader;

function NbHeader({
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
  const H = 90;
  const NAME_W = 360;
  const SCORE_W = 110;

  const teamCell = (name: string, bg: string): React.CSSProperties => ({
    width: NAME_W,
    height: H,
    background: bg,
    border: NB_BORDER,
    boxShadow: nbShadow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 18px',
    fontFamily: NB_FONT,
    fontWeight: 900,
    fontSize: 38,
    color: NB_WHITE,
    textTransform: 'uppercase',
    letterSpacing: '-.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={teamCell(teamNames.blue, NB_BLUE)}>{teamNames.blue}</div>
      <div
        style={{
          width: SCORE_W,
          height: H,
          background: NB_ACID,
          border: NB_BORDER,
          borderLeft: 'none',
          borderRight: 'none',
          boxShadow: nbShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: 46,
          color: NB_INK,
          zIndex: 2,
          position: 'relative',
        }}
      >
        <span className="tabular-nums" style={{ color: blueWon ? NB_INK : '#888' }}>
          {blueScore}
        </span>
        <span style={{ margin: '0 8px', opacity: 0.45 }}>:</span>
        <span className="tabular-nums" style={{ color: orangeWon ? NB_INK : '#888' }}>
          {orangeScore}
        </span>
      </div>
      <div style={teamCell(teamNames.orange, NB_ORANGE)}>{teamNames.orange}</div>
    </div>
  );
}