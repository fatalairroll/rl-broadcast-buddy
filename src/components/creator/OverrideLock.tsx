import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  active: boolean;
  reason?: string;
  children: ReactNode;
}

/**
 * Wraps an editor field. When `active`, visually marks the field as
 * locked (overridden by an external data source) and disables interaction.
 */
export function OverrideLock({ active, reason, children }: Props) {
  if (!active) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <div className="pointer-events-none opacity-50">{children}</div>
            <div className="absolute right-1 top-1 flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/40">
              <Lock className="h-3 w-3" />
              <span>DB</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px] text-xs">
          {reason ?? 'Pole nadpisywane przez bazę danych'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}