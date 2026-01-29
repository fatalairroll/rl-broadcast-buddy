import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';
import type { GlowConfig } from '@/types/broadcast';
import { createDefaultGlow, hexToRgba } from '@/lib/glow-utils';

interface GlowEditorProps {
  label: string;
  glow?: GlowConfig;
  onChange: (glow: GlowConfig) => void;
}

export function GlowEditor({ label, glow, onChange }: GlowEditorProps) {
  const current = glow || createDefaultGlow();

  const handleChange = (updates: Partial<GlowConfig>) => {
    onChange({ ...current, ...updates });
  };

  // Generate preview style
  const getPreviewStyle = (): React.CSSProperties => {
    if (!current.enabled) return {};
    const rgba = hexToRgba(current.color, current.intensity);
    return {
      boxShadow: `0 0 ${current.blur}px ${current.spread}px ${rgba}`,
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          checked={current.enabled}
          onCheckedChange={(v) => handleChange({ enabled: v })}
        />
      </div>
      
      {current.enabled && (
        <div className="space-y-4 p-3 bg-secondary/30 rounded-lg">
          <ColorPicker
            label="Kolor świecenia"
            value={current.color}
            onChange={(v) => handleChange({ color: v })}
          />
          
          <SliderWithInput
            label="Rozmycie"
            value={current.blur}
            onChange={(v) => handleChange({ blur: v })}
            min={0}
            max={50}
            unit="px"
          />
          
          <SliderWithInput
            label="Rozszerzenie"
            value={current.spread}
            onChange={(v) => handleChange({ spread: v })}
            min={0}
            max={20}
            unit="px"
          />
          
          <SliderWithInput
            label="Intensywność"
            value={current.intensity}
            onChange={(v) => handleChange({ intensity: v })}
            min={0}
            max={1}
            step={0.05}
          />
          
          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Podgląd</Label>
            <div 
              className="h-8 rounded-md bg-card border border-border/50 transition-all duration-200"
              style={getPreviewStyle()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

function SliderWithInput({ label, value, onChange, min, max, step = 1, unit = '' }: SliderWithInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num));
      onChange(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-16 h-6 text-xs text-right px-1"
            min={min}
            max={max}
            step={step}
          />
          {unit && <span className="text-xs text-muted-foreground w-6">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => {
          onChange(v);
          setInputValue(v.toString());
        }}
        min={min}
        max={max}
        step={step}
        className="py-1"
      />
    </div>
  );
}
