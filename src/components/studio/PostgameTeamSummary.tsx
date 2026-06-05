import type { PostgamePayload, PostgameTeamStats } from '@/types/postgame';
import {
  PostgameGlassPanel,
  PostgameMatchHeader,
  PostgameProgressRow,
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

interface BarDef {
  label: string;
  field: keyof PostgameTeamStats;
  format: PostgameRowFormat;
}

const BARS: BarDef[] = [
  { label: 'Kickoff Goals', field: 'kickoff_goals_10s', format: 'number' },
  { label: 'Obrony', field: 'saves', format: 'number' },
  { label: 'Demolki', field: 'demos', format: 'number' },
  { label: 'Średni boost drużyny', field: 'avg_boost', format: 'float' },
  { label: 'Zebrane pady', field: 'pad_pickups', format: 'number' },
];

export function PostgameTeamSummary({ data, state }: Props) {
  if (!data) {
    if (state.error && !state.connected) {
      return <StatusMessage>Relay niedostępny (127.0.0.1:49300)</StatusMessage>;
    }
    return <StatusMessage>Brak danych — zagraj mecz z relay</StatusMessage>;
  }

  return (
    <div
      className="min-h-screen p-10 flex flex-col gap-8 items-center"
      style={{ background: 'transparent' }}
    >
      <PostgameMatchHeader
        teamNames={data.team_names}
        blueScore={data.blue_score}
        orangeScore={data.orange_score}
      />
      <PostgameGlassPanel className="w-full max-w-[1100px]">
        <div className="flex flex-col gap-5 px-10 py-10">
          {BARS.map((b) => (
            <PostgameProgressRow
              key={b.label}
              label={b.label}
              blueValue={data.team.blue[b.field] as number | null}
              orangeValue={data.team.orange[b.field] as number | null}
              format={b.format}
            />
          ))}
        </div>
      </PostgameGlassPanel>
    </div>
  );
}

export default PostgameTeamSummary;