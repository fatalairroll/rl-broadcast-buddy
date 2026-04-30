import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import { BoostBarV2 } from './BoostBarV2';
import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';

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

  return (
    <div
      className="absolute flex flex-col"
      style={{
        top: `${c.verticalAlign}%`,
        transform: 'translateY(-50%)',
        gap: c.gap,
        [side === 'left' ? 'left' : 'right']: c.sideOffset,
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
