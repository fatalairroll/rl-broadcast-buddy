import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useStudioData } from '@/hooks/useStudioData';
import { MatchCard } from '@/components/studio/MatchCard';
import { BracketView } from '@/components/studio/BracketView';
import { RecentMatchesTable } from '@/components/studio/RecentMatchesTable';
import { supabase } from '@/integrations/supabase/client';
import type { StudioMode, MatchData, PollResults } from '@/types/studio';

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

  // Queue-based rotation for next_3
  const [queue, setQueue] = useState<MatchData[]>([]);

  // Sync queue only when match list actually changes (avoid resetting timer)
  useEffect(() => {
    const newIds = [...matches.map(m => m.match_id)].sort().join(',');
    const curIds = [...queue.map(m => m.match_id)].sort().join(',');
    if (newIds !== curIds) {
      setQueue(matches);
    }
  }, [matches]);

  // Rotate queue every 6s
  useEffect(() => {
    if (queue.length <= 1 || mode !== 'next_3') return;
    const timer = setInterval(() => {
      setQueue(prev => [...prev.slice(1), prev[0]]);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [queue.length, mode]);

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

  // --- Twitch Poll ---
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<PollResults>({});
  const [pollCreating, setPollCreating] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createPoll = useCallback(async () => {
    if (queue.length < 2) return;
    setPollCreating(true);
    try {
      const matchesPayload = queue.map(m => ({
        round_index: m.round_index,
        match_index: m.match_index,
      }));

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/twitch-poll`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matches: matchesPayload, duration: 120 }),
        }
      );
      const data = await res.json();
      if (data.poll_id) {
        setActivePollId(data.poll_id);
      } else {
        console.error('Poll creation failed:', data);
      }
    } catch (err) {
      console.error('Poll creation error:', err);
    } finally {
      setPollCreating(false);
    }
  }, [queue]);

  // Poll results polling
  useEffect(() => {
    if (!activePollId) return;

    const fetchResults = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/twitch-poll?poll_id=${activePollId}`
        );
        const data = await res.json();
        if (data.results) {
          setPollResults(data.results);
        }
        if (data.status === 'TERMINATED' || data.status === 'ARCHIVED' || data.status === 'COMPLETED') {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Poll results error:', err);
      }
    };

    fetchResults();
    pollIntervalRef.current = setInterval(fetchResults, 5000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activePollId]);

  if (!authorized) return null;
  if (isLoading) return null;

  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm font-mono">{error}</div>
    );
  }

  const gameMode = tournament?.mode ?? '2v2';
  const activeMatch = queue[0];
  const upcomingMatches = queue.slice(1);

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
                <div
                  key={m.key}
                  className="relative"
                  onMouseEnter={() => setHoveredMode(m.key)}
                  onMouseLeave={() => setHoveredMode(null)}
                >
                  <button
                    onClick={() => setMode(m.key)}
                    className="w-full transition-colors duration-200"
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

                  {/* Poll button — slides out on hover of "Następne mecze" */}
                  {m.key === 'next_3' && hoveredMode === 'next_3' && mode === 'next_3' && (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        createPoll();
                      }}
                      disabled={pollCreating || queue.length < 2}
                      className="absolute left-full top-0 h-full flex items-center gap-1.5 px-3 whitespace-nowrap transition-colors"
                      style={{
                        background: pollCreating ? 'rgba(20,23,30,0.8)' : 'rgba(37,99,235,0.9)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderLeft: 'none',
                        borderRadius: '0 8px 8px 0',
                        cursor: pollCreating ? 'wait' : 'pointer',
                      }}
                    >
                      <BarChart3 size={14} />
                      {pollCreating ? 'Tworzenie...' : 'Rozpocznij ankietę'}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content — offset when sidebar is visible */}
      <div style={{ marginLeft: !params.get('obs') ? 190 : 0 }}>
        {mode === 'bracket' ? (
          <BracketView matches={matches} />
        ) : mode === 'recent' ? (
          <RecentMatchesTable matches={matches} />
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <AnimatePresence mode="wait">
              {activeMatch && (
                <motion.div
                  key={activeMatch.match_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <MatchCard
                    match={activeMatch}
                    gameMode={gameMode}
                    upcomingMatches={upcomingMatches}
                    pollResults={Object.keys(pollResults).length > 0 ? pollResults : undefined}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
