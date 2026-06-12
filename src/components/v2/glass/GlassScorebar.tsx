import type { CSSProperties } from 'react';
import type { MatchMetadata } from '@/types/livestats';
import type { SeriesData } from '@/hooks/useBroadcastSeries';
import type { OverlayV2Config } from '@/types/overlayV2';
import {
  chamferTopLeft,
  chamferTopRight,
  glassContentLayer,
  glassLabel,
  glassName,
  glassScoreDigitLose,
  glassScoreDigitWin,
  glassSpecularSweep,
  opaqueBarBlue,
  opaqueBarOrange,
  opaqueDark,
  opaqueCornerSpec,
  opaquePillBlue,
  opaquePillOrange,
  opaquePillEmpty,
  fakeRefractionBlue,
  fakeRefractionOrange,
  fakeRefractionDark,
} from '@/lib/studio-glass-theme';
import { positionToStyle } from '@/lib/position-utils';

interface Props {
  match: MatchMetadata | null;
  series: SeriesData;
  blueName: string;
  orangeName: string;
  config: OverlayV2Config;
}

const ROW1_H = 66;
const SCORE_W = 58;
const TIMER_W = 116;

const SERIES_COUNT: Record<string, number> = { bo1: 1, bo3: 3, bo5: 5, bo7: 7 };

function fmtTimer(m: MatchMetadata | null): string {
  if (!m) return '0:00';
  if (m.timer && /\d/.test(m.timer)) return m.timer;
  const s = Math.max(0, Math.floor(m.time_seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function GlassScorebar({ match, series, blueName, orangeName, config }: Props) {
  if (!config.scoreboard.visible) return null;
  const totalW = config.scoreboard.coverWidth ?? 736;
  const totalH = config.scoreboard.coverHeight ?? 104;
  const row2H = Math.max(24, totalH - ROW1_H);
  const nameW = Math.max(120, Math.floor((totalW - SCORE_W * 2 - TIMER_W) / 2));

  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const tie = blue === orange;
  const blueWin = tie || blue > orange;
  const orangeWin = tie || orange > blue;
  const total = SERIES_COUNT[series.type] ?? 3;
  const matchNo = (series.blueScore ?? 0) + (series.orangeScore ?? 0) + 1;
  const boLabel = `Mecz ${matchNo} · BO${total}`;

  const pills: Array<'blue' | 'orange' | 'empty'> = [];
  for (let i = 0; i < series.blueScore; i++) pills.push('blue');
  for (let i = 0; i < series.orangeScore; i++) pills.push('orange');
  while (pills.length < total) pills.push('empty');

  const fitFontSize = (n: string) =>
    n.length <= 14 ? 21 : n.length <= 20 ? 19 : 17;
  const blueFs = fitFontSize(blueName || 'BLUE');
  const orangeFs = fitFontSize(orangeName || 'ORANGE');

  const segmentSweep: CSSProperties = { ...glassSpecularSweep };
  const row2Sweep: CSSProperties = { ...glassSpecularSweep, height: '30%' };

  const row2Clip: CSSProperties = {
    clipPath:
      'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))',
  };

  return (
    <div style={{ ...positionToStyle(config.scoreboard.position), width: totalW }}>
      {/* ROW 1 — nazwy, wyniki, zegar */}
      <div style={{ display: 'flex', alignItems: 'stretch', width: totalW, height: ROW1_H }}>
        {/* Blue team name */}
        <div
          style={{
            ...opaqueBarBlue,
            ...chamferTopLeft(12),
            width: nameW,
            height: ROW1_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 14px 0 16px',
          }}
        >
          <div style={fakeRefractionBlue} />
          <div style={opaqueCornerSpec} />
          <div style={segmentSweep} />
          <div style={{ ...glassContentLayer, ...glassName, fontSize: blueFs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {blueName || 'BLUE'}
          </div>
        </div>
        {/* Blue score */}
        <div
          style={{
            ...opaqueDark,
            width: SCORE_W,
            height: ROW1_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={fakeRefractionDark} />
          <div style={segmentSweep} />
          <div
            style={{
              ...glassContentLayer,
              ...glassName,
              ...(blueWin ? glassScoreDigitWin : glassScoreDigitLose),
              fontSize: 34,
            }}
          >
            {blue}
          </div>
        </div>
        {/* Timer */}
        <div
          style={{
            ...opaqueDark,
            width: TIMER_W,
            height: ROW1_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid rgba(255,255,255,.14)',
            borderRight: '1px solid rgba(255,255,255,.14)',
          }}
        >
          <div style={fakeRefractionDark} />
          <div style={segmentSweep} />
          <div style={{ ...glassContentLayer, ...glassName, fontSize: 30, lineHeight: 1 }}>
            {fmtTimer(match)}
          </div>
        </div>
        {/* Orange score */}
        <div
          style={{
            ...opaqueDark,
            width: SCORE_W,
            height: ROW1_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={fakeRefractionDark} />
          <div style={segmentSweep} />
          <div
            style={{
              ...glassContentLayer,
              ...glassName,
              ...(orangeWin ? glassScoreDigitWin : glassScoreDigitLose),
              fontSize: 34,
            }}
          >
            {orange}
          </div>
        </div>
        {/* Orange team name */}
        <div
          style={{
            ...opaqueBarOrange,
            ...chamferTopRight(12),
            width: nameW,
            height: ROW1_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 16px 0 14px',
          }}
        >
          <div style={fakeRefractionOrange} />
          <div style={{ ...opaqueCornerSpec, left: 'auto', right: '-8%' }} />
          <div style={segmentSweep} />
          <div style={{ ...glassContentLayer, ...glassName, fontSize: orangeFs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {orangeName || 'ORANGE'}
          </div>
        </div>
      </div>
      {/* ROW 2 — domknięcie + seria + brand + numer meczu */}
      <div
        style={{
          ...opaqueDark,
          ...row2Clip,
          borderTop: 'none',
          width: totalW,
          height: row2H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div style={fakeRefractionDark} />
        <div style={row2Sweep} />
        <div style={{ ...glassContentLayer, ...glassLabel, fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
          MMRIVALS
        </div>
        <div style={{ ...glassContentLayer, display: 'flex', alignItems: 'center', gap: 4 }}>
          {pills.map((p, i) => (
            <div
              key={i}
              style={
                p === 'blue' ? opaquePillBlue : p === 'orange' ? opaquePillOrange : opaquePillEmpty
              }
            />
          ))}
        </div>
        <div style={{ ...glassContentLayer, ...glassLabel, fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
          {boLabel}
        </div>
      </div>
    </div>
  );
}