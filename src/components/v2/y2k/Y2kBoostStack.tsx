import type { CSSProperties } from 'react';
import type { PlayerLive } from '@/types/livestats';
import {
  Y2K_FONT,
  chromeBlue,
  chromeOrange,
  y2kBorder,
  y2kCoreBg,
  y2kGlowSoft,
  y2kNameShadow,
  y2kScanlines,
  y2kScoreShadow,
} from '@/lib/y2k-theme';

interface Props {
  players: PlayerLive[];
  side: 'blue' | 'orange';
}

const ROW_W = 230;
const ROW_H = 32;
const SCORE_W = 44;
const NAME_W = ROW_W - SCORE_W;

function PlayerRow({ player, side }: { player: PlayerLive; side: 'blue' | 'orange' }) {
  const boost = Math.max(0, Math.min(100, player.boost ?? 0));
  const bg = side === 'blue' ? chromeBlue : chromeOrange;
  const dimmed = player.is_demolished;

  const nameNode = (
    <div
      style={{
        position: 'relative',
        width: NAME_W,
        height: ROW_H,
        background: bg,
        overflow: 'hidden',
        border: y2kBorder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: side === 'blue' ? 'flex-start' : 'flex-end',
        padding: side === 'blue' ? '0 8px 0 12px' : '0 12px 0 8px',
        boxShadow: y2kGlowSoft,
      }}
    >
      {/* Boost fill mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [side === 'blue' ? 'left' : 'right']: 0,
          width: `${100 - boost}%`,
          background: 'rgba(0,0,0,.45)',
          zIndex: 1,
        }}
      />
      <div style={y2kScanlines} />
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          color: dimmed ? 'rgba(255,255,255,.4)' : '#fff',
          fontFamily: Y2K_FONT,
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '.02em',
          textShadow: y2kNameShadow,
          maxWidth: NAME_W - 28,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {player.player_name}
      </div>
    </div>
  );

  const scoreStyle: CSSProperties = {
    position: 'relative',
    width: SCORE_W,
    height: ROW_H,
    background: y2kCoreBg,
    border: y2kBorder,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const scoreNode = (
    <div style={scoreStyle}>
      <div style={y2kScanlines} />
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          color: '#fff',
          fontFamily: Y2K_FONT,
          fontWeight: 900,
          fontSize: 16,
          textShadow: y2kScoreShadow,
        }}
      >
        {Math.round(boost)}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: ROW_W, height: ROW_H }}>
      {side === 'blue' ? (
        <>{nameNode}{scoreNode}</>
      ) : (
        <>{scoreNode}{nameNode}</>
      )}
    </div>
  );
}

export function Y2kBoostStack({ players, side }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {players.map((p) => (
        <PlayerRow key={p.player_name} player={p} side={side} />
      ))}
    </div>
  );
}