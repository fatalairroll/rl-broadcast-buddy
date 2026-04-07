import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStudioData } from '@/hooks/useStudioData';
import { MatchCard } from '@/components/studio/MatchCard';
import { BracketView } from '@/components/studio/BracketView';
import type { StudioMode } from '@/types/studio';

const VALID_KEY = 'kXS6cVkTpJM2Qti';
const ROTATE_INTERVAL = 6000;

export default function StudioRender() {
  const [params] = useSearchParams();
  const tournamentId = params.get('tournament_id') ?? '';
  const mode = (params.get('mode') ?? 'next_match') as StudioMode;
  const count = Number(params.get('count') ?? '1');
  const key = params.get('key') ?? '';

  const authorized = key === VALID_KEY;

  const { tournament, matches, isLoading, error } = useStudioData({
    tournamentId,
    mode,
    count,
    enabled: authorized && !!tournamentId,
    pollInterval: 5000,
  });

  const [activeIndex, setActiveIndex] = useState(0);

  const shouldRotate = matches.length > 1;

  useEffect(() => {
    if (!shouldRotate) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % matches.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [shouldRotate, matches.length]);

  // Reset index when matches change
  useEffect(() => {
    setActiveIndex(0);
  }, [matches.length]);

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
      {mode === 'bracket' ? (
        <BracketView matches={matches} />
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
