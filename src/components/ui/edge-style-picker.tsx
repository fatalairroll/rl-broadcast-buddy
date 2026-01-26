import * as React from "react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { EdgeStyle } from "@/types/broadcast";

interface EdgeStylePickerProps {
  label: string;
  value: EdgeStyle;
  onChange: (value: EdgeStyle) => void;
}

export function EdgeStylePicker({ label, value, onChange }: EdgeStylePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(v) => v && onChange(v as EdgeStyle)}
        className="justify-start"
      >
        <ToggleGroupItem 
          value="rounded" 
          className="flex items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <div className="w-5 h-3 bg-current rounded-md" />
          <span className="text-xs">Zaokrąglone</span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="skewed"
          className="flex items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <div 
            className="w-5 h-3 bg-current"
            style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
          />
          <span className="text-xs">Skośne</span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="sharp"
          className="flex items-center gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <div className="w-5 h-3 bg-current" />
          <span className="text-xs">Ostre</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
