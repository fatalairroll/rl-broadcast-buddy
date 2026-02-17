import * as React from "react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ElementShape } from "@/types/broadcast";

interface ShapePickerProps {
  label: string;
  value: ElementShape;
  onChange: (value: ElementShape) => void;
}

const SHAPES: { value: ElementShape; label: string; icon: React.ReactNode }[] = [
  {
    value: 'sharp',
    label: 'Ostre',
    icon: <div className="w-5 h-3 bg-current" />,
  },
  {
    value: 'rounded',
    label: 'Zaokrąglone',
    icon: <div className="w-5 h-3 bg-current rounded-md" />,
  },
  {
    value: 'skewed',
    label: 'Skośne',
    icon: (
      <div 
        className="w-5 h-3 bg-current"
        style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
      />
    ),
  },
  {
    value: 'pill',
    label: 'Kapsułka',
    icon: <div className="w-5 h-3 bg-current rounded-full" />,
  },
  {
    value: 'hexagon',
    label: 'Sześciokąt',
    icon: (
      <div 
        className="w-5 h-3 bg-current"
        style={{ clipPath: 'polygon(10% 50%, 20% 0%, 80% 0%, 90% 50%, 80% 100%, 20% 100%)' }}
      />
    ),
  },
  {
    value: 'parallelogram',
    label: 'Równoległobok',
    icon: (
      <div 
        className="w-5 h-3 bg-current"
        style={{ clipPath: 'polygon(20% 0, 100% 0, 80% 100%, 0 100%)' }}
      />
    ),
  },
];

export function ShapePicker({ label, value, onChange }: ShapePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(v) => v && onChange(v as ElementShape)}
        className="flex flex-wrap justify-start gap-1"
      >
        {SHAPES.map((shape) => (
          <ToggleGroupItem 
            key={shape.value}
            value={shape.value}
            className="flex items-center gap-1.5 px-2 py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {shape.icon}
            <span className="text-xs">{shape.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

// Helper function to get CSS styles for a shape
export function getShapeStyle(shape: ElementShape, borderRadius: number = 8): React.CSSProperties {
  switch (shape) {
    case 'sharp':
      return { borderRadius: 0 };
    case 'rounded':
      return { borderRadius };
    case 'pill':
      return { borderRadius: 9999 };
    case 'skewed':
      return { 
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        borderRadius: 0,
      };
    case 'hexagon':
      return { 
        clipPath: 'polygon(5% 50%, 12% 0%, 88% 0%, 95% 50%, 88% 100%, 12% 100%)',
        borderRadius: 0,
      };
    case 'parallelogram':
      return { 
        clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
        borderRadius: 0,
      };
    default:
      return { borderRadius };
  }
}

// Helper for detached boxes - inner edge is straight, outer edge is shaped
export function getDetachedBoxShapeStyle(
  shape: ElementShape, 
  side: 'left' | 'right', 
  skewOffset: number = 10,
  borderRadius: number = 8,
  skewOffsetInner: number = 0
): React.CSSProperties {
  switch (shape) {
    case 'sharp':
      return { borderRadius: 0 };
    case 'rounded':
      return { borderRadius };
    case 'pill':
      return { borderRadius: 9999 };
    case 'skewed':
    case 'parallelogram':
      if (side === 'left') {
        // Left box: left=outer (skewOffset), right=inner (skewOffsetInner)
        return {
          clipPath: `polygon(${skewOffset}px 0, 100% 0, calc(100% - ${skewOffsetInner}px) 100%, 0 100%)`,
          borderRadius: 0,
        };
      } else {
        // Right box: right=outer (skewOffset), left=inner (skewOffsetInner)
        return {
          clipPath: `polygon(${skewOffsetInner}px 0, 100% 0, calc(100% - ${skewOffset}px) 100%, 0 100%)`,
          borderRadius: 0,
        };
      }
    case 'hexagon':
      if (side === 'left') {
        return {
          clipPath: `polygon(${skewOffset}px 0, calc(100% - ${skewOffsetInner}px) 0, 100% 50%, calc(100% - ${skewOffsetInner}px) 100%, 0 100%, ${skewOffset}px 50%)`,
          borderRadius: 0,
        };
      } else {
        return {
          clipPath: `polygon(${skewOffsetInner}px 0, calc(100% - ${skewOffset}px) 0, 100% 50%, calc(100% - ${skewOffset}px) 100%, 0 100%, ${skewOffsetInner}px 50%)`,
          borderRadius: 0,
        };
      }
    default:
      return { borderRadius };
  }
}
