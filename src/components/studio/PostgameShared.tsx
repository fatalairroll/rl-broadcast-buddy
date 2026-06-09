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

export function PostgameGlassPanel({ children, className, style }: PanelProps) {
  return (
    <div className={className} style={{ ...PANEL_STYLE, ...style }}>
      {children}
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
    <div className="flex flex-col gap-[2px] px-2 py-0">
      <div
        className="font-esports grid grid-cols-3 items-center uppercase"
        style={{ textShadow: TEXT_SHADOW }}
      >
        <div
          className="text-base font-bold tabular-nums text-left"
          style={{ color: BLUE }}
        >
          {formatValue(blueValue, format)}
        </div>
        <div
          className="text-[10px] tracking-[0.2em] text-center"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {label}
        </div>
        <div
          className="text-base font-bold tabular-nums text-right"
          style={{ color: ORANGE }}
        >
          {formatValue(orangeValue, format)}
        </div>
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