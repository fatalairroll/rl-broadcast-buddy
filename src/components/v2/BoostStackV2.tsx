import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import { BoostBarV2 } from './BoostBarV2';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import { positionToStyle } from '@/lib/position-utils';

interface Props {
  players: PlayerLive[];
  registryMap: Map<string, PlayerRegistry>;
  side: 'left' | 'right';
  activeName?: string | null;
  config?: OverlayV2Config;
}

export function BoostStackV2({ players, registryMap, side, activeName, config = defaultOverlayV2Config }: Props) {
  const c = config.boostBar;
  if (!c.visible) return null;

  const pos = side === 'left' ? c.positionLeft : c.positionRight;

  return (
    <div
      className="flex flex-col"
      style={{
        ...positionToStyle(pos),
        gap: c.gap,
      }}
    >
      {players.map((p) => (
        <BoostBarV2
          key={p.player_name}
          player={p}
          registry={registryMap.get(p.player_name)}
          side={side}
          isActive={activeName === p.player_name}
          config={config}
        />
      ))}
    </div>
  );
}
