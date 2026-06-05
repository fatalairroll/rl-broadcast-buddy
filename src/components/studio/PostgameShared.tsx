import type { CSSProperties, ReactNode } from 'react';

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

function formatValue(v: number | null | undefined, fmt: PostgameRowFormat): string {
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

export function PostgameGlassPanel({ children, className, style }: PanelProps) {
  return (
    <div className={className} style={{ ...PANEL_STYLE, ...style }}>
      {children}
    </div>
  );
}

interface HeaderProps {
  teamNames: { blue: string; orange: string };
  blueScore: number;
  orangeScore: number;
}

export function PostgameMatchHeader({ teamNames, blueScore, orangeScore }: HeaderProps) {
  return (
    <div
      className="font-esports flex items-center justify-center gap-8 uppercase"
      style={{ textShadow: TEXT_SHADOW }}
    >
      <div className="text-3xl text-zinc-200 tracking-wider truncate max-w-[420px] text-right">
        {teamNames.blue}
      </div>
      <div className="text-6xl font-black tabular-nums" style={{ color: BLUE }}>
        {blueScore}
      </div>
      <div className="text-2xl text-zinc-500">vs</div>
      <div className="text-6xl font-black tabular-nums" style={{ color: ORANGE }}>
        {orangeScore}
      </div>
      <div className="text-3xl text-zinc-200 tracking-wider truncate max-w-[420px] text-left">
        {teamNames.orange}
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  blueValue: number | null | undefined;
  orangeValue: number | null | undefined;
  format?: PostgameRowFormat;
}

export function PostgameProgressRow({
  label,
  blueValue,
  orangeValue,
  format = 'number',
}: RowProps) {
  const blueRaw = blueValue ?? 0;
  const orangeRaw = orangeValue ?? 0;
  const total = blueRaw + orangeRaw;
  const bluePct = total === 0 ? 50 : (blueRaw / total) * 100;
  const orangePct = 100 - bluePct;

  return (
    <div className="flex flex-col gap-2 px-2">
      <div
        className="font-esports grid grid-cols-3 items-center uppercase"
        style={{ textShadow: TEXT_SHADOW }}
      >
        <div
          className="text-2xl font-bold tabular-nums text-left"
          style={{ color: BLUE }}
        >
          {formatValue(blueValue, format)}
        </div>
        <div
          className="text-xs tracking-[0.25em] text-center"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {label}
        </div>
        <div
          className="text-2xl font-bold tabular-nums text-right"
          style={{ color: ORANGE }}
        >
          {formatValue(orangeValue, format)}
        </div>
      </div>
      <div
        className="flex h-[10px] w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${bluePct}%`, background: BLUE_GRADIENT }}
        />
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${orangePct}%`, background: ORANGE_GRADIENT }}
        />
      </div>
    </div>
  );
}