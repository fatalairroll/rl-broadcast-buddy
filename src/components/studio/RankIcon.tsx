import { cn } from '@/lib/utils';
import { getRankIcon } from '@/lib/rank-utils';

interface RankIconProps {
  rank: string | null;
  className?: string;
  size?: 'sm' | 'lg' | 'xl';
  showLabel?: boolean;
  glowColor?: string;
}

const SIZE_PX = {
  sm: 24,
  lg: 64,
  xl: 96,
};

export function RankIcon({ rank, className, size = 'sm', showLabel = false, glowColor }: RankIconProps) {
  if (!rank) return null;

  const iconSrc = getRankIcon(rank);
  const px = SIZE_PX[size];

  if (!iconSrc) {
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
        className={cn(
          'object-contain',
          size === 'xl' && 'animate-pulse-glow drop-shadow-lg',
          size === 'lg' && 'drop-shadow-lg',
        )}
        style={size === 'xl' && glowColor ? { color: glowColor } : undefined}
        draggable={false}
      />
      {showLabel && (size === 'lg' || size === 'xl') && (
        <span
          className={cn(
            'font-esports font-bold uppercase tracking-wider whitespace-nowrap',
            size === 'xl' ? 'text-xs text-white/90' : 'text-[10px] text-white/80',
          )}
        >
          {rank}
        </span>
      )}
    </div>
  );
}
