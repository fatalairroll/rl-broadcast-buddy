import { useEffect, useRef, useState } from 'react';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';

interface Props {
  player: PlayerLive;
  registry?: PlayerRegistry | null;
  side: 'left' | 'right';
  isActive?: boolean;
  config?: OverlayV2Config;
}

export function BoostBarV2({ player, registry, side, isActive, config = defaultOverlayV2Config }: Props) {
  const c = config.boostBar;
  const team = (player.team_num as 0 | 1) ?? 0;
  const colors = team === 0
    ? { from: c.blueFrom, to: c.blueTo, glow: c.blueGlow }
    : { from: c.orangeFrom, to: c.orangeTo, glow: c.orangeGlow };

  const reverse = side === 'right';
  const displayName = registry?.display_name ?? player.player_name;
  const targetBoost = Math.max(0, Math.min(100, player.boost ?? 0));

  // Lokalne wygładzanie boosta. Snapshoty z bazy lecą partiami ~0,5–1 s
  // (wszyscy gracze mają identyczny updated_at), więc oprócz szybszego gonienia
  // targetu dorzucamy mały "drain" pomiędzy paczkami, a start animacji każdego
  // paska jest losowo przesunięty w fazie, żeby 6 pasków nie ruszało równo.
  const [smooth, setSmooth] = useState(targetBoost);
  const smoothRef = useRef(targetBoost);
  const targetRef = useRef(targetBoost);
  const prevTargetRef = useRef(targetBoost);
  const lastTargetAtRef = useRef<number>(performance.now());
  const trendRef = useRef<0 | -1 | 1>(0); // -1 = boost spada, 1 = rośnie
  const lastTsRef = useRef<number | null>(null);
  const phaseOffsetRef = useRef<number>(Math.random() * 80); // ms

  useEffect(() => {
    const prev = prevTargetRef.current;
    if (targetBoost < prev - 0.5) trendRef.current = -1;
    else if (targetBoost > prev + 0.5) trendRef.current = 1;
    // jeśli ~równe — zostaw poprzedni trend (gracz prawdopodobnie dalej drenuje/zbiera)
    prevTargetRef.current = targetBoost;
    targetRef.current = targetBoost;
    lastTargetAtRef.current = performance.now();
  }, [targetBoost]);

  useEffect(() => {
    let raf = 0;
    let started = false;
    const start = () => {
      const tick = (ts: number) => {
        const last = lastTsRef.current ?? ts;
        const dt = Math.min(0.1, (ts - last) / 1000);
        lastTsRef.current = ts;

        const cur = smoothRef.current;
        const tgt = targetRef.current;
        const diff = tgt - cur;

        let next = cur;
        if (Math.abs(diff) > 0.05) {
          // Gonienie ostatniego snapshotu (~300–500 ms na pełną korektę).
          const rate = diff > 0 ? 220 : 160; // %/s
          const step = Math.sign(diff) * Math.min(Math.abs(diff), rate * dt);
          next = cur + step;
        } else if (trendRef.current === -1 && cur > 0) {
          // Między paczkami: jeśli gracz spadał, kontynuuj delikatny drain,
          // żeby pasek nie zamierał. Korekta przyjdzie z następnym snapshotem.
          next = Math.max(tgt - 5, cur - 25 * dt); // ~25%/s, max 5pp poniżej targetu
        } else if (cur !== tgt) {
          next = tgt;
        }

        if (next !== cur) {
          smoothRef.current = next;
          setSmooth(next);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      started = true;
    };
    const timeout = window.setTimeout(start, phaseOffsetRef.current);
    return () => {
      window.clearTimeout(timeout);
      if (started) cancelAnimationFrame(raf);
    };
  }, []);

  const boost = Math.round(smooth);
  const barPct = smooth;

  return (
    <div
      className={`relative ${player.is_demolished ? 'opacity-50 grayscale' : ''}`}
      style={{
        width: c.width,
        height: c.cardHeight,
        transform: `skewX(${c.skewDeg}deg)`,
        filter: isActive ? `drop-shadow(0 0 16px ${colors.glow})` : undefined,
      }}
    >
      <div
        className="flex flex-col overflow-hidden h-full"
        style={{
          background: c.background,
          border: `1px solid ${c.borderColor}`,
          padding: `${c.paddingY}px ${c.paddingX}px`,
          direction: reverse ? 'rtl' : 'ltr',
          boxSizing: 'border-box',
          gap: 4,
          minHeight: 0,
          justifyContent: 'center',
        }}
      >
        {/* Nick + boost number */}
        <div
          className="flex items-center justify-between"
          style={{ transform: `skewX(${-c.skewDeg}deg)`, direction: 'ltr', flex: '0 0 auto', lineHeight: 1 }}
        >
          <span
            className={`uppercase truncate ${reverse ? 'order-2 text-right' : 'order-1 text-left'}`}
            style={{
              maxWidth: c.width - 80,
              fontFamily: c.nameFontFamily,
              letterSpacing: '0.05em',
              fontWeight: 700,
              fontSize: c.nameFontSize,
              color: c.nameColor,
              lineHeight: 1,
            }}
          >
            {displayName}
          </span>
          <span
            className={`tabular-nums ${reverse ? 'order-1' : 'order-2'}`}
            style={{
              fontWeight: 900,
              fontSize: c.boostFontSize,
              color: player.is_supersonic ? c.supersonicColor : c.nameColor,
              lineHeight: 1,
            }}
          >
            {boost}
          </span>
        </div>

        {/* Boost bar */}
        <div
          className="relative bg-white/10 overflow-hidden"
          style={{ height: c.barHeight, width: '100%', flex: '0 0 auto' }}
        >
          <div
            className="absolute inset-y-0"
            style={{
              left: reverse ? 'auto' : 0,
              right: reverse ? 0 : 'auto',
              background: `linear-gradient(${reverse ? '270deg' : '90deg'}, ${colors.from}, ${colors.to})`,
              boxShadow: player.is_supersonic ? `0 0 12px ${colors.glow}` : undefined,
              width: `${barPct}%`,
              willChange: 'width',
            }}
          />
        </div>

        {/* Mini stats */}
        {(c.stats.goals || c.stats.assists || c.stats.saves || c.stats.shots || c.stats.demos) && (
          <div
            className={`flex gap-3 tabular-nums uppercase tracking-wider ${reverse ? 'justify-start' : 'justify-end'}`}
            style={{
              transform: `skewX(${-c.skewDeg}deg)`,
              direction: 'ltr',
              fontSize: c.statsFontSize,
              fontWeight: 700,
              color: c.statsColor,
              flex: '0 0 auto',
              lineHeight: 1,
            }}
          >
            {c.stats.goals && <span>G {player.goals}</span>}
            {c.stats.assists && <span style={{ opacity: 0.85 }}>A {player.assists}</span>}
            {c.stats.saves && <span style={{ opacity: 0.8 }}>SV {player.saves}</span>}
            {c.stats.shots && <span style={{ opacity: 0.7 }}>SH {player.shots}</span>}
            {c.stats.demos && <span style={{ opacity: 0.6 }}>D {player.demos}</span>}
          </div>
        )}
      </div>

      {player.is_demolished && (
        <div
          className="absolute inset-0 flex items-center justify-center font-black text-xs uppercase tracking-widest"
          style={{ transform: `skewX(${-c.skewDeg}deg)`, color: c.demolishedColor, textShadow: `0 0 8px ${c.demolishedColor}` }}
        >
          DEMOLISHED
        </div>
      )}
    </div>
  );
}
