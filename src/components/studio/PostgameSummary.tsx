import type { CSSProperties, ReactNode } from 'react';
import type { PostgamePayload, PostgamePlayer, PostgameState } from '@/types/postgame';
import {
  BLUE,
  ORANGE,
  PostgameGlassPanel,
  PostgameTeamBarRow,
  PostgameStatBarGlass,
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
import { PANEL_STYLE_GLASS } from './PostgameShared';

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
        <GlassStatsView data={data} bluePlayers={bluePlayers} orangePlayers={orangePlayers} />
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

function GlassStatsView({
  data,
  bluePlayers,
  orangePlayers,
}: {
  data: PostgamePayload;
  bluePlayers: PostgamePlayer[];
  orangePlayers: PostgamePlayer[];
}) {
  return (
    <div className="w-full" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Team stat bars */}
      <div style={{ width: '100%' }}>
        {ROWS.map((row) => (
          <PostgameStatBarGlass
            key={row.label}
            label={row.label}
            blueValue={row.team(data, 'blue')}
            orangeValue={row.team(data, 'orange')}
            format={row.format}
          />
        ))}
      </div>

      {/* Compact player panels */}
      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        <GlassPlayerPanel players={bluePlayers} side="blue" />
        <GlassPlayerPanel players={orangePlayers} side="orange" />
      </div>
    </div>
  );
}

function GlassPlayerPanel({ players, side }: { players: PostgamePlayer[]; side: Side }) {
  const accent = side === 'blue' ? '#00B2FF' : '#F95F02';
  const COLS = ['SCORE', 'GOLE', 'AS', 'OBR'];
  const pick = (p: PostgamePlayer): (number | null | undefined)[] => [
    p.score, p.goals, p.assists, p.saves,
  ];
  return (
    <div style={{ flex: 1, ...PANEL_STYLE_GLASS, padding: '8px 10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', height: 18, borderBottom: `1px solid ${accent}40`, marginBottom: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }} />
        {COLS.map((c) => (
          <div key={c} style={{ width: 40, textAlign: 'center' }}>
            <span style={{ ...glassLabel, fontSize: 9, color: accent }}>{c}</span>
          </div>
        ))}
      </div>
      {players.slice(0, 4).map((p, i) => {
        const vals = pick(p);
        return (
          <div
            key={`${p.player_name}-${i}`}
            style={{ display: 'flex', alignItems: 'center', height: 26 }}
          >
            <span
              style={{
                ...glassName,
                fontSize: 14,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {p.player_name}
            </span>
            {vals.map((v, idx) => (
              <div key={idx} style={{ width: 40, textAlign: 'center' }}>
                <span
                  className="tabular-nums"
                  style={{ ...glassLabel, fontSize: 13, color: '#fff', letterSpacing: '.04em' }}
                >
                  {v ?? '—'}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default PostgameSummary;