import { cn } from '@/lib/utils';
import { getRankIcon } from '@/lib/rank-utils';

interface RankIconProps {
  rank: string | null;
  className?: string;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

const SIZE_PX = {
  sm: 24,
  lg: 64,
};

export function RankIcon({ rank, className, size = 'sm', showLabel = false }: RankIconProps) {
  if (!rank) return null;

  const iconSrc = getRankIcon(rank);
  const px = SIZE_PX[size];

  if (!iconSrc) {
    // Fallback text badge
    return (
      <span
        className={cn(
          'inline-flex items-center rounded font-bold uppercase tracking-wide whitespace-nowrap bg-muted text-muted-foreground',
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1.5 text-base',
          className,
        )}
      >
        {rank}
      </span>
    );
  }

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <img
        src={iconSrc}
        alt={rank}
        width={px}
        height={px}
        className="object-contain drop-shadow-lg"
        draggable={false}
      />
      {showLabel && size === 'lg' && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 whitespace-nowrap">
          {rank}
        </span>
      )}
    </div>
  );
}
