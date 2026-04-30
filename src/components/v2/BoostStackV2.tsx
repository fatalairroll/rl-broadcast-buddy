import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import { BoostBarV2 } from './BoostBarV2';

interface Props {
  players: PlayerLive[];
  registryMap: Map<string, PlayerRegistry>;
  side: 'left' | 'right';
  activeName?: string | null;
}

export function BoostStackV2({ players, registryMap, side, activeName }: Props) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-3"
      style={{
        [side === 'left' ? 'left' : 'right']: 32,
      }}
    >
      {players.map((p) => (
        <BoostBarV2
          key={p.player_name}
          player={p}
          registry={registryMap.get(p.player_name)}
          side={side}
          isActive={activeName === p.player_name}
        />
      ))}
    </div>
  );
}