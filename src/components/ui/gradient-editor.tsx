import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2 } from 'lucide-react';
import type { GradientConfig, GradientStop } from '@/types/broadcast';
import { getBackgroundStyle, createDefaultGradient } from '@/lib/gradient-utils';

interface GradientEditorProps {
  label: string;
  backgroundColor: string;
  gradient?: GradientConfig;
  onBackgroundColorChange: (color: string) => void;
  onGradientChange: (gradient: GradientConfig) => void;
}

export function GradientEditor({
  label,
  backgroundColor,
  gradient,
  onBackgroundColorChange,
  onGradientChange,
}: GradientEditorProps) {
  const currentGradient = gradient || createDefaultGradient(backgroundColor);
  const isGradientEnabled = currentGradient.enabled;

  const handleToggleGradient = (enabled: boolean) => {
    onGradientChange({
      ...currentGradient,
      enabled,
    });
  };

  const handleTypeChange = (type: 'linear' | 'radial') => {
    onGradientChange({
      ...currentGradient,
      type,
    });
  };

  const handleAngleChange = (angle: number) => {
    onGradientChange({
      ...currentGradient,
      angle,
    });
  };

  const handleStopColorChange = (index: number, color: string) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = { ...newStops[index], color };
    onGradientChange({
      ...currentGradient,
      stops: newStops,
    });
  };

  const handleStopPositionChange = (index: number, position: number) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = { ...newStops[index], position };
    onGradientChange({
      ...currentGradient,
      stops: newStops,
    });
  };

  const handleAddStop = () => {
    const stops = currentGradient.stops;
    // Find middle position
    let newPosition = 50;
    if (stops.length >= 2) {
      const sortedStops = [...stops].sort((a, b) => a.position - b.position);
      const lastStop = sortedStops[sortedStops.length - 1];
      const secondLastStop = sortedStops[sortedStops.length - 2];
      newPosition = Math.round((lastStop.position + secondLastStop.position) / 2);
    }

    onGradientChange({
      ...currentGradient,
      stops: [...stops, { color: '#8B5CF6', position: newPosition }],
    });
  };

  const handleRemoveStop = (index: number) => {
    if (currentGradient.stops.length <= 2) return;
    const newStops = currentGradient.stops.filter((_, i) => i !== index);
    onGradientChange({
      ...currentGradient,
      stops: newStops,
    });
  };

  const previewStyle = getBackgroundStyle(backgroundColor, currentGradient);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isGradientEnabled ? 'Gradient' : 'Kolor'}
          </span>
          <Switch
            checked={isGradientEnabled}
            onCheckedChange={handleToggleGradient}
          />
        </div>
      </div>

      {!isGradientEnabled ? (
        <ColorPicker
          label="Kolor tła"
          value={backgroundColor}
          onChange={onBackgroundColorChange}
        />
      ) : (
        <div className="space-y-4 p-3 bg-secondary/30 rounded-lg">
          {/* Gradient Type */}
          <div className="space-y-2">
            <Label className="text-xs">Typ gradientu</Label>
            <RadioGroup
              value={currentGradient.type}
              onValueChange={(v) => handleTypeChange(v as 'linear' | 'radial')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="linear" id="linear" />
                <Label htmlFor="linear" className="text-xs cursor-pointer">
                  Liniowy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="radial" id="radial" />
                <Label htmlFor="radial" className="text-xs cursor-pointer">
                  Radialny
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Angle (only for linear) */}
          {currentGradient.type === 'linear' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Kąt gradientu</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentGradient.angle}°
                </span>
              </div>
              <Slider
                value={[currentGradient.angle]}
                onValueChange={([v]) => handleAngleChange(v)}
                min={0}
                max={360}
                step={5}
                className="py-1"
              />
            </div>
          )}

          {/* Gradient Stops */}
          <div className="space-y-2">
            <Label className="text-xs">Stopy gradientu</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentGradient.stops.map((stop, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-background/50 rounded-md"
                >
                  <div className="flex-shrink-0">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => handleStopColorChange(index, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                    />
                  </div>
                  <div className="flex-1">
                    <Slider
                      value={[stop.position]}
                      onValueChange={([v]) => handleStopPositionChange(index, v)}
                      min={0}
                      max={100}
                      step={1}
                      className="py-1"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                    {stop.position}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveStop(index)}
                    disabled={currentGradient.stops.length <= 2}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStop}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Dodaj stop
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs">Podgląd</Label>
            <div
              className="h-8 rounded-md border border-border"
              style={previewStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
