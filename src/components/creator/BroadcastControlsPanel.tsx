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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeftRight, Eraser, Minus, Palette, Plus, RotateCcw } from 'lucide-react';
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

const colorPresets = [
  '#3B82F6', '#2563EB', '#1D4ED8',
  '#F97316', '#EA580C', '#C2410C',
  '#10B981', '#059669', '#047857',
  '#EF4444', '#DC2626', '#B91C1C',
  '#8B5CF6', '#7C3AED', '#6D28D9',
  '#F59E0B', '#D97706', '#B45309',
  '#EC4899', '#DB2777', '#BE185D',
  '#06B6D4', '#0891B2', '#0E7490',
];

function TeamColorPicker({
  value,
  fallback,
  onChange,
}: {
  value: string | undefined;
  fallback: string;
  onChange: (color: string) => void;
}) {
  const current = value || fallback;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <div className="w-4 h-4 rounded border" style={{ backgroundColor: current }} />
          <span className="font-mono text-xs">{current}</span>
          <Palette className="ml-auto h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {colorPresets.map((c) => (
              <button
                key={c}
                type="button"
                className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: current === c ? 'white' : 'transparent',
                }}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={current}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 p-1 cursor-pointer"
            />
            <Input
              value={current}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="font-mono"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BroadcastControlsPanel() {
  useSeriesAutoTracker();
  const {
    session,
    updateSession,
    createSession,
    resetGameScore,
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
  const [sessionName, setSessionName] = useState('');
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [logoA, setLogoA] = useState('');
  const [logoB, setLogoB] = useState('');
  const [newSessionName, setNewSessionName] = useState('');

  useEffect(() => {
    setNameA(session?.team_a_name ?? '');
    setNameB(session?.team_b_name ?? '');
    setLogoA(session?.team_a_logo ?? '');
    setLogoB(session?.team_b_logo ?? '');
    setSessionName(session?.name ?? '');
  }, [session?.team_a_name, session?.team_b_name, session?.team_a_logo, session?.team_b_logo, session?.name]);

  if (!session) {
    const handleCreate = async () => {
      const name = newSessionName.trim() || 'Nowa transmisja';
      const { error } = await createSession(name);
      if (error) {
        toast({ variant: 'destructive', title: 'Błąd', description: error.message });
      } else {
        toast({ title: 'Utworzono sesję', description: name });
        setNewSessionName('');
      }
    };
    return (
      <Card className="w-full max-w-[600px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Brak aktywnej sesji transmisji</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nazwa nowej transmisji</Label>
            <Input
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="np. Finał – RLCS"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>
          <Button onClick={handleCreate} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Utwórz nową transmisję
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleClear = async () => {
    if (!confirm('Wyczyścić ręcznie wprowadzone dane (nazwy drużyn, wynik serii, powiązanie z MMRivals)?')) return;
    await clearManualData();
    toast({ title: 'Wyczyszczono dane ręczne' });
  };

  const handleResetGame = async () => {
    if (!confirm('Zresetować wynik bieżącej gry (0:0)?')) return;
    await resetGameScore();
  };

  return (
    <div className="w-full max-w-[1200px] grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sterowanie meczem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session/round name */}
          <div className="space-y-1">
            <Label className="text-xs">Nazwa sesji / rundy</Label>
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onBlur={() => {
                if (sessionName !== (session.name ?? '')) updateSession({ name: sessionName });
              }}
              placeholder="np. Finał – RLCS"
            />
          </div>

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
              <TeamColorPicker
                value={session.team_a_color}
                fallback="#3B82F6"
                onChange={(c) => updateSession({ team_a_color: c })}
              />
              <div className="flex gap-2">
                <Input
                  value={logoA}
                  onChange={(e) => setLogoA(e.target.value)}
                  onBlur={() => {
                    if (logoA !== (session.team_a_logo ?? '')) {
                      updateSession({ team_a_logo: (logoA || null) as unknown as string | undefined });
                    }
                  }}
                  placeholder="URL logo"
                  className="text-xs"
                />
                {logoA && (
                  <div className="w-9 h-9 shrink-0 rounded border bg-card flex items-center justify-center overflow-hidden">
                    <img
                      src={logoA}
                      alt="Logo A"
                      className="w-full h-full object-contain"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  </div>
                )}
              </div>
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
              <TeamColorPicker
                value={session.team_b_color}
                fallback="#F97316"
                onChange={(c) => updateSession({ team_b_color: c })}
              />
              <div className="flex gap-2">
                <Input
                  value={logoB}
                  onChange={(e) => setLogoB(e.target.value)}
                  onBlur={() => {
                    if (logoB !== (session.team_b_logo ?? '')) {
                      updateSession({ team_b_logo: (logoB || null) as unknown as string | undefined });
                    }
                  }}
                  placeholder="URL logo"
                  className="text-xs"
                />
                {logoB && (
                  <div className="w-9 h-9 shrink-0 rounded border bg-card flex items-center justify-center overflow-hidden">
                    <img
                      src={logoB}
                      alt="Logo B"
                      className="w-full h-full object-contain"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  </div>
                )}
              </div>
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
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={resetSeriesScore}>
                <RotateCcw className="mr-2 h-3 w-3" /> Reset serii (0:0)
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetGame}>
                <RotateCcw className="mr-2 h-3 w-3" /> Reset gry (0:0)
              </Button>
            </div>
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