import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { EditableElement, OverlayConfig } from '@/types/broadcast';
import { ELEMENT_LABELS } from '@/types/broadcast';
import {
  Layout,
  Hash,
  Clock,
  Trophy,
  Users,
  BarChart3,
  Circle,
  Activity,
} from 'lucide-react';

const ELEMENT_ICONS: Record<EditableElement, React.ReactNode> = {
  scoreboard: <Layout className="h-4 w-4" />,
  scoreDisplay: <Hash className="h-4 w-4" />,
  timerDisplay: <Clock className="h-4 w-4" />,
  seriesDisplay: <Trophy className="h-4 w-4" />,
  teamAName: <Users className="h-4 w-4" />,
  teamBName: <Users className="h-4 w-4" />,
  boostBars: <BarChart3 className="h-4 w-4" />,
  boostCircle: <Circle className="h-4 w-4" />,
  playerStats: <Activity className="h-4 w-4" />,
};

const ELEMENT_GROUPS = [
  {
    label: 'Górny pasek',
    elements: ['scoreboard', 'scoreDisplay', 'timerDisplay', 'seriesDisplay', 'teamAName', 'teamBName'] as EditableElement[],
  },
  {
    label: 'Boost graczy',
    elements: ['boostBars', 'boostCircle'] as EditableElement[],
  },
  {
    label: 'Statystyki',
    elements: ['playerStats'] as EditableElement[],
  },
];

interface ElementListProps {
  config: OverlayConfig;
  selectedElement: EditableElement | null;
  onSelectElement: (element: EditableElement) => void;
  onToggleVisibility: (element: EditableElement, visible: boolean) => void;
}

export function ElementList({
  config,
  selectedElement,
  onSelectElement,
  onToggleVisibility,
}: ElementListProps) {
  const getVisibility = (element: EditableElement): boolean => {
    const section = config[element];
    return 'visible' in section ? section.visible : true;
  };

  return (
    <div className="space-y-4">
      {ELEMENT_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.elements.map((element) => (
              <div
                key={element}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all',
                  selectedElement === element
                    ? 'bg-primary/20 ring-1 ring-primary'
                    : 'hover:bg-secondary/50'
                )}
                onClick={() => onSelectElement(element)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {ELEMENT_ICONS[element]}
                  </span>
                  <span className="text-sm font-medium">
                    {ELEMENT_LABELS[element]}
                  </span>
                </div>
                <Switch
                  checked={getVisibility(element)}
                  onCheckedChange={(v) => {
                    onToggleVisibility(element, v);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
