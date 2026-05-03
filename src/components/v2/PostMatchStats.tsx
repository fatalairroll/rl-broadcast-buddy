import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PlayerRegistry, PostMatchWinners, Winner } from '@/types/livestats';
import type { PostMatchStatsStyle } from '@/types/overlayV2';

interface Row {
  key: keyof PostMatchStatsStyle['rowVisibility'];
  icon: string;
  label: string;
  winner: Winner | null;
  format: (v: number) => string;
}

interface Props {
  winners: PostMatchWinners | null;
  registryMap: Map<string, PlayerRegistry>;
  style: PostMatchStatsStyle;
}

function initials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function PostMatchStats({ winners, registryMap, style }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), style.delayMs);
    return () => clearTimeout(t);
  }, [style.delayMs]);

  if (!style.visible || !winners) return null;

  const allRows: Row[] = [
    { key: 'fastestShot', icon: '🚀', label: 'Najszybszy strzał', winner: winners.fastestShot, format: (v) => `${v} km/h` },
    { key: 'mostDemos', icon: '💥', label: 'Zniszczenia', winner: winners.mostDemos, format: (v) => `${v} Demos` },
    { key: 'mostAir', icon: '✈️', label: 'Czas w powietrzu', winner: winners.mostAir, format: (v) => `${v} sec` },
    { key: 'mostGround', icon: '🚜', label: 'Czas na ziemi', winner: winners.mostGround, format: (v) => `${v} sec` },
    { key: 'fastestAvg', icon: '⚡', label: 'Najszybszy na boisku', winner: winners.fastestAvg, format: (v) => `${v} km/h` },
    { key: 'mostSupersonic', icon: '🔥', label: 'Supersonic control', winner: winners.mostSupersonic, format: (v) => `${v} sec` },
  ];
  const rows: Row[] = allRows.filter((r) => style.rowVisibility[r.key]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className="transition-all duration-500"
        style={{
          width: style.width,
          padding: 32,
          borderRadius: style.borderRadius,
          border: `1px solid ${style.borderColor}`,
          background: style.background,
          backdropFilter: `blur(${style.blurPx}px)`,
          WebkitBackdropFilter: `blur(${style.blurPx}px)`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          fontFamily: style.fontFamily,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontSize: style.titleFontSize,
              color: style.titleColor,
              fontWeight: 700,
              letterSpacing: '0.3em',
              margin: 0,
            }}
          >
            {style.titleText}
          </h2>
          <div
            style={{
              marginTop: 12,
              height: 2,
              width: '100%',
              background: `linear-gradient(to right, ${style.accentBlue}, rgba(255,255,255,0.4), ${style.accentOrange})`,
            }}
          />
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => {
            const reg = row.winner ? registryMap.get(row.winner.player_name) ?? null : null;
            const displayName = reg?.display_name?.trim() || row.winner?.player_name || '—';
            return (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 20px',
                  borderRadius: 12,
                  background: style.rowBackground,
                }}
              >
                <div style={{ fontSize: 24, lineHeight: 1 }}>{row.icon}</div>
                <div
                  style={{
                    fontSize: style.labelFontSize,
                    color: style.labelColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                  }}
                >
                  {row.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: style.playerColor }}>
                  {row.winner && style.showAvatars && (
                    <Avatar className="h-7 w-7" style={{ outline: '1px solid rgba(255,255,255,0.2)' }}>
                      {reg?.photo_url ? <AvatarImage src={reg.photo_url} alt={displayName} /> : null}
                      <AvatarFallback className="bg-white/10 text-[10px] text-white/80">
                        {initials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: style.playerFontSize,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: style.valueColor,
                    fontSize: style.valueFontSize,
                    paddingLeft: 16,
                    minWidth: 110,
                    textAlign: 'right',
                  }}
                >
                  {row.winner ? row.format(row.winner.value) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
