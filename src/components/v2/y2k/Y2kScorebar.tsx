import type { CSSProperties } from 'react';
import type { MatchMetadata } from '@/types/livestats';
import type { SeriesData } from '@/hooks/useBroadcastSeries';
import type { OverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';
import {
  Y2K_CHROME,
  Y2K_FONT,
  Y2K_MONO,
  chromeBlue,
  chromeOrange,
  y2kBorder,
  y2kCoreBg,
  y2kChromeTextShadow,
  y2kGlow,
  y2kNameShadow,
  y2kScanlines,
  y2kScoreShadow,
} from '@/lib/y2k-theme';

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
  if (len <= 14) return 27;
  if (len <= 20) return 23;
  return 19;
}

function clampName(n: string): string {
  if (n.length <= 25) return n;
  return n.slice(0, 24) + '…';
}

const SERIES_LABELS: Record<string, string> = { bo1: 'BO1', bo3: 'BO3', bo5: 'BO5', bo7: 'BO7' };

export function Y2kScorebar({ match, series, blueName, orangeName, config }: Props) {
  if (!config.scoreboard.visible) return null;
  const totalW = config.scoreboard.coverWidth ?? 740;
  const totalH = config.scoreboard.coverHeight ?? 76;

  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const tie = blue === orange;
  const blueLead = blue > orange;
  const orangeLead = orange > blue;

  const scoreColorBlue: CSSProperties =
    tie || blueLead
      ? { color: '#fff', textShadow: y2kScoreShadow }
      : { color: 'rgba(255,255,255,.35)' };
  const scoreColorOrange: CSSProperties =
    tie || orangeLead
      ? { color: '#fff', textShadow: y2kScoreShadow }
      : { color: 'rgba(255,255,255,.35)' };

  const total = SERIES_LABELS[series.type] ?? 'BO3';
  const matchNo = (series.blueScore ?? 0) + (series.orangeScore ?? 0) + 1;
  const gmLabel = `GM${matchNo}/${total}`;

  const NAME_W = Math.floor(totalW * 0.30);
  const SCORE_W = Math.floor(totalW * 0.10);
  const CORE_W = totalW - NAME_W * 2 - SCORE_W * 2;

  const blueLabel = clampName(blueName || 'BLUE');
  const orangeLabel = clampName(orangeName || 'ORANGE');

  const panelShell: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    border: y2kBorder,
    boxShadow: y2kGlow,
  };

  return (
    <div
      style={{
        ...positionToStyle(config.scoreboard.position),
        width: totalW,
        height: totalH,
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
        fontFamily: Y2K_FONT,
      }}
    >
      {/* Blue team name */}
      <div
        style={{
          ...panelShell,
          width: NAME_W,
          background: chromeBlue,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 16px',
        }}
      >
        <div style={y2kScanlines} />
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            color: '#fff',
            fontWeight: 900,
            fontSize: fitNameFontSize(blueLabel),
            letterSpacing: '.02em',
            textTransform: 'uppercase',
            textShadow: y2kNameShadow,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: NAME_W - 32,
          }}
        >
          {blueLabel}
        </div>
      </div>

      {/* Blue score */}
      <div
        style={{
          ...panelShell,
          width: SCORE_W,
          background: y2kCoreBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={y2kScanlines} />
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 1,
            ...scoreColorBlue,
          }}
        >
          {blue}
        </div>
      </div>

      {/* Core: timer + GMx/BOy */}
      <div
        style={{
          ...panelShell,
          width: CORE_W,
          background: y2kCoreBg,
          borderLeft: y2kBorder,
          borderRight: y2kBorder,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <div style={y2kScanlines} />
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            color: Y2K_CHROME,
            fontFamily: Y2K_MONO,
            fontWeight: 700,
            fontSize: 30,
            lineHeight: 1,
            textShadow: y2kChromeTextShadow,
            letterSpacing: '.02em',
          }}
        >
          {fmtTimer(match)}
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            color: 'rgba(255,255,255,.65)',
            fontFamily: Y2K_MONO,
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: '.18em',
          }}
        >
          {gmLabel}
        </div>
      </div>

      {/* Orange score */}
      <div
        style={{
          ...panelShell,
          width: SCORE_W,
          background: y2kCoreBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={y2kScanlines} />
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 1,
            ...scoreColorOrange,
          }}
        >
          {orange}
        </div>
      </div>

      {/* Orange team name */}
      <div
        style={{
          ...panelShell,
          width: NAME_W,
          background: chromeOrange,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 16px',
        }}
      >
        <div style={y2kScanlines} />
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            color: '#fff',
            fontWeight: 900,
            fontSize: fitNameFontSize(orangeLabel),
            letterSpacing: '.02em',
            textTransform: 'uppercase',
            textShadow: y2kNameShadow,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: NAME_W - 32,
          }}
        >
          {orangeLabel}
        </div>
      </div>
    </div>
  );
}