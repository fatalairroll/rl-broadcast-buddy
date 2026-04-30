import { motion } from 'framer-motion';
import type { MatchMetadata } from '@/types/livestats';

interface Props {
  match: MatchMetadata | null;
}

export function ScoreboardV2({ match }: Props) {
  const blue = match?.blue_score ?? 0;
  const orange = match?.orange_score ?? 0;
  const timer = match?.timer ?? '5:00';
  const ot = match?.is_overtime ?? false;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute top-0 left-1/2 -translate-x-1/2 flex items-stretch gap-2 select-none"
      style={{ paddingTop: 24 }}
    >
      {/* Blue */}
      <div
        className="px-10 py-4 flex items-center justify-center min-w-[160px]"
        style={{
          transform: 'skewX(-15deg)',
          background: 'linear-gradient(135deg, hsl(217 91% 35%), hsl(217 91% 55%))',
          boxShadow: '0 0 32px hsl(217 91% 60% / 0.55)',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        }}
      >
        <span
          className="text-white font-black text-6xl tabular-nums tracking-tight"
          style={{ transform: 'skewX(15deg)', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
        >
          {blue}
        </span>
      </div>

      {/* Timer */}
      <div
        className="px-12 py-4 flex flex-col items-center justify-center min-w-[220px] bg-black/85 border-y-2 border-white/10"
        style={{ transform: 'skewX(-15deg)' }}
      >
        <span
          className="text-white font-black text-5xl tabular-nums tracking-wider"
          style={{ transform: 'skewX(15deg)', fontFamily: 'Rajdhani, sans-serif' }}
        >
          {timer}
        </span>
        {ot && (
          <span
            className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-300 mt-1 animate-pulse"
            style={{ transform: 'skewX(15deg)', textShadow: '0 0 8px hsl(48 100% 60% / 0.9)' }}
          >
            Overtime
          </span>
        )}
      </div>

      {/* Orange */}
      <div
        className="px-10 py-4 flex items-center justify-center min-w-[160px]"
        style={{
          transform: 'skewX(-15deg)',
          background: 'linear-gradient(135deg, hsl(24 95% 45%), hsl(24 95% 60%))',
          boxShadow: '0 0 32px hsl(24 95% 60% / 0.55)',
        }}
      >
        <span
          className="text-white font-black text-6xl tabular-nums tracking-tight"
          style={{ transform: 'skewX(15deg)', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
        >
          {orange}
        </span>
      </div>
    </motion.div>
  );
}