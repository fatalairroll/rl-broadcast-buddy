import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStudioData } from '@/hooks/useStudioData';
import { MatchCard } from '@/components/studio/MatchCard';
import { BracketView } from '@/components/studio/BracketView';
import type { StudioMode } from '@/types/studio';

const VALID_KEY = 'MY_SECRET_AUTH';

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

  if (!authorized) {
    return null; // Don't render anything for unauthorized access
  }

  if (isLoading) {
    return null; // Transparent loading state
  }

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
          <AnimatePresence mode="popLayout">
            {matches.map((match) => (
              <MatchCard key={match.match_id} match={match} gameMode={gameMode} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
