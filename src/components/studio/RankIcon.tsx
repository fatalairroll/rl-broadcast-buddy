import { cn } from '@/lib/utils';

const RANK_COLORS: Record<string, string> = {
  'Unranked': 'bg-gray-600 text-gray-200',
  'Bronze': 'bg-amber-800 text-amber-100',
  'Silver': 'bg-slate-400 text-slate-900',
  'Gold': 'bg-yellow-500 text-yellow-900',
  'Platinum': 'bg-cyan-500 text-cyan-950',
  'Diamond': 'bg-blue-500 text-blue-100',
  'Champion': 'bg-purple-500 text-purple-100',
  'Grand Champion': 'bg-red-500 text-red-100',
  'Supersonic Legend': 'bg-gradient-to-r from-pink-500 to-yellow-400 text-white',
};

function getRankBase(rank: string): string {
  for (const key of Object.keys(RANK_COLORS)) {
    if (rank.startsWith(key)) return key;
  }
  return 'Unranked';
}

interface RankIconProps {
  rank: string | null;
  className?: string;
  size?: 'sm' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  lg: 'px-3 py-1.5 text-base',
};

export function RankIcon({ rank, className, size = 'sm' }: RankIconProps) {
  if (!rank) return null;
  const base = getRankBase(rank);
  const colors = RANK_COLORS[base] ?? RANK_COLORS['Unranked'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-bold uppercase tracking-wide whitespace-nowrap',
        SIZE_CLASSES[size],
        colors,
        className,
      )}
    >
      {rank}
    </span>
  );
}
