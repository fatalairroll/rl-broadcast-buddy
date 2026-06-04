import type { PostgamePayload, PostgamePlayer } from '@/types/postgame';

interface Props {
  data: PostgamePayload | null;
  state: { connected: boolean; error: string | null };
}

const BLUE = '#2563eb';
const ORANGE = '#f97316';

function fmtSeconds(s: number | null | undefined): string {
  if (s === null || s === undefined) return '—';
  const total = Math.max(0, Math.round(s));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return String(n);
}

function fmtFloat(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(1);
}

interface Row {
  label: string;
  blue: number | null;
  orange: number | null;
  fmt: (n: number | null) => string;
}

function buildRows(blue: PostgamePlayer, orange: PostgamePlayer): Row[] {
  return [
    { label: 'Bramki', blue: blue.goals, orange: orange.goals, fmt: fmtNum },
    { label: 'Asysty', blue: blue.assists, orange: orange.assists, fmt: fmtNum },
    { label: 'Obrony', blue: blue.saves, orange: orange.saves, fmt: fmtNum },
    { label: 'Strzały', blue: blue.shots, orange: orange.shots, fmt: fmtNum },
    { label: 'Demolki', blue: blue.demos, orange: orange.demos, fmt: fmtNum },
    { label: 'Zebrane pady', blue: blue.pad_pickups, orange: orange.pad_pickups, fmt: fmtNum },
    { label: 'Supersonic', blue: blue.supersonic_seconds, orange: orange.supersonic_seconds, fmt: fmtSeconds },
    { label: 'Średni boost', blue: blue.avg_boost, orange: orange.avg_boost, fmt: fmtFloat },
    { label: 'Czas na 100 boost', blue: blue.time_at_100_seconds, orange: orange.time_at_100_seconds, fmt: fmtSeconds },
  ];
}

function CompareRow({ row }: { row: Row }) {
  const b = row.blue;
  const o = row.orange;
  const blueWins = b !== null && o !== null && b > o;
  const orangeWins = b !== null && o !== null && o > b;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2 border-b border-white/5">
      <div
        className={`text-right tabular-nums ${blueWins ? 'font-bold' : 'text-zinc-300'}`}
        style={blueWins ? { color: BLUE } : undefined}
      >
        {row.fmt(b)}
      </div>
      <div className="text-xs uppercase tracking-wider text-zinc-400 text-center min-w-[140px]">
        {row.label}
      </div>
      <div
        className={`text-left tabular-nums ${orangeWins ? 'font-bold' : 'text-zinc-300'}`}
        style={orangeWins ? { color: ORANGE } : undefined}
      >
        {row.fmt(o)}
      </div>
    </div>
  );
}

function PairBlock({ pair }: { pair: { blue: PostgamePlayer; orange: PostgamePlayer; rank: number } }) {
  const rows = buildRows(pair.blue, pair.orange);
  return (
    <div className="bg-zinc-900/90 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div
        className="grid grid-cols-[1fr_auto_auto_1fr] items-center gap-4 px-6 py-4"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      >
        <div className="text-right text-2xl font-bold truncate" style={{ color: BLUE }}>
          {pair.blue.player_name}
        </div>
        <div className="text-5xl font-bold tabular-nums" style={{ color: BLUE }}>
          {pair.blue.score}
        </div>
        <div className="text-5xl font-bold tabular-nums" style={{ color: ORANGE }}>
          {pair.orange.score}
        </div>
        <div className="text-left text-2xl font-bold truncate" style={{ color: ORANGE }}>
          {pair.orange.player_name}
        </div>
      </div>
      <div>
        {rows.map((r) => (
          <CompareRow key={r.label} row={r} />
        ))}
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

export function PostgamePlayerCompare({ data, state }: Props) {
  if (!data) {
    if (state.error && !state.connected) {
      return <StatusMessage>Relay niedostępny (127.0.0.1:49300)</StatusMessage>;
    }
    return <StatusMessage>Brak danych — zagraj mecz z relay</StatusMessage>;
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="text-zinc-200 text-3xl font-semibold">
          {data.team_names.blue}{' '}
          <span className="tabular-nums" style={{ color: BLUE }}>{data.blue_score}</span>
          <span className="text-zinc-500 mx-3">vs</span>
          <span className="tabular-nums" style={{ color: ORANGE }}>{data.orange_score}</span>{' '}
          {data.team_names.orange}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {data.pairs.map((p) => (
          <PairBlock key={p.rank} pair={p} />
        ))}
      </div>
    </div>
  );
}

export default PostgamePlayerCompare;