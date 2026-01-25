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
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Send, Wifi, WifiOff } from 'lucide-react';
import type { BroadcastSession, SeriesType } from '@/types/broadcast';

interface MatchControlsProps {
  session: BroadcastSession | null;
  isConnected: boolean;
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
  isConnected,
  onUpdate,
  onResetGameScore,
  onBroadcast,
}: MatchControlsProps) {
  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Kontrola meczu</CardTitle>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Połączono
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Brak połączenia
              </>
            )}
          </Badge>
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
          <Button variant="outline" className="flex-1" onClick={onResetGameScore}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset gry
          </Button>
          <Button className="flex-1" onClick={onBroadcast}>
            <Send className="mr-2 h-4 w-4" />
            Aktualizuj overlay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
