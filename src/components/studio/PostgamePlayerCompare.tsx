import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PostgamePayload, PostgamePair } from '@/types/postgame';
import {
  BLUE,
  ORANGE,
  PostgameGlassPanel,
  PostgameMatchHeader,
  PostgameProgressRow,
  TEXT_SHADOW,
  type PostgameRowFormat,
} from './PostgameShared';

interface Props {
  data: PostgamePayload | null;
  state: { connected: boolean; error: string | null };
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-zinc-400 text-xl font-medium"
      style={{ background: 'transparent' }}
    >
      {children}
    </div>
  );
}

interface RowDef {
  label: string;
  field: keyof PostgamePair['blue'];
  format: PostgameRowFormat;
}

const ROWS: RowDef[] = [
  { label: 'Bramki', field: 'goals', format: 'number' },
  { label: 'Asysty', field: 'assists', format: 'number' },
  { label: 'Obrony', field: 'saves', format: 'number' },
  { label: 'Strzały', field: 'shots', format: 'number' },
  { label: 'Demolki', field: 'demos', format: 'number' },
  { label: 'Zebrane pady', field: 'pad_pickups', format: 'number' },
  { label: 'Supersonic', field: 'supersonic_seconds', format: 'seconds' },
  { label: 'Średni boost', field: 'avg_boost', format: 'float' },
  { label: 'Czas na 100 boosta', field: 'time_at_100_seconds', format: 'seconds' },
];

function PlayerSideColumn({
  side,
  name,
  score,
}: {
  side: 'blue' | 'orange';
  name: string;
  score: number;
}) {
  const color = side === 'blue' ? BLUE : ORANGE;
  const lineOnRight = side === 'blue';
  return (
    <div
      className="flex items-stretch h-full"
      style={{ flexDirection: lineOnRight ? 'row' : 'row-reverse' }}
    >
      <div
        className="flex flex-col items-center justify-center gap-4 px-6 py-4 font-esports uppercase"
        style={{ textShadow: TEXT_SHADOW }}
      >
        <div
          className="text-xl tracking-widest truncate max-w-[220px]"
          style={{ color }}
        >
          {name}
        </div>
        <div
          className="font-black tabular-nums leading-none"
          style={{
            color,
            fontSize: 96,
            writingMode: 'vertical-rl',
            transform: side === 'blue' ? 'rotate(180deg)' : undefined,
          }}
        >
          {score}
        </div>
      </div>
      <div
        style={{
          width: 2,
          background: color,
          opacity: 0.6,
          alignSelf: 'stretch',
        }}
      />
    </div>
  );
}

export function PostgamePlayerCompare({ data, state }: Props) {
  const [activePairIndex, setActivePairIndex] = useState(0);

  const pairs = data?.pairs ?? [];

  useEffect(() => {
    if (activePairIndex > Math.max(0, pairs.length - 1)) {
      setActivePairIndex(0);
    }
  }, [pairs.length, activePairIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActivePairIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePairIndex((i) => Math.min(pairs.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pairs.length]);

  if (!data) {
    if (state.error && !state.connected) {
      return <StatusMessage>Relay niedostępny (127.0.0.1:49300)</StatusMessage>;
    }
    return <StatusMessage>Brak danych — zagraj mecz z relay</StatusMessage>;
  }

  const pair = pairs[activePairIndex];
  const showNav = pairs.length > 1;
  const canPrev = activePairIndex > 0;
  const canNext = activePairIndex < pairs.length - 1;

  return (
    <div
      className="min-h-screen p-10 flex flex-col gap-8"
      style={{ background: 'transparent' }}
    >
      <PostgameMatchHeader
        teamNames={data.team_names}
        blueScore={data.blue_score}
        orangeScore={data.orange_score}
      />

      {pair && (
        <div className="relative">
          {showNav && (
            <>
              <button
                type="button"
                onClick={() => canPrev && setActivePairIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white opacity-40 hover:opacity-80 transition-opacity disabled:opacity-0"
                disabled={!canPrev}
                aria-label="Poprzednia para"
              >
                <ChevronLeft size={64} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => canNext && setActivePairIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white opacity-40 hover:opacity-80 transition-opacity disabled:opacity-0"
                disabled={!canNext}
                aria-label="Następna para"
              >
                <ChevronRight size={64} strokeWidth={1.5} />
              </button>
            </>
          )}

          <PostgameGlassPanel className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-[auto_1fr_auto] items-stretch">
              <PlayerSideColumn
                side="blue"
                name={pair.blue.player_name}
                score={pair.blue.score}
              />
              <div className="flex flex-col gap-4 py-8 px-8">
                {ROWS.map((r) => (
                  <PostgameProgressRow
                    key={r.label}
                    label={r.label}
                    blueValue={pair.blue[r.field] as number | null}
                    orangeValue={pair.orange[r.field] as number | null}
                    format={r.format}
                  />
                ))}
              </div>
              <PlayerSideColumn
                side="orange"
                name={pair.orange.player_name}
                score={pair.orange.score}
              />
            </div>
          </PostgameGlassPanel>
        </div>
      )}
    </div>
  );
}

export default PostgamePlayerCompare;