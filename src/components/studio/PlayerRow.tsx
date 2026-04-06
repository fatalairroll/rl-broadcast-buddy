import type { PlayerData } from '@/types/studio';
import { RankIcon } from './RankIcon';

interface PlayerRowProps {
  player: PlayerData;
  gameMode: string;
}

function getMmrForMode(player: PlayerData, mode: string): number | null {
  if (mode === '1v1') return player.mmr_1v1;
  if (mode === '2v2') return player.mmr_2v2;
  if (mode === '3v3') return player.mmr_3v3;
  return player.mmr_2v2;
}

function getRankForMode(player: PlayerData, mode: string): string | null {
  if (mode === '1v1') return player.rank_1v1;
  if (mode === '2v2') return player.rank_2v2;
  if (mode === '3v3') return player.rank_3v3;
  return player.rank_2v2;
}

export function PlayerRow({ player, gameMode }: PlayerRowProps) {
  const mmr = getMmrForMode(player, gameMode);
  const rank = getRankForMode(player, gameMode);

  return (
    <div className="flex items-center gap-2 py-1">
      {player.avatar && (
        <img
          src={player.avatar}
          alt={player.nick}
          className="h-6 w-6 rounded-full object-cover"
        />
      )}
      <span className="text-sm font-medium text-white flex-1 truncate">
        {player.nick_in_game ?? player.nick}
      </span>
      {mmr != null && (
        <span className="text-xs text-slate-400 font-mono">{mmr}</span>
      )}
      <RankIcon rank={rank} />
    </div>
  );
}
