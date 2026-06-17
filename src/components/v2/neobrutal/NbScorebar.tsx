import type { CSSProperties } from 'react';
import type { MatchMetadata } from '@/types/livestats';
import type { SeriesData } from '@/hooks/useBroadcastSeries';
import type { OverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';
import {
  NB_FONT,
  NB_MONO,
  NB_BLUE,
  NB_ORANGE,
  NB_ACID,
  NB_INK,
  NB_WHITE,
  NB_BORDER,
  nbShadow,
} from '@/lib/neobrutal-theme';

interface Props {
  match: MatchMetadata | null;
  series: SeriesData;
  blueName: string;
  orangeName: string;
  config: OverlayV2Config;
}

function fmtTimer(m: MatchMetadata | null): string {
  if (!m) return '0:00';
  if (m.timer && /\d/.test(m.timer)) return m.timer;
  const s = Math.max(0, Math.floor(m.time_seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fitNameFontSize(n: string): number {
  const len = n.length;
  if (len <= 14) return 28;
  if (len <= 20) return 23;
  return 18;
}

function clampName(n: string): string {
  if (n.length <= 25) return n;
  return n.slice(0, 24) + '…';
}

const SERIES_LABELS: Record<string, string> = { bo1: 'BO1', bo3: 'BO3', bo5: 'BO5', bo7: 'BO7' };

export function NbScorebar({ match, series, blueName, orangeName, config }: Props) {
  if (!config.scoreboard.visible) return null;
  const totalW = config.scoreboard.coverWidth ?? 760;
  const totalH = config.scoreboard.coverHeight ?? 78;

  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const tie = blue === orange;
  const blueLead = blue > orange;
  const orangeLead = orange > blue;

  const blueLabel = clampName(blueName || 'BLUE');
  const orangeLabel = clampName(orangeName || 'ORANGE');

  const NAME_W = Math.max(250, Math.floor(totalW * 0.34));
  const SCORE_W = 80;
  const TIMER_W = totalW - NAME_W * 2 - SCORE_W * 2;

  const scoreColor = (lead: boolean): CSSProperties => ({
    color: tie || lead ? NB_INK : '#888',
  });

  const total = SERIES_LABELS[series.type] ?? 'BO3';
  const matchNo = (series.blueScore ?? 0) + (series.orangeScore ?? 0) + 1;
  const gmLabel = `GM${matchNo} · ${total}`;

  // Bloc base. Middle blocs collapse borders via negative -3px horizontal margin
  // so they share a single 3px black seam (signature brutalism overlap).
  const baseCell: CSSProperties = {
    height: totalH,
    border: NB_BORDER,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  return (
    <div
      style={{
        ...positionToStyle(config.scoreboard.position),
        width: totalW,
        height: totalH,
        display: 'flex',
        alignItems: 'stretch',
        fontFamily: NB_FONT,
        // Container shadow on the outer wrapper so all blocks share one hard shadow.
        filter: `drop-shadow(${nbShadow})`,
      }}
    >
      {/* Blue team name */}
      <div
        style={{
          ...baseCell,
          width: NAME_W,
          background: NB_BLUE,
          justifyContent: 'flex-end',
          padding: '0 16px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            color: NB_WHITE,
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: fitNameFontSize(blueLabel),
            letterSpacing: '-.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: NAME_W - 32,
            lineHeight: 1,
          }}
        >
          {blueLabel}
        </div>
      </div>

      {/* Blue score */}
      <div
        style={{
          ...baseCell,
          width: SCORE_W,
          background: NB_ACID,
          marginLeft: -3,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 1,
            ...scoreColor(blueLead),
          }}
        >
          {blue}
        </div>
      </div>

      {/* Timer */}
      <div
        style={{
          ...baseCell,
          width: TIMER_W,
          background: NB_WHITE,
          flexDirection: 'column',
          gap: 2,
          marginLeft: -3,
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: NB_INK,
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: 30,
            lineHeight: 1,
            letterSpacing: '-.02em',
          }}
        >
          {fmtTimer(match)}
        </div>
        <div
          style={{
            color: NB_INK,
            fontFamily: NB_MONO,
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '.14em',
          }}
        >
          {gmLabel}
        </div>
      </div>

      {/* Orange score */}
      <div
        style={{
          ...baseCell,
          width: SCORE_W,
          background: NB_ACID,
          marginLeft: -3,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 1,
            ...scoreColor(orangeLead),
          }}
        >
          {orange}
        </div>
      </div>

      {/* Orange team name */}
      <div
        style={{
          ...baseCell,
          width: NAME_W,
          background: NB_ORANGE,
          justifyContent: 'flex-start',
          padding: '0 16px',
          marginLeft: -3,
          zIndex: 1,
        }}
      >
        <div
          style={{
            color: NB_WHITE,
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: fitNameFontSize(orangeLabel),
            letterSpacing: '-.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: NAME_W - 32,
            lineHeight: 1,
          }}
        >
          {orangeLabel}
        </div>
      </div>
    </div>
  );
}