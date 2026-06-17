import type { CSSProperties } from 'react';
import type { PlayerLive } from '@/types/livestats';
import {
  NB_FONT,
  NB_MONO,
  NB_BLUE,
  NB_ORANGE,
  NB_ACID,
  NB_INK,
  NB_PAPER,
  NB_BORDER,
  NB_BORDER_THIN,
  nbShadowSmall,
} from '@/lib/neobrutal-theme';

interface Props {
  players: PlayerLive[];
  side: 'blue' | 'orange';
}

const ROW_W = 260;
const ROW_H = 36;

function PlayerRow({ player, side }: { player: PlayerLive; side: 'blue' | 'orange' }) {
  const boost = Math.max(0, Math.min(100, Math.round(player.boost ?? 0)));
  const critical = boost < 10;
  const supersonic = boost === 100;
  const teamColor = side === 'blue' ? NB_BLUE : NB_ORANGE;
  const fillColor = critical ? NB_ORANGE : supersonic ? NB_ACID : teamColor;
  const dimmed = player.is_demolished;

  const fillStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    [side === 'blue' ? 'left' : 'right']: 0,
    width: `${boost}%`,
    background: fillColor,
    borderRight: side === 'blue' && boost > 0 && boost < 100 ? NB_BORDER_THIN : undefined,
    borderLeft: side === 'orange' && boost > 0 && boost < 100 ? NB_BORDER_THIN : undefined,
    zIndex: 1,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: ROW_W,
        height: ROW_H,
        background: NB_PAPER,
        border: NB_BORDER,
        boxShadow: nbShadowSmall,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        flexDirection: side === 'blue' ? 'row' : 'row-reverse',
        padding: '0 12px',
      }}
    >
      <div style={fillStyle} />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          color: NB_INK,
          opacity: dimmed ? 0.4 : 1,
          fontFamily: NB_FONT,
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '.02em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: side === 'blue' ? 'left' : 'right',
          mixBlendMode: 'difference',
          color2: undefined as never,
        } as CSSProperties}
      >
        {player.player_name}
      </div>
      {critical && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontFamily: NB_MONO,
            fontWeight: 700,
            fontSize: 9,
            color: NB_INK,
            background: NB_WHITE_INK_BG,
            padding: '1px 4px',
            border: '1px solid #111',
            marginLeft: side === 'blue' ? 6 : 0,
            marginRight: side === 'orange' ? 6 : 0,
          }}
        >
          LOW
        </div>
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: 18,
          color: NB_INK,
          minWidth: 36,
          textAlign: side === 'blue' ? 'right' : 'left',
          marginLeft: side === 'blue' ? 6 : 0,
          marginRight: side === 'orange' ? 6 : 0,
        }}
      >
        {boost}
      </div>
    </div>
  );
}

// Tiny white pill background used for LOW etykieta.
const NB_WHITE_INK_BG = '#FFFFFF';

export function NbBoostStack({ players, side }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.map((p) => (
        <PlayerRow key={p.player_name} player={p} side={side} />
      ))}
    </div>
  );
}