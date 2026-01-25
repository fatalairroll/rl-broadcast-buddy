import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { EditableElement, OverlayConfig } from '@/types/broadcast';
import { ELEMENT_LABELS } from '@/types/broadcast';
import { Palette, Box, Type, Sliders } from 'lucide-react';

interface StyleEditorProps {
  element: EditableElement;
  config: OverlayConfig;
  onChange: <K extends keyof OverlayConfig>(section: K, updates: Partial<OverlayConfig[K]>) => void;
}

export function StyleEditor({ element, config, onChange }: StyleEditorProps) {
  const section = config[element];

  // Color input with preview
  const ColorInput = ({ 
    label, 
    value, 
    onValueChange 
  }: { 
    label: string; 
    value: string; 
    onValueChange: (v: string) => void 
  }) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border border-border cursor-pointer"
          style={{ backgroundColor: value }}
        />
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="flex-1 h-8 text-xs font-mono"
          placeholder="rgba(0,0,0,0.9)"
        />
      </div>
    </div>
  );

  // Slider with label and value
  const SliderInput = ({
    label,
    value,
    onValueChange,
    min,
    max,
    step = 1,
    unit = '',
  }: {
    label: string;
    value: number;
    onValueChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground font-mono">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        className="py-1"
      />
    </div>
  );

  const renderScoreboardEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Pozycja i rozmiar</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Pozycja X"
            value={config.scoreboard.position.x}
            onValueChange={(v) => onChange('scoreboard', { position: { ...config.scoreboard.position, x: v } })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Pozycja Y"
            value={config.scoreboard.position.y}
            onValueChange={(v) => onChange('scoreboard', { position: { ...config.scoreboard.position, y: v } })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Szerokość"
            value={config.scoreboard.width}
            onValueChange={(v) => onChange('scoreboard', { width: v })}
            min={400}
            max={1200}
            unit="px"
          />
          <SliderInput
            label="Wysokość"
            value={config.scoreboard.height}
            onValueChange={(v) => onChange('scoreboard', { height: v })}
            min={50}
            max={150}
            unit="px"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.scoreboard.backgroundColor}
          onValueChange={(v) => onChange('scoreboard', { backgroundColor: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Zaokrąglenie"
            value={config.scoreboard.borderRadius}
            onValueChange={(v) => onChange('scoreboard', { borderRadius: v })}
            min={0}
            max={40}
            unit="px"
          />
          <SliderInput
            label="Grubość obramowania"
            value={config.scoreboard.borderWidth}
            onValueChange={(v) => onChange('scoreboard', { borderWidth: v })}
            min={0}
            max={5}
            unit="px"
          />
        </div>
        <ColorInput
          label="Kolor obramowania"
          value={config.scoreboard.borderColor}
          onValueChange={(v) => onChange('scoreboard', { borderColor: v })}
        />
        <SliderInput
          label="Odstęp między elementami"
          value={config.scoreboard.gap}
          onValueChange={(v) => onChange('scoreboard', { gap: v })}
          min={4}
          max={40}
          unit="px"
        />
      </div>
    </div>
  );

  const renderScoreDisplayEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.scoreDisplay.backgroundColor}
          onValueChange={(v) => onChange('scoreDisplay', { backgroundColor: v })}
        />
        <ColorInput
          label="Kolor tekstu"
          value={config.scoreDisplay.textColor}
          onValueChange={(v) => onChange('scoreDisplay', { textColor: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Rozmiar czcionki"
            value={config.scoreDisplay.fontSize}
            onValueChange={(v) => onChange('scoreDisplay', { fontSize: v })}
            min={18}
            max={72}
            unit="px"
          />
          <SliderInput
            label="Zaokrąglenie"
            value={config.scoreDisplay.borderRadius}
            onValueChange={(v) => onChange('scoreDisplay', { borderRadius: v })}
            min={0}
            max={20}
            unit="px"
          />
          <SliderInput
            label="Padding"
            value={config.scoreDisplay.padding}
            onValueChange={(v) => onChange('scoreDisplay', { padding: v })}
            min={0}
            max={30}
            unit="px"
          />
          <SliderInput
            label="Odstęp"
            value={config.scoreDisplay.gap}
            onValueChange={(v) => onChange('scoreDisplay', { gap: v })}
            min={4}
            max={30}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Separator</h4>
        <ColorInput
          label="Kolor separatora"
          value={config.scoreDisplay.separatorColor}
          onValueChange={(v) => onChange('scoreDisplay', { separatorColor: v })}
        />
        <SliderInput
          label="Grubość separatora"
          value={config.scoreDisplay.separatorWidth}
          onValueChange={(v) => onChange('scoreDisplay', { separatorWidth: v })}
          min={0}
          max={6}
          unit="px"
        />
      </div>
    </div>
  );

  const renderTimerDisplayEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.timerDisplay.backgroundColor}
          onValueChange={(v) => onChange('timerDisplay', { backgroundColor: v })}
        />
        <ColorInput
          label="Kolor tekstu"
          value={config.timerDisplay.textColor}
          onValueChange={(v) => onChange('timerDisplay', { textColor: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Rozmiar czcionki"
            value={config.timerDisplay.fontSize}
            onValueChange={(v) => onChange('timerDisplay', { fontSize: v })}
            min={12}
            max={40}
            unit="px"
          />
          <SliderInput
            label="Zaokrąglenie"
            value={config.timerDisplay.borderRadius}
            onValueChange={(v) => onChange('timerDisplay', { borderRadius: v })}
            min={0}
            max={20}
            unit="px"
          />
          <SliderInput
            label="Padding"
            value={config.timerDisplay.padding}
            onValueChange={(v) => onChange('timerDisplay', { padding: v })}
            min={0}
            max={20}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Dogrywka</h4>
        <div className="flex items-center justify-between">
          <Label>Pokaż etykietę OT</Label>
          <Switch
            checked={config.timerDisplay.showOvertimeLabel}
            onCheckedChange={(v) => onChange('timerDisplay', { showOvertimeLabel: v })}
          />
        </div>
        <ColorInput
          label="Kolor etykiety OT"
          value={config.timerDisplay.overtimeLabelColor}
          onValueChange={(v) => onChange('timerDisplay', { overtimeLabelColor: v })}
        />
      </div>
    </div>
  );

  const renderSeriesDisplayEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.seriesDisplay.backgroundColor}
          onValueChange={(v) => onChange('seriesDisplay', { backgroundColor: v })}
        />
        <ColorInput
          label="Kolor tekstu"
          value={config.seriesDisplay.textColor}
          onValueChange={(v) => onChange('seriesDisplay', { textColor: v })}
        />
        <SliderInput
          label="Rozmiar czcionki"
          value={config.seriesDisplay.fontSize}
          onValueChange={(v) => onChange('seriesDisplay', { fontSize: v })}
          min={8}
          max={20}
          unit="px"
        />
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Kropki wyniku</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Rozmiar kropki"
            value={config.seriesDisplay.dotSize}
            onValueChange={(v) => onChange('seriesDisplay', { dotSize: v })}
            min={4}
            max={16}
            unit="px"
          />
          <SliderInput
            label="Odstęp"
            value={config.seriesDisplay.dotSpacing}
            onValueChange={(v) => onChange('seriesDisplay', { dotSpacing: v })}
            min={2}
            max={12}
            unit="px"
          />
        </div>
        <ColorInput
          label="Kolor aktywnej kropki"
          value={config.seriesDisplay.activeDotColor}
          onValueChange={(v) => onChange('seriesDisplay', { activeDotColor: v })}
        />
        <ColorInput
          label="Kolor nieaktywnej kropki"
          value={config.seriesDisplay.inactiveDotColor}
          onValueChange={(v) => onChange('seriesDisplay', { inactiveDotColor: v })}
        />
        <div className="flex items-center justify-between">
          <Label>Pokaż typ serii</Label>
          <Switch
            checked={config.seriesDisplay.showSeriesType}
            onCheckedChange={(v) => onChange('seriesDisplay', { showSeriesType: v })}
          />
        </div>
      </div>
    </div>
  );

  const renderTeamNameEditor = (team: 'teamAName' | 'teamBName') => {
    const teamConfig = config[team];
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Styl tekstu</h4>
          <ColorInput
            label="Kolor tła"
            value={teamConfig.backgroundColor}
            onValueChange={(v) => onChange(team, { backgroundColor: v })}
          />
          <ColorInput
            label="Kolor tekstu"
            value={teamConfig.textColor}
            onValueChange={(v) => onChange(team, { textColor: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <SliderInput
              label="Rozmiar czcionki"
              value={teamConfig.fontSize}
              onValueChange={(v) => onChange(team, { fontSize: v })}
              min={12}
              max={32}
              unit="px"
            />
            <SliderInput
              label="Max szerokość"
              value={teamConfig.maxWidth}
              onValueChange={(v) => onChange(team, { maxWidth: v })}
              min={80}
              max={250}
              unit="px"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Logo</h4>
          <div className="flex items-center justify-between">
            <Label>Pokaż logo</Label>
            <Switch
              checked={teamConfig.showLogo}
              onCheckedChange={(v) => onChange(team, { showLogo: v })}
            />
          </div>
          <SliderInput
            label="Rozmiar logo"
            value={teamConfig.logoSize}
            onValueChange={(v) => onChange(team, { logoSize: v })}
            min={20}
            max={80}
            unit="px"
          />
        </div>
      </div>
    );
  };

  const renderBoostBarsEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Rozmiar</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Szerokość"
            value={config.boostBars.width}
            onValueChange={(v) => onChange('boostBars', { width: v })}
            min={150}
            max={400}
            unit="px"
          />
          <SliderInput
            label="Wysokość paska"
            value={config.boostBars.barHeight}
            onValueChange={(v) => onChange('boostBars', { barHeight: v })}
            min={4}
            max={20}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.boostBars.backgroundColor}
          onValueChange={(v) => onChange('boostBars', { backgroundColor: v })}
        />
        <ColorInput
          label="Kolor drużyny A"
          value={config.boostBars.teamAColor}
          onValueChange={(v) => onChange('boostBars', { teamAColor: v })}
        />
        <ColorInput
          label="Kolor drużyny B"
          value={config.boostBars.teamBColor}
          onValueChange={(v) => onChange('boostBars', { teamBColor: v })}
        />
        <SliderInput
          label="Zaokrąglenie"
          value={config.boostBars.borderRadius}
          onValueChange={(v) => onChange('boostBars', { borderRadius: v })}
          min={0}
          max={20}
          unit="px"
        />
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Opcje</h4>
        <div className="flex items-center justify-between">
          <Label>Pokaż nazwy graczy</Label>
          <Switch
            checked={config.boostBars.showPlayerNames}
            onCheckedChange={(v) => onChange('boostBars', { showPlayerNames: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Pokaż wartość boosta</Label>
          <Switch
            checked={config.boostBars.showBoostValue}
            onCheckedChange={(v) => onChange('boostBars', { showBoostValue: v })}
          />
        </div>
        <SliderInput
          label="Szybkość animacji"
          value={config.boostBars.animationSpeed}
          onValueChange={(v) => onChange('boostBars', { animationSpeed: v })}
          min={50}
          max={500}
          unit="ms"
        />
      </div>
    </div>
  );

  const renderBoostCircleEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Pozycja i rozmiar</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Pozycja X"
            value={config.boostCircle.position.x}
            onValueChange={(v) => onChange('boostCircle', { position: { ...config.boostCircle.position, x: v } })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Pozycja Y"
            value={config.boostCircle.position.y}
            onValueChange={(v) => onChange('boostCircle', { position: { ...config.boostCircle.position, y: v } })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Rozmiar"
            value={config.boostCircle.size}
            onValueChange={(v) => onChange('boostCircle', { size: v })}
            min={60}
            max={200}
            unit="px"
          />
          <SliderInput
            label="Grubość pierścienia"
            value={config.boostCircle.strokeWidth}
            onValueChange={(v) => onChange('boostCircle', { strokeWidth: v })}
            min={2}
            max={20}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.boostCircle.backgroundColor}
          onValueChange={(v) => onChange('boostCircle', { backgroundColor: v })}
        />
        <ColorInput
          label="Kolor tekstu"
          value={config.boostCircle.textColor}
          onValueChange={(v) => onChange('boostCircle', { textColor: v })}
        />
        <SliderInput
          label="Rozmiar czcionki"
          value={config.boostCircle.fontSize}
          onValueChange={(v) => onChange('boostCircle', { fontSize: v })}
          min={14}
          max={48}
          unit="px"
        />
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Opcje</h4>
        <div className="flex items-center justify-between">
          <Label>Pokaż wartość</Label>
          <Switch
            checked={config.boostCircle.showValue}
            onCheckedChange={(v) => onChange('boostCircle', { showValue: v })}
          />
        </div>
        <SliderInput
          label="Szybkość animacji"
          value={config.boostCircle.animationSpeed}
          onValueChange={(v) => onChange('boostCircle', { animationSpeed: v })}
          min={50}
          max={500}
          unit="ms"
        />
      </div>
    </div>
  );

  const renderPlayerStatsEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Pozycja i rozmiar</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Pozycja X"
            value={config.playerStats.position.x}
            onValueChange={(v) => onChange('playerStats', { position: { ...config.playerStats.position, x: v } })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Pozycja Y"
            value={config.playerStats.position.y}
            onValueChange={(v) => onChange('playerStats', { position: { ...config.playerStats.position, y: v } })}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Szerokość"
            value={config.playerStats.width}
            onValueChange={(v) => onChange('playerStats', { width: v })}
            min={200}
            max={500}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <ColorInput
          label="Kolor tła"
          value={config.playerStats.backgroundColor}
          onValueChange={(v) => onChange('playerStats', { backgroundColor: v })}
        />
        <ColorInput
          label="Kolor tekstu"
          value={config.playerStats.textColor}
          onValueChange={(v) => onChange('playerStats', { textColor: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Rozmiar czcionki"
            value={config.playerStats.fontSize}
            onValueChange={(v) => onChange('playerStats', { fontSize: v })}
            min={10}
            max={24}
            unit="px"
          />
          <SliderInput
            label="Zaokrąglenie"
            value={config.playerStats.borderRadius}
            onValueChange={(v) => onChange('playerStats', { borderRadius: v })}
            min={0}
            max={20}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Widoczne statystyki</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Gole</Label>
            <Switch
              checked={config.playerStats.showGoals}
              onCheckedChange={(v) => onChange('playerStats', { showGoals: v })}
              className="scale-75"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Asysty</Label>
            <Switch
              checked={config.playerStats.showAssists}
              onCheckedChange={(v) => onChange('playerStats', { showAssists: v })}
              className="scale-75"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Obrony</Label>
            <Switch
              checked={config.playerStats.showSaves}
              onCheckedChange={(v) => onChange('playerStats', { showSaves: v })}
              className="scale-75"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Strzały</Label>
            <Switch
              checked={config.playerStats.showShots}
              onCheckedChange={(v) => onChange('playerStats', { showShots: v })}
              className="scale-75"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Wynik</Label>
            <Switch
              checked={config.playerStats.showScore}
              onCheckedChange={(v) => onChange('playerStats', { showScore: v })}
              className="scale-75"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditor = () => {
    switch (element) {
      case 'scoreboard':
        return renderScoreboardEditor();
      case 'scoreDisplay':
        return renderScoreDisplayEditor();
      case 'timerDisplay':
        return renderTimerDisplayEditor();
      case 'seriesDisplay':
        return renderSeriesDisplayEditor();
      case 'teamAName':
        return renderTeamNameEditor('teamAName');
      case 'teamBName':
        return renderTeamNameEditor('teamBName');
      case 'boostBars':
        return renderBoostBarsEditor();
      case 'boostCircle':
        return renderBoostCircleEditor();
      case 'playerStats':
        return renderPlayerStatsEditor();
      default:
        return <p className="text-sm text-muted-foreground">Wybierz element do edycji</p>;
    }
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{ELEMENT_LABELS[element]}</h3>
        </div>
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
          {renderEditor()}
        </div>
      </CardContent>
    </Card>
  );
}
