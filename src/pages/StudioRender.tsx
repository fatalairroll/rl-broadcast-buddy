import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStudioData } from '@/hooks/useStudioData';
import { MatchCard } from '@/components/studio/MatchCard';
import { BracketView } from '@/components/studio/BracketView';
import { RecentMatchesTable } from '@/components/studio/RecentMatchesTable';
import type { StudioMode } from '@/types/studio';

const VALID_KEY = 'kXS6cVkTpJM2Qti';
const ROTATE_INTERVAL = 6000;

const MODES: { key: StudioMode; label: string }[] = [
  { key: 'next_3', label: 'Następne mecze' },
  { key: 'bracket', label: 'Drabinka' },
  { key: 'recent', label: 'Zakończone mecze' },
];

export default function StudioRender() {
  const [params] = useSearchParams();
  const tournamentId = params.get('tournament_id') ?? '';
  const initialMode = (params.get('mode') ?? 'next_3') as StudioMode;
  const count = Number(params.get('count') ?? '3');
  const key = params.get('key') ?? '';

  const authorized = key === VALID_KEY;

  const [mode, setMode] = useState<StudioMode>(initialMode);

  const { tournament, matches, isLoading, error } = useStudioData({
    tournamentId,
    mode,
    count,
    enabled: authorized && !!tournamentId,
    pollInterval: 5000,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const shouldRotate = matches.length > 1 && mode === 'next_3';

  useEffect(() => {
    if (!shouldRotate) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % matches.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [shouldRotate, matches.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [matches.length, mode]);

  // Force transparent background for OBS
  useEffect(() => {
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    return () => {
      document.body.style.background = prevBody;
      document.documentElement.style.background = prevHtml;
    };
  }, []);

  if (!authorized) return null;
  if (isLoading) return null;

  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm font-mono">{error}</div>
    );
  }

  const gameMode = tournament?.mode ?? '2v2';

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Sidebar — hidden from OBS via ?obs=1 param, visible only in browser */}
      {!params.get('obs') && (
        <div
          className="fixed top-1/2 left-0 z-50 flex -translate-y-1/2"
        >
          <div
            className="flex flex-col overflow-hidden"
            style={{
              width: 180,
              background: 'rgba(20, 23, 30, 0.95)',
              borderRadius: '0 12px 12px 0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: 'none',
            }}
          >
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className="transition-colors duration-200"
                  style={{
                    padding: '16px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    textAlign: 'center' as const,
                    cursor: 'pointer',
                    border: 'none',
                    background: active ? '#00A3FF' : 'transparent',
                    color: active ? '#FFFFFF' : '#94A3B8',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {mode === 'bracket' ? (
        <BracketView matches={matches} />
      ) : mode === 'recent' ? (
        <RecentMatchesTable matches={matches} />
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <AnimatePresence mode="wait">
            {matches[activeIndex] && (
              <motion.div
                key={matches[activeIndex].match_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <MatchCard match={matches[activeIndex]} gameMode={gameMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
