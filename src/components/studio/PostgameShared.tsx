import type { CSSProperties, ReactNode } from 'react';
import {
  POSTGAME_BAR_LABEL_FONT_SIZE,
  POSTGAME_BAR_LABEL_LETTER_SPACING,
} from '@/lib/studio-layout';
import {
  glassBarDead,
  glassSpecularSweep,
  glassContentLayer,
  glassName,
  glassLabel,
} from '@/lib/studio-glass-theme';
import type { StudioTheme } from '@/lib/studio-glass-theme';

export const BLUE = '#2563eb';
export const ORANGE = '#f97316';

export const BLUE_GRADIENT = 'linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6)';
export const ORANGE_GRADIENT = 'linear-gradient(270deg, #c2410c, #f97316, #fb923c)';

const PANEL_STYLE: CSSProperties = {
  background: 'rgba(0,0,0,0.65)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

export const PANEL_STYLE_GLASS: CSSProperties = {
  ...glassBarDead,
  borderRadius: 8,
};

export const TEXT_SHADOW = '0 1px 3px rgba(0,0,0,0.7)';

export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return String(n);
}

export function fmtFloat(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(1);
}

export function fmtSeconds(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const total = Math.max(0, Math.round(n));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export type PostgameRowFormat = 'number' | 'seconds' | 'float';

export function formatValue(
  v: number | null | undefined,
  fmt: PostgameRowFormat,
): string {
  switch (fmt) {
    case 'seconds':
      return fmtSeconds(v);
    case 'float':
      return fmtFloat(v);
    default:
      return fmtNum(v);
  }
}

interface PanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function PostgameGlassPanel({ children, className, style, theme = 'standard' }: PanelProps & { theme?: StudioTheme }) {
  const isGlass = theme === 'sharp-glass';
  return (
    <div className={className} style={{ ...(isGlass ? PANEL_STYLE_GLASS : PANEL_STYLE), ...style }}>
      {isGlass && <div style={glassSpecularSweep} aria-hidden />}
      <div style={isGlass ? glassContentLayer : undefined}>{children}</div>
    </div>
  );
}

interface BarRowProps {
  label: string;
  blueValue: number | null | undefined;
  orangeValue: number | null | undefined;
  format?: PostgameRowFormat;
}

export function PostgameTeamBarRow({
  label,
  blueValue,
  orangeValue,
  format = 'number',
}: BarRowProps) {
  const blueRaw = blueValue ?? 0;
  const orangeRaw = orangeValue ?? 0;
  const total = blueRaw + orangeRaw;
  const bluePct = total === 0 ? 50 : (blueRaw / total) * 100;
  const orangePct = 100 - bluePct;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '0 8px',
      }}
    >
      {/* Values row — blue left / orange right, label NOT here */}
      <div
        className="font-esports uppercase"
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          textShadow: TEXT_SHADOW,
        }}
      >
        <span
          className="text-base font-bold tabular-nums"
          style={{ color: BLUE }}
        >
          {formatValue(blueValue, format)}
        </span>
        <span
          className="text-base font-bold tabular-nums"
          style={{ color: ORANGE }}
        >
          {formatValue(orangeValue, format)}
        </span>
      </div>

      {/* Label — full width, centered on the bar's axis */}
      <div style={{ width: '100%', marginBottom: 2 }}>
        <span
          className="font-esports"
          style={{
            display: 'block',
            width: '100%',
            fontSize: POSTGAME_BAR_LABEL_FONT_SIZE,
            letterSpacing: POSTGAME_BAR_LABEL_LETTER_SPACING,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {label}
        </span>
      </div>

      <div
        className="relative flex h-[10px] w-full overflow-visible rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-l-full transition-all duration-300"
          style={{ width: `${bluePct}%`, background: BLUE_GRADIENT }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-300"
          style={{ width: `${orangePct}%`, background: ORANGE_GRADIENT }}
        />
        <div
          className="pointer-events-none absolute top-1/2"
          style={{
            left: `${bluePct}%`,
            transform: 'translate(-50%, -50%)',
            width: 3,
            height: 18,
            background: '#fff',
            borderRadius: 2,
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
          }}
        />
      </div>
    </div>
  );
}

interface BarRowGlassProps extends BarRowProps {
  isFirst?: boolean;
  isLast?: boolean;
}

export function PostgameTeamBarRowGlass({
  label,
  blueValue,
  orangeValue,
  format = 'number',
  isFirst = false,
  isLast = false,
}: BarRowGlassProps) {
  const blueRaw = blueValue ?? 0;
  const orangeRaw = orangeValue ?? 0;
  const total = blueRaw + orangeRaw;
  const blueWins = blueRaw > orangeRaw;
  const orangeWins = orangeRaw > blueRaw;
  const tie = blueRaw === orangeRaw;

  const bluePct = total === 0 ? 50 : (blueRaw / total) * 100;
  const orangePct = 100 - bluePct;

  const ROW_H = 38;
  const LABEL_W = 108;

  const leftPanelStyle = tie || !blueWins ? glassBarDead : glassBarBlue;
  const rightPanelStyle = tie || !orangeWins ? glassBarDead : glassBarOrange;

  const leftValueColor = tie
    ? '#fff'
    : blueWins
      ? '#fff'
      : 'rgba(255,255,255,0.4)';
  const rightValueColor = tie
    ? '#fff'
    : orangeWins
      ? '#fff'
      : 'rgba(255,255,255,0.4)';

  const leftChamfer = isFirst ? chamferLeft(8) : undefined;
  const rightChamfer = isLast ? chamferRight(8) : undefined;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, height: ROW_H }}>
        {/* Left panel */}
        <div
          className="relative flex items-center"
          style={{
            flex: 1,
            ...leftPanelStyle,
            ...leftChamfer,
            justifyContent: 'flex-end',
            paddingRight: 16,
          }}
        >
          <div style={glassSpecularSweep} aria-hidden />
          <span
            className="tabular-nums"
            style={{
              ...glassName,
              fontSize: 19,
              color: leftValueColor,
              textShadow: leftValueColor === '#fff' ? glassName.textShadow : 'none',
              ...glassContentLayer,
            }}
          >
            {formatValue(blueValue, format)}
          </span>
        </div>

        {/* Center label */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: LABEL_W, ...glassStatCenter }}
        >
          <div style={glassStatCenterAccent} aria-hidden />
          <div style={glassSpecularSweep} aria-hidden />
          <span
            style={{
              ...glassLabel,
              fontSize: 10.5,
              ...glassContentLayer,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </div>

        {/* Right panel */}
        <div
          className="relative flex items-center"
          style={{
            flex: 1,
            ...rightPanelStyle,
            ...rightChamfer,
            justifyContent: 'flex-start',
            paddingLeft: 16,
          }}
        >
          <div style={glassSpecularSweep} aria-hidden />
          <span
            className="tabular-nums"
            style={{
              ...glassName,
              fontSize: 19,
              color: rightValueColor,
              textShadow: rightValueColor === '#fff' ? glassName.textShadow : 'none',
              ...glassContentLayer,
            }}
          >
            {formatValue(orangeValue, format)}
          </span>
        </div>
      </div>

      {/* Proportion bar (3px) */}
      {total > 0 && (
        <div style={{ display: 'flex', height: 3, width: '100%', marginTop: 1 }}>
          <div style={{ width: `${bluePct}%`, background: '#00B2FF' }} />
          <div style={{ width: `${orangePct}%`, background: '#F95F02' }} />
        </div>
      )}
    </div>
  );
}