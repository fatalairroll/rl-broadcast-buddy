import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  // Blues
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  // Oranges
  '#F97316', '#EA580C', '#C2410C', '#9A3412',
  // Greens
  '#22C55E', '#16A34A', '#15803D', '#166534',
  // Reds
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
  // Purples
  '#A855F7', '#9333EA', '#7C3AED', '#6D28D9',
  // Neutrals
  '#FFFFFF', '#F3F4F6', '#9CA3AF', '#6B7280',
  '#374151', '#1F2937', '#111827', '#000000',
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hue, setHue] = React.useState(217);
  
  React.useEffect(() => {
    if (value.startsWith('#')) {
      const hsl = hexToHsl(value);
      if (hsl) setHue(hsl.h);
    }
  }, []);

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const currentHsl = hexToHsl(value);
    if (currentHsl) {
      onChange(hslToHex(newHue, currentHsl.s, currentHsl.l));
    } else {
      onChange(hslToHex(newHue, 70, 50));
    }
  };

  const isValidColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) || 
           /^rgba?\(/.test(color) ||
           /^hsla?\(/.test(color);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 w-full h-10 px-3 rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
            type="button"
          >
            <div 
              className="w-6 h-6 rounded border border-border shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 text-left text-sm font-mono truncate">
              {value}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 bg-popover border-border" align="start">
          <div className="space-y-4">
            {/* Current color preview */}
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg border border-border shadow-inner"
                style={{ backgroundColor: value }}
              />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Wybrany kolor</Label>
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Hue slider */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Odcień</Label>
              <div 
                className="h-3 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
              >
                <Slider
                  value={[hue]}
                  onValueChange={([v]) => handleHueChange(v)}
                  max={360}
                  step={1}
                  className="[&_.bg-primary]:bg-transparent [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md"
                />
              </div>
            </div>

            {/* Preset colors */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Predefiniowane kolory</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded border transition-all hover:scale-110",
                      value.toLowerCase() === color.toLowerCase() 
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background" 
                        : "border-border/50 hover:border-border"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Quick alpha colors */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Przezroczystość</Label>
              <div className="flex gap-1.5">
                {['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)', 'transparent'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "flex-1 h-6 rounded border text-[8px] font-mono transition-all",
                      value === color 
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background" 
                        : "border-border/50 hover:border-border"
                    )}
                    style={{ 
                      backgroundColor: color,
                      backgroundImage: color === 'transparent' 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    }}
                    onClick={() => onChange(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { COLOR_PRESETS };
