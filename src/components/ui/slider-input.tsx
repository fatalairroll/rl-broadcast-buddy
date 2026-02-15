import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface SliderInputProps {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function SliderInput({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = '',
}: SliderInputProps) {
  const safeValue = value ?? min;
  const [inputValue, setInputValue] = useState(safeValue.toString());

  useEffect(() => {
    setInputValue((value ?? min).toString());
  }, [value, min]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num));
      onValueChange(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue((value ?? min).toString());
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
        value={[value ?? min]}
        onValueChange={([v]) => {
          onValueChange(v);
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
