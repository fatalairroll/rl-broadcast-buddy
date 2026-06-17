import type { CSSProperties, ReactNode } from 'react';
import { Star } from 'lucide-react';
import type { PostgamePayload, PostgamePlayer, PostgameState } from '@/types/postgame';
import {
  BLUE,
  ORANGE,
  PostgameGlassPanel,
  PostgameTeamBarRow,
  PostgameMiniBarGlass,
  TEXT_SHADOW,
  formatValue,
  type PostgameRowFormat,
} from './PostgameShared';
import { PostgameScoreboardHeader } from './PostgameScoreboardHeader';
import { POSTGAME_CENTER_COL_WIDTH } from '@/lib/studio-layout';
import {
  glassName,
  glassLabel,
  type StudioTheme,
} from '@/lib/studio-glass-theme';
import {
  NB_ACID,
  NB_BLUE,
  NB_BORDER,
  NB_BORDER_THIN,
  NB_FONT,
  NB_INK,
  NB_MONO,
  NB_ORANGE,
  NB_WHITE,
  nbShadowSmall,
  nbShadowTiny,
} from '@/lib/studio-neobrutal-theme';

interface Props {
  data: PostgamePayload | null;
  state: PostgameState;
  theme?: StudioTheme;
}

type Side = 'blue' | 'orange';

type PlayerFormula = (p: PostgamePlayer) => number | null | undefined;
type TeamFormula = (data: PostgamePayload, side: Side) => number | null | undefined;

interface RowDef {
  label: string;
  format: PostgameRowFormat;
  player: PlayerFormula | null; // null → '—' for all players (kickoff goals)
  team: TeamFormula;
}

const sumPlayers = (
  data: PostgamePayload,
  side: Side,
  pick: (p: PostgamePlayer) => number | null | undefined,
): number => {
  return data.pairs.reduce((acc, pair) => {
    const v = pick(pair[side]);
    return acc + (v ?? 0);
  }, 0);
};

const ROWS: RowDef[] = [
  {
    label: 'PUNKTY',
    format: 'number',
    player: (p) => p.score,
    team: (d, s) => sumPlayers(d, s, (p) => p.score),
  },
  {
    label: 'GOLE',
    format: 'number',
    player: (p) => p.goals,
    team: (d, s) => sumPlayers(d, s, (p) => p.goals),
  },
  {
    label: 'KICKOFF GOALS',
    format: 'number',
    player: null,
    team: (d, s) => d.team[s].kickoff_goals_10s,
  },
  {
    label: 'ASYSTY',
    format: 'number',
    player: (p) => p.assists,
    team: (d, s) => sumPlayers(d, s, (p) => p.assists),
  },
  {
    label: 'STRZAŁY',
    format: 'number',
    player: (p) => p.shots,
    team: (d, s) => sumPlayers(d, s, (p) => p.shots),
  },
  {
    label: 'OBRONY',
    format: 'number',
    player: (p) => p.saves,
    team: (d, s) => d.team[s].saves,
  },
  {
    label: 'DEMOS',
    format: 'number',
    player: (p) => p.demos,
    team: (d, s) => d.team[s].demos,
  },
  {
    label: 'CZAS NA SUPERSONIC',
    format: 'seconds',
    player: (p) => p.supersonic_seconds,
    team: (d, s) => sumPlayers(d, s, (p) => p.supersonic_seconds),
  },
  {
    label: 'ŚREDNI BOOST',
    format: 'float',
    player: (p) => p.avg_boost,
    team: (d, s) => d.team[s].avg_boost,
  },
  {
    label: 'CZAS NA 100 BOOSTA',
    format: 'seconds',
    player: (p) => p.time_at_100_seconds,
    team: (d, s) => sumPlayers(d, s, (p) => p.time_at_100_seconds),
  },
];

function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-center p-8">
      <PostgameGlassPanel className="px-12 py-8">
        <div
          className="font-esports text-xl uppercase tracking-[0.2em] text-zinc-200"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {children}
        </div>
      </PostgameGlassPanel>
    </div>
  );
}

function PlayerNamesRow({
  players,
  side,
  small,
}: {
  players: PostgamePlayer[];
  side: Side;
  small: boolean;
}) {
  const color = side === 'blue' ? BLUE : ORANGE;
  return (
    <div
      className="grid font-esports uppercase"
      style={{
        gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`,
        borderBottom: `2px solid ${color}`,
        opacity: 1,
      paddingBottom: 4,
      marginBottom: 4,
      }}
    >
      {players.map((p, i) => (
        <div
          key={`${p.player_name}-${i}`}
          className={`text-center font-bold tracking-wider ${small ? 'text-xs' : 'text-sm'}`}
          style={{ color, textShadow: TEXT_SHADOW, whiteSpace: 'nowrap', overflow: 'visible' }}
        >
          {p.player_name}
        </div>
      ))}
    </div>
  );
}

function PlayerValuesRow({
  players,
  row,
  small,
}: {
  players: PostgamePlayer[];
  row: RowDef;
  small: boolean;
}) {
  return (
    <div
      className="grid items-center font-esports"
      style={{
        gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`,
      }}
    >
      {players.map((p, i) => {
        const v = row.player ? row.player(p) : null;
        const text = row.player ? formatValue(v, row.format) : '—';
        return (
          <div
            key={`${p.player_name}-${row.label}-${i}`}
            className={`text-center font-bold tabular-nums text-white ${small ? 'text-sm' : 'text-base'}`}
            style={{ textShadow: TEXT_SHADOW, lineHeight: 1.2 }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}

export function PostgameSummary({ data, state, theme = 'standard' }: Props) {
  if (state.error) {
    return <StatusMessage>Relay niedostępny (127.0.0.1:49300)</StatusMessage>;
  }
  if (!data) {
    return <StatusMessage>Brak danych — zagraj mecz z relay</StatusMessage>;
  }

  const pairsSorted = [...data.pairs].sort((a, b) => a.rank - b.rank);
  const bluePlayers = pairsSorted.map((p) => p.blue);
  const orangePlayers = pairsSorted.map((p) => p.orange);
  const small = pairsSorted.length >= 3;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `minmax(0, 1fr) ${POSTGAME_CENTER_COL_WIDTH}px minmax(0, 1fr)`,
    columnGap: 16,
    rowGap: 4,
    alignItems: 'center',
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex w-full justify-center">
        <PostgameScoreboardHeader
          teamNames={data.team_names}
          blueScore={data.blue_score}
          orangeScore={data.orange_score}
          theme={theme}
        />
      </div>

      {theme === 'sharp-glass' ? (
        <GlassGridView data={data} bluePlayers={bluePlayers} orangePlayers={orangePlayers} />
      ) : theme === 'neobrutal' ? (
        <NbGridView data={data} bluePlayers={bluePlayers} orangePlayers={orangePlayers} />
      ) : (
        <PostgameGlassPanel
          className="w-full"
          style={{ padding: '16px 20px', marginTop: 8 }}
          theme={theme}
        >
          <div style={gridStyle}>
            {/* Header row — player nicks */}
            <PlayerNamesRow players={bluePlayers} side="blue" small={small} />
            <div />
            <PlayerNamesRow players={orangePlayers} side="orange" small={small} />

            {ROWS.map((row) => (
              <RowFragment
                key={row.label}
                row={row}
                data={data}
                bluePlayers={bluePlayers}
                orangePlayers={orangePlayers}
                small={small}
              />
            ))}
          </div>
        </PostgameGlassPanel>
      )}
    </div>
  );
}

function RowFragment({
  row,
  data,
  bluePlayers,
  orangePlayers,
  small,
}: {
  row: RowDef;
  data: PostgamePayload;
  bluePlayers: PostgamePlayer[];
  orangePlayers: PostgamePlayer[];
  small: boolean;
}) {
  return (
    <>
      <PlayerValuesRow players={bluePlayers} row={row} small={small} />
      <div
        style={{
          width: POSTGAME_CENTER_COL_WIDTH,
          maxWidth: POSTGAME_CENTER_COL_WIDTH,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <PostgameTeamBarRow
          label={row.label}
          blueValue={row.team(data, 'blue')}
          orangeValue={row.team(data, 'orange')}
          format={row.format}
        />
      </div>
      <PlayerValuesRow players={orangePlayers} row={row} small={small} />
    </>
  );
}

const BLUE_TEAM_COLOR = '#00B2FF';
const ORANGE_TEAM_COLOR = '#FF8C23';
const MVP_HIGHLIGHT = true;

function computeMvp(
  bluePlayers: PostgamePlayer[],
  orangePlayers: PostgamePlayer[],
): { player: PostgamePlayer; side: Side } | null {
  if (!MVP_HIGHLIGHT) return null;
  const all: { player: PostgamePlayer; side: Side }[] = [
    ...bluePlayers.map((p) => ({ player: p, side: 'blue' as Side })),
    ...orangePlayers.map((p) => ({ player: p, side: 'orange' as Side })),
  ];
  if (all.length === 0) return null;
  const max = Math.max(...all.map((e) => e.player.score ?? 0));
  const top = all.filter((e) => (e.player.score ?? 0) === max);
  if (top.length !== 1) return null;
  return top[0];
}

function GlassGridView({
  data,
  bluePlayers,
  orangePlayers,
}: {
  data: PostgamePayload;
  bluePlayers: PostgamePlayer[];
  orangePlayers: PostgamePlayer[];
}) {
  const N = Math.max(bluePlayers.length, orangePlayers.length, 1);
  const mvp = computeMvp(bluePlayers, orangePlayers);
  const mvpColor = mvp ? (mvp.side === 'blue' ? BLUE_TEAM_COLOR : ORANGE_TEAM_COLOR) : undefined;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${N}, minmax(0, 1fr)) 120px repeat(${N}, minmax(0, 1fr))`,
    columnGap: 8,
    rowGap: 0,
    alignItems: 'center',
  };

  const renderNameCell = (p: PostgamePlayer, side: Side) => {
    const isMvp = !!mvp && mvp.player === p;
    return (
      <div
        key={`name-${side}-${p.player_name}`}
        style={{ position: 'relative', textAlign: 'center', minWidth: 0 }}
      >
        {isMvp && (
          <Star
            size={12}
            fill={mvpColor}
            color={mvpColor}
            strokeWidth={1}
            style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        )}
        <span
          style={{
            ...glassName,
            fontSize: 14,
            color: '#fff',
            display: 'block',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.player_name}
        </span>
      </div>
    );
  };

  const renderValueCell = (p: PostgamePlayer, side: Side, row: RowDef, key: string) => {
    const isMvp = !!mvp && mvp.player === p;
    const color = isMvp ? (side === 'blue' ? BLUE_TEAM_COLOR : ORANGE_TEAM_COLOR) : '#fff';
    const v = row.player ? row.player(p) : null;
    const text = row.player ? formatValue(v, row.format) : '—';
    return (
      <div
        key={key}
        className="tabular-nums"
        style={{
          ...glassName,
          fontSize: 16,
          color,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <PostgameGlassPanel
      className="w-full"
      style={{ padding: '14px 18px', marginTop: 8 }}
      theme="sharp-glass"
    >
      <div style={gridStyle}>
        {/* Header row: nicks */}
        {bluePlayers.map((p) => renderNameCell(p, 'blue'))}
        <div />
        {orangePlayers.map((p) => renderNameCell(p, 'orange'))}

        {/* Team-color underline row */}
        <div
          style={{
            gridColumn: `1 / span ${N}`,
            height: 1.5,
            background: BLUE_TEAM_COLOR,
            marginTop: 4,
            marginBottom: 6,
          }}
        />
        <div />
        <div
          style={{
            gridColumn: `${N + 2} / span ${N}`,
            height: 1.5,
            background: ORANGE_TEAM_COLOR,
            marginTop: 4,
            marginBottom: 6,
          }}
        />

        {/* Stat rows */}
        {ROWS.map((row) => (
          <GlassStatRow
            key={row.label}
            row={row}
            data={data}
            bluePlayers={bluePlayers}
            orangePlayers={orangePlayers}
            renderValueCell={renderValueCell}
          />
        ))}
      </div>
    </PostgameGlassPanel>
  );
}

function GlassStatRow({
  row,
  data,
  bluePlayers,
  orangePlayers,
  renderValueCell,
}: {
  row: RowDef;
  data: PostgamePayload;
  bluePlayers: PostgamePlayer[];
  orangePlayers: PostgamePlayer[];
  renderValueCell: (p: PostgamePlayer, side: Side, row: RowDef, key: string) => ReactNode;
}) {
  return (
    <>
      {bluePlayers.map((p, i) =>
        renderValueCell(p, 'blue', row, `${row.label}-b-${i}`),
      )}
      <div
        style={{
          height: 34,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <span
          style={{
            ...glassLabel,
            fontSize: 10.5,
            letterSpacing: '.22em',
            textShadow: '0 1px 8px rgba(0,0,0,.6)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {row.label}
        </span>
        <PostgameMiniBarGlass
          blueValue={row.team(data, 'blue')}
          orangeValue={row.team(data, 'orange')}
        />
      </div>
      {orangePlayers.map((p, i) =>
        renderValueCell(p, 'orange', row, `${row.label}-o-${i}`),
      )}
    </>
  );
}

export default PostgameSummary;