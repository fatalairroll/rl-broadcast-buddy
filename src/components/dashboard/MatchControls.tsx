import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Send, Palette, ArrowLeftRight } from 'lucide-react';
import { RelayStatus } from './RelayStatus';
import type { BroadcastSession, SeriesType, OverlayPreset } from '@/types/broadcast';

interface MatchControlsProps {
  session: BroadcastSession | null;
  presets: OverlayPreset[];
  onUpdate: (updates: Partial<BroadcastSession>) => void;
  onResetGameScore: () => void;
  onBroadcast: () => void;
}

const seriesOptions: { value: SeriesType; label: string }[] = [
  { value: 'bo1', label: 'BO1 (Best of 1)' },
  { value: 'bo3', label: 'BO3 (Best of 3)' },
  { value: 'bo5', label: 'BO5 (Best of 5)' },
  { value: 'bo7', label: 'BO7 (Best of 7)' },
];

export function MatchControls({
  session,
  presets,
  onUpdate,
  onResetGameScore,
  onBroadcast,
}: MatchControlsProps) {
  const handleSwapTeams = () => {
    if (!session) return;
    onUpdate({
      team_a_name: session.team_b_name,
      team_b_name: session.team_a_name,
      team_a_color: session.team_b_color,
      team_b_color: session.team_a_color,
      team_a_logo: session.team_b_logo,
      team_b_logo: session.team_a_logo,
      team_a_id: session.team_b_id,
      team_b_id: session.team_a_id,
      team_a_series_score: session.team_b_series_score,
      team_b_series_score: session.team_a_series_score,
      team_a_game_score: session.team_b_game_score,
      team_b_game_score: session.team_a_game_score,
    });
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Kontrola meczu</CardTitle>
          <RelayStatus />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Name */}
        <div className="space-y-2">
          <Label htmlFor="match-name">Nazwa meczu / rundy</Label>
          <Input
            id="match-name"
            value={session?.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="np. Finał - Rocket League Championship"
          />
        </div>

        {/* Series Type */}
        <div className="space-y-2">
          <Label>Format serii</Label>
          <Select
            value={session?.series_type || 'bo3'}
            onValueChange={(value: SeriesType) => onUpdate({ series_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seriesOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overlay Preset Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preset overlay
          </Label>
          <Select
            value={session?.overlay_preset_id || ''}
            onValueChange={(value: string) => onUpdate({ overlay_preset_id: value || null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz preset..." />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {presets.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  Brak presetów - utwórz w Kreatorze
                </SelectItem>
              ) : (
                presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                    {preset.is_default && ' (domyślny)'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Current Game Score Display */}
        <div className="space-y-2">
          <Label>Aktualny wynik gry</Label>
          <div className="flex items-center justify-center gap-4 py-3 bg-secondary/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {session?.team_a_name || 'Team A'}
              </p>
              <span className="text-3xl font-bold">{session?.team_a_game_score || 0}</span>
            </div>
            <span className="text-2xl text-muted-foreground">:</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {session?.team_b_name || 'Team B'}
              </p>
              <span className="text-3xl font-bold">{session?.team_b_game_score || 0}</span>
            </div>
          </div>
        </div>

        {/* Series Score Display */}
        <div className="space-y-2">
          <Label>Wynik serii</Label>
          <div className="flex items-center justify-center gap-4 py-2 bg-primary/10 rounded-lg">
            <span className="text-2xl font-bold text-primary">
              {session?.team_a_series_score || 0}
            </span>
            <span className="text-lg text-muted-foreground">-</span>
            <span className="text-2xl font-bold text-primary">
              {session?.team_b_series_score || 0}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSwapTeams}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Przerzuć
          </Button>
          <Button variant="outline" className="flex-1" onClick={onResetGameScore}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset gry
          </Button>
          <Button className="flex-1" onClick={onBroadcast}>
            <Send className="mr-2 h-4 w-4" />
            Aktualizuj
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
