import type { CSSProperties } from 'react';
import type { MatchMetadata } from '@/types/livestats';
import type { SeriesData } from '@/hooks/useBroadcastSeries';
import type { OverlayV2Config } from '@/types/overlayV2';
import {
  chamferLeft,
  chamferRight,
  gamePillBlue,
  gamePillEmpty,
  gamePillOrange,
  glassBarBlue,
  glassBarOrange,
  glassContentLayer,
  glassLabel,
  glassName,
  glassScoreBox,
  glassScoreDigitLose,
  glassScoreDigitWin,
  glassSpecularSweep,
} from '@/lib/studio-glass-theme';
import { positionToStyle } from '@/lib/position-utils';

interface Props {
  match: MatchMetadata | null;
  series: SeriesData;
  blueName: string;
  orangeName: string;
  config: OverlayV2Config;
}

const BAR_H = 46;
const SCORE_W = 46;
const TIMER_W = 92;
const NAME_W = 188;
const TOTAL_W = NAME_W * 2 + SCORE_W * 2 + TIMER_W;

const SERIES_COUNT: Record<string, number> = { bo1: 1, bo3: 3, bo5: 5, bo7: 7 };

function fmtTimer(m: MatchMetadata | null): string {
  if (!m) return '0:00';
  if (m.timer && /\d/.test(m.timer)) return m.timer;
  const s = Math.max(0, Math.floor(m.time_seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function GlassScorebar({ match, series, blueName, orangeName, config }: Props) {
  if (!config.scoreboard.visible) return null;
  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const blueWin = blue >= orange;
  const orangeWin = orange >= blue;
  const total = SERIES_COUNT[series.type] ?? 3;
  const matchNo = (series.blueScore ?? 0) + (series.orangeScore ?? 0) + 1;
  const boLabel = `Mecz ${matchNo} · BO${total}`;

  const pills: Array<'blue' | 'orange' | 'empty'> = [];
  for (let i = 0; i < series.blueScore; i++) pills.push('blue');
  for (let i = 0; i < series.orangeScore; i++) pills.push('orange');
  while (pills.length < total) pills.push('empty');

  const segmentSweep: CSSProperties = { ...glassSpecularSweep };

  return (
    <div style={{ ...positionToStyle(config.scoreboard.position), width: TOTAL_W }}>
      <div style={{ display: 'flex', alignItems: 'stretch', width: TOTAL_W, height: BAR_H }}>
        {/* Blue team name */}
        <div
          style={{
            ...glassBarBlue,
            ...chamferLeft(10),
            width: NAME_W,
            height: BAR_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 14px 0 22px',
          }}
        >
          <div style={segmentSweep} />
          <div style={{ ...glassContentLayer, ...glassName, fontSize: 21, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {blueName || 'BLUE'}
          </div>
        </div>
        {/* Blue score */}
        <div
          style={{
            ...glassScoreBox,
            width: SCORE_W,
            height: BAR_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={segmentSweep} />
          <div
            style={{
              ...glassContentLayer,
              ...glassName,
              ...(blueWin ? glassScoreDigitWin : glassScoreDigitLose),
              fontSize: 26,
            }}
          >
            {blue}
          </div>
        </div>
        {/* Timer + BO label */}
        <div
          style={{
            ...glassScoreBox,
            width: TIMER_W,
            height: BAR_H,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid rgba(255,255,255,.12)',
            borderRight: '1px solid rgba(255,255,255,.12)',
          }}
        >
          <div style={segmentSweep} />
          <div style={{ ...glassContentLayer, ...glassName, fontSize: 22, lineHeight: 1 }}>
            {fmtTimer(match)}
          </div>
          <div style={{ ...glassContentLayer, ...glassLabel, fontSize: 8, marginTop: 2, color: 'rgba(255,255,255,.6)' }}>
            {boLabel}
          </div>
        </div>
        {/* Orange score */}
        <div
          style={{
            ...glassScoreBox,
            width: SCORE_W,
            height: BAR_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={segmentSweep} />
          <div
            style={{
              ...glassContentLayer,
              ...glassName,
              ...(orangeWin ? glassScoreDigitWin : glassScoreDigitLose),
              fontSize: 26,
            }}
          >
            {orange}
          </div>
        </div>
        {/* Orange team name */}
        <div
          style={{
            ...glassBarOrange,
            ...chamferRight(10),
            width: NAME_W,
            height: BAR_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 22px 0 14px',
          }}
        >
          <div style={segmentSweep} />
          <div style={{ ...glassContentLayer, ...glassName, fontSize: 21, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {orangeName || 'ORANGE'}
          </div>
        </div>
      </div>
      {/* Series pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          marginTop: 6,
        }}
      >
        {pills.map((p, i) => (
          <div
            key={i}
            style={
              p === 'blue' ? gamePillBlue : p === 'orange' ? gamePillOrange : gamePillEmpty
            }
          />
        ))}
      </div>
    </div>
  );
}