import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PlayerRegistry } from '@/types/livestats';
import type { PostMatchWinners, Winner } from '@/hooks/usePostMatchStats';

interface Row {
  icon: string;
  label: string;
  winner: Winner | null;
  format: (v: number) => string;
}

interface Props {
  winners: PostMatchWinners;
  registryMap: Map<string, PlayerRegistry>;
  /** Delay in ms before the card animates in. Default 2000. */
  delayMs?: number;
}

function initials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function PostMatchStats({ winners, registryMap, delayMs = 2000 }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  const rows: Row[] = [
    { icon: '🚀', label: 'Najszybszy strzał', winner: winners.fastestShot, format: (v) => `${v} km/h` },
    { icon: '💥', label: 'Zniszczenia', winner: winners.mostDemos, format: (v) => `${v} Demos` },
    { icon: '✈️', label: 'Czas w powietrzu', winner: winners.mostAir, format: (v) => `${v} sec` },
    { icon: '🚜', label: 'Czas na ziemi', winner: winners.mostGround, format: (v) => `${v} sec` },
    { icon: '⚡', label: 'Najszybszy na boisku', winner: winners.fastestAvg, format: (v) => `${v} km/h` },
    { icon: '🔥', label: 'Supersonic control', winner: winners.mostSupersonic, format: (v) => `${v} sec` },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className={
          'w-[760px] rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 ' +
          (mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95')
        }
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-[0.3em] text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            MATCH RECAP
          </h2>
          <div className="mt-3 h-[2px] w-full bg-gradient-to-r from-[#3B82F6] via-white/40 to-[#F97316]" />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {rows.map((row) => {
            const reg = row.winner ? registryMap.get(row.winner.player_name) ?? null : null;
            const displayName =
              reg?.display_name?.trim() || row.winner?.player_name || '—';
            return (
              <div
                key={row.label}
                className="grid items-center gap-4 rounded-xl bg-white/5 px-5 py-3"
                style={{ gridTemplateColumns: '40px 1fr auto auto' }}
              >
                <div className="text-2xl leading-none">{row.icon}</div>
                <div className="text-base font-medium text-white/80 uppercase tracking-wider">
                  {row.label}
                </div>
                <div className="flex items-center gap-3 text-white">
                  {row.winner && (
                    <Avatar className="h-7 w-7 ring-1 ring-white/20">
                      {reg?.photo_url ? (
                        <AvatarImage src={reg.photo_url} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-white/10 text-[10px] text-white/80">
                        {initials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-semibold whitespace-nowrap">{displayName}</span>
                </div>
                <div className="font-bold tabular-nums text-white pl-4 min-w-[110px] text-right">
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