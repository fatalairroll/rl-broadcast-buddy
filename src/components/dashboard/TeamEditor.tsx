import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Minus, Plus, Palette, Upload } from 'lucide-react';
import type { BroadcastSession, SeriesType } from '@/types/broadcast';

interface TeamEditorProps {
  session: BroadcastSession | null;
  side: 'a' | 'b';
  onUpdate: (updates: Partial<BroadcastSession>) => void;
  onIncrementScore: () => void;
  onDecrementScore: () => void;
}

const colorPresets = [
  '#3B82F6', '#2563EB', '#1D4ED8', // Blues
  '#F97316', '#EA580C', '#C2410C', // Oranges
  '#10B981', '#059669', '#047857', // Greens
  '#EF4444', '#DC2626', '#B91C1C', // Reds
  '#8B5CF6', '#7C3AED', '#6D28D9', // Purples
  '#F59E0B', '#D97706', '#B45309', // Yellows
  '#EC4899', '#DB2777', '#BE185D', // Pinks
  '#06B6D4', '#0891B2', '#0E7490', // Cyans
];

export function TeamEditor({
  session,
  side,
  onUpdate,
  onIncrementScore,
  onDecrementScore,
}: TeamEditorProps) {
  const prefix = side === 'a' ? 'team_a' : 'team_b';
  const teamName = side === 'a' ? session?.team_a_name : session?.team_b_name;
  const teamColor = side === 'a' ? session?.team_a_color : session?.team_b_color;
  const teamLogo = side === 'a' ? session?.team_a_logo : session?.team_b_logo;
  const seriesScore = side === 'a' ? session?.team_a_series_score : session?.team_b_series_score;
  const defaultColor = side === 'a' ? '#3B82F6' : '#F97316';

  const handleNameChange = (value: string) => {
    onUpdate({ [`${prefix}_name`]: value });
  };

  const handleColorChange = (color: string) => {
    onUpdate({ [`${prefix}_color`]: color });
  };

  const handleLogoChange = (url: string) => {
    onUpdate({ [`${prefix}_logo`]: url });
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: teamColor || defaultColor }}
          />
          Drużyna {side.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-name`}>Nazwa drużyny</Label>
          <Input
            id={`${prefix}-name`}
            value={teamName || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={`Drużyna ${side.toUpperCase()}`}
          />
        </div>

        {/* Team Color */}
        <div className="space-y-2">
          <Label>Kolor drużyny</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: teamColor || defaultColor }}
                />
                <span className="font-mono text-sm">{teamColor || defaultColor}</span>
                <Palette className="ml-auto h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: teamColor === color ? 'white' : 'transparent',
                      }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={teamColor || defaultColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={teamColor || defaultColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Team Logo URL */}
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-logo`}>URL logotypu</Label>
          <div className="flex gap-2">
            <Input
              id={`${prefix}-logo`}
              value={teamLogo || ''}
              onChange={(e) => handleLogoChange(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {teamLogo && (
              <div className="w-10 h-10 rounded border bg-card flex items-center justify-center overflow-hidden">
                <img
                  src={teamLogo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Series Score */}
        <div className="space-y-2">
          <Label>Wynik serii</Label>
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onDecrementScore}
              disabled={seriesScore === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-4xl font-bold tabular-nums">{seriesScore || 0}</span>
            <Button variant="outline" size="icon" onClick={onIncrementScore}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
