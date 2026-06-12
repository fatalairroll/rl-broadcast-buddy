import type { CSSProperties } from 'react';
import type { PlayerLive } from '@/types/livestats';
import {
  chamferLeft,
  chamferRight,
  glassBarBlue,
  glassBarOrange,
  glassBoostFillBlue,
  glassBoostFillCritical,
  glassBoostFillOrange,
  glassContentLayer,
  glassName,
  glassScoreBox,
  glassSpecularSweep,
} from '@/lib/studio-glass-theme';

interface Props {
  players: PlayerLive[];
  side: 'blue' | 'orange';
}

const ROW_H = 30;
const ROW_W = 218;
const SCORE_W = 38;
const NAME_W = ROW_W - SCORE_W;

function boostDigitStyle(boost: number): CSSProperties {
  if (boost >= 100) {
    return { color: '#FFD27A', textShadow: '0 0 12px rgba(255,200,90,.6)' };
  }
  if (boost < 10) {
    return { color: '#FF7A5C', textShadow: '0 0 10px rgba(255,90,60,.5)' };
  }
  return { color: '#fff' };
}

function PlayerRow({ player, side }: { player: PlayerLive; side: 'blue' | 'orange' }) {
  const boost = Math.max(0, Math.min(100, player.boost ?? 0));
  const isCritical = boost < 10;
  const baseFill = side === 'blue' ? glassBoostFillBlue : glassBoostFillOrange;
  const fill = isCritical ? glassBoostFillCritical : baseFill;

  const barStyle: CSSProperties = side === 'blue'
    ? { ...glassBarBlue, ...chamferLeft(10) }
    : { ...glassBarOrange, ...chamferRight(10) };

  const nameNode = (
    <div
      style={{
        ...barStyle,
        width: NAME_W,
        height: ROW_H,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: side === 'blue' ? 'flex-start' : 'flex-end',
        padding: side === 'blue' ? '0 10px 0 18px' : '0 18px 0 10px',
      }}
    >
      {/* fill */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [side === 'blue' ? 'left' : 'right']: 0,
          width: `${boost}%`,
          background: fill,
          transition: 'width 120ms linear',
          zIndex: 0,
        }}
      />
      <div style={glassSpecularSweep} />
      <div
        style={{
          ...glassContentLayer,
          ...glassName,
          fontSize: 13,
          color: player.is_demolished ? 'rgba(255,255,255,.4)' : '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: NAME_W - 28,
        }}
      >
        {player.player_name}
      </div>
    </div>
  );

  const scoreNode = (
    <div
      style={{
        ...glassScoreBox,
        width: SCORE_W,
        height: ROW_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={glassSpecularSweep} />
      <div
        style={{
          ...glassContentLayer,
          ...glassName,
          fontSize: 15,
          ...boostDigitStyle(boost),
        }}
      >
        {Math.round(boost)}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: ROW_W, height: ROW_H }}>
      {side === 'blue' ? (
        <>
          {nameNode}
          {scoreNode}
        </>
      ) : (
        <>
          {scoreNode}
          {nameNode}
        </>
      )}
    </div>
  );
}

export function GlassBoostPanel({ players, side }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {players.map((p) => (
        <PlayerRow key={p.player_name} player={p} side={side} />
      ))}
    </div>
  );
}