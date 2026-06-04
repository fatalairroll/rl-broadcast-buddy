import type { PostgamePayload, PostgameTeamStats } from '@/types/postgame';

interface Props {
  data: PostgamePayload | null;
  state: { connected: boolean; error: string | null };
}

const BLUE = '#2563eb';
const ORANGE = '#f97316';

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return String(n);
}

function fmtFloat(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(1);
}

interface Bar {
  label: string;
  blue: number | null;
  orange: number | null;
  fmt: (n: number | null) => string;
}

function buildBars(blue: PostgameTeamStats, orange: PostgameTeamStats): Bar[] {
  return [
    { label: 'Gole ≤10 s od kickoffa', blue: blue.kickoff_goals_10s, orange: orange.kickoff_goals_10s, fmt: fmtNum },
    { label: 'Obrony', blue: blue.saves, orange: orange.saves, fmt: fmtNum },
    { label: 'Demolki', blue: blue.demos, orange: orange.demos, fmt: fmtNum },
    { label: 'Średni boost drużyny', blue: blue.avg_boost, orange: orange.avg_boost, fmt: fmtFloat },
    { label: 'Zebrane pady', blue: blue.pad_pickups, orange: orange.pad_pickups, fmt: fmtNum },
  ];
}

function BarRow({ bar }: { bar: Bar }) {
  const b = bar.blue ?? 0;
  const o = bar.orange ?? 0;
  const total = b + o;
  const blueWidth = total > 0 ? (b / total) * 100 : 50;
  const bothNull = bar.blue === null && bar.orange === null;
  return (
    <div className="flex flex-col gap-1 px-2">
      <div className="flex items-center justify-between text-zinc-300">
        <div className="text-2xl tabular-nums font-bold" style={{ color: BLUE }}>
          {bar.fmt(bar.blue)}
        </div>
        <div className="text-xs uppercase tracking-widest text-zinc-400">
          {bar.label}
        </div>
        <div className="text-2xl tabular-nums font-bold" style={{ color: ORANGE }}>
          {bar.fmt(bar.orange)}
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800 flex">
        {bothNull ? (
          <div className="h-full w-full bg-zinc-700" />
        ) : (
          <>
            <div className="h-full transition-all" style={{ width: `${blueWidth}%`, background: BLUE }} />
            <div className="h-full transition-all" style={{ width: `${100 - blueWidth}%`, background: ORANGE }} />
          </>
        )}
      </div>
    </div>
  );
}

function TeamColumn({ name, score, color, align }: { name: string; score: number; color: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col items-${align === 'left' ? 'start' : 'end'} justify-center gap-4 px-6 py-10`}>
      <div
        className="text-xs uppercase tracking-[0.4em] text-zinc-400"
        style={{
          writingMode: 'vertical-rl',
          transform: align === 'left' ? 'rotate(180deg)' : undefined,
        }}
      >
        {name}
      </div>
      <div className="text-[160px] leading-none font-black tabular-nums" style={{ color }}>
        {score}
      </div>
    </div>
  );
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

export function PostgameTeamSummary({ data, state }: Props) {
  if (!data) {
    if (state.error && !state.connected) {
      return <StatusMessage>Relay niedostępny (127.0.0.1:49300)</StatusMessage>;
    }
    return <StatusMessage>Brak danych — zagraj mecz z relay</StatusMessage>;
  }

  const bars = buildBars(data.team.blue, data.team.orange);

  return (
    <div className="min-h-screen p-6" style={{ background: 'transparent' }}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-8 bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <TeamColumn name={data.team_names.blue} score={data.blue_score} color={BLUE} align="left" />
        <div className="flex flex-col gap-6 py-10">
          {bars.map((b) => (
            <BarRow key={b.label} bar={b} />
          ))}
        </div>
        <TeamColumn name={data.team_names.orange} score={data.orange_score} color={ORANGE} align="right" />
      </div>
    </div>
  );
}

export default PostgameTeamSummary;