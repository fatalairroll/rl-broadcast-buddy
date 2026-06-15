import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftRight, Eraser, Minus, Plus, RotateCcw } from 'lucide-react';
import { useBroadcast } from '@/hooks/useBroadcast';
import type { SeriesType } from '@/types/broadcast';
import { MmrivalsMatchPicker } from './MmrivalsMatchPicker';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useSeriesAutoTracker } from '@/hooks/useSeriesAutoTracker';

const seriesOptions: { value: SeriesType; label: string }[] = [
  { value: 'bo1', label: 'BO1' },
  { value: 'bo3', label: 'BO3' },
  { value: 'bo5', label: 'BO5' },
  { value: 'bo7', label: 'BO7' },
];

export function BroadcastControlsPanel() {
  useSeriesAutoTracker();
  const {
    session,
    updateSession,
    incrementTeamASeriesScore,
    decrementTeamASeriesScore,
    incrementTeamBSeriesScore,
    decrementTeamBSeriesScore,
    resetSeriesScore,
    swapTeams,
    clearManualData,
  } = useBroadcast();
  const { toast } = useToast();

  // Local mirrors so typing doesn't lag behind realtime updates
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');

  useEffect(() => {
    setNameA(session?.team_a_name ?? '');
    setNameB(session?.team_b_name ?? '');
  }, [session?.team_a_name, session?.team_b_name]);

  if (!session) {
    return (
      <Card className="w-full max-w-[1920px]">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Brak aktywnej sesji transmisji. Utwórz sesję w Dashboardzie, aby zarządzać overlayem.
        </CardContent>
      </Card>
    );
  }

  const handleClear = async () => {
    if (!confirm('Wyczyścić ręcznie wprowadzone dane (nazwy drużyn, wynik serii, powiązanie z MMRivals)?')) return;
    await clearManualData();
    toast({ title: 'Wyczyszczono dane ręczne' });
  };

  return (
    <div className="w-full max-w-[1200px] grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sterowanie meczem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Drużyna niebieska</Label>
              <Input
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                onBlur={() => {
                  if (nameA !== (session.team_a_name ?? '')) updateSession({ team_a_name: nameA });
                }}
                placeholder="np. Caveman"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Drużyna pomarańczowa</Label>
              <Input
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                onBlur={() => {
                  if (nameB !== (session.team_b_name ?? '')) updateSession({ team_b_name: nameB });
                }}
                placeholder="np. Storm"
              />
            </div>
          </div>

          {/* Series score */}
          <div className="space-y-2">
            <Label className="text-xs">Wynik serii</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-secondary/40 rounded px-2 py-1">
                <Button size="icon" variant="ghost" onClick={decrementTeamASeriesScore}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold tabular-nums">{session.team_a_series_score ?? 0}</span>
                <Button size="icon" variant="ghost" onClick={incrementTeamASeriesScore}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between bg-secondary/40 rounded px-2 py-1">
                <Button size="icon" variant="ghost" onClick={decrementTeamBSeriesScore}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold tabular-nums">{session.team_b_series_score ?? 0}</span>
                <Button size="icon" variant="ghost" onClick={incrementTeamBSeriesScore}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={resetSeriesScore}>
              <RotateCcw className="mr-2 h-3 w-3" /> Reset serii (0:0)
            </Button>
            <div className="flex items-center justify-between rounded bg-secondary/40 px-2 py-1.5">
              <Label className="text-xs cursor-pointer" htmlFor="series-auto-toggle">
                Auto-seria (BO)
              </Label>
              <Switch
                id="series-auto-toggle"
                checked={session.series_auto_enabled !== false}
                onCheckedChange={(v) => updateSession({ series_auto_enabled: v })}
              />
            </div>
          </div>

          {/* Series format */}
          <div className="space-y-1">
            <Label className="text-xs">Format serii</Label>
            <Select
              value={session.series_type ?? 'bo3'}
              onValueChange={(v: SeriesType) => updateSession({ series_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seriesOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={swapTeams}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Zamień strony
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              <Eraser className="mr-2 h-4 w-4" />
              Wyczyść dane
            </Button>
          </div>
        </CardContent>
      </Card>

      <MmrivalsMatchPicker />
    </div>
  );
}