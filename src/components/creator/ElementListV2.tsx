import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { V2_ELEMENT_LABELS, type V2EditableElement } from '@/types/overlayV2';

interface Props {
  selected: V2EditableElement;
  onSelect: (el: V2EditableElement) => void;
}

const ORDER: V2EditableElement[] = [
  'scoreboard',
  'scoreBlue',
  'scoreOrange',
  'timer',
  'boostBar',
  'playerCard',
  'general',
];

export function ElementListV2({ selected, onSelect }: Props) {
  return (
    <Card className="p-3 space-y-1">
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Elementy</h3>
      {ORDER.map((el) => (
        <button
          key={el}
          onClick={() => onSelect(el)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
            selected === el
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary text-foreground',
          )}
        >
          {V2_ELEMENT_LABELS[el]}
        </button>
      ))}
    </Card>
  );
}
