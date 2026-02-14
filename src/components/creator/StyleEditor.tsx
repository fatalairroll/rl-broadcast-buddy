import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { ShapePicker } from '@/components/ui/shape-picker';
import { GradientEditor } from '@/components/ui/gradient-editor';
import { GlowEditor } from '@/components/ui/glow-editor';
import { SliderInput } from '@/components/ui/slider-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { EditableElement, OverlayConfig, ElementShape, GradientConfig } from '@/types/broadcast';
import { ELEMENT_LABELS } from '@/types/broadcast';
import { Palette } from 'lucide-react';

interface StyleEditorProps {
  element: EditableElement;
  config: OverlayConfig;
  onChange: <K extends keyof OverlayConfig>(section: K, updates: Partial<OverlayConfig[K]>) => void;
}

export function StyleEditor({ element, config, onChange }: StyleEditorProps) {
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
        <GradientEditor
          label="Tło"
          backgroundColor={config.scoreboard.backgroundColor}
          gradient={config.scoreboard.backgroundGradient}
          onBackgroundColorChange={(v) => onChange('scoreboard', { backgroundColor: v })}
          onGradientChange={(g) => onChange('scoreboard', { backgroundGradient: g })}
        />
        <ShapePicker
          label="Kształt elementu"
          value={config.scoreboard.shape}
          onChange={(v) => onChange('scoreboard', { shape: v })}
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
        <ColorPicker
          label="Kolor obramowania"
          value={config.scoreboard.borderColor}
          onChange={(v) => onChange('scoreboard', { borderColor: v })}
        />
        <SliderInput
          label="Przezroczystość"
          value={config.scoreboard.opacity ?? 1}
          onValueChange={(v) => onChange('scoreboard', { opacity: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <GlowEditor
          label="Efekt świecenia"
          glow={config.scoreboard.glow}
          onChange={(g) => onChange('scoreboard', { glow: g })}
        />
      </div>
    </div>
  );

  const renderScoreDisplayEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Rozmiar i przesunięcie</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Rozsuwanie X"
            value={config.scoreDisplay.offsetX}
            onValueChange={(v) => onChange('scoreDisplay', { offsetX: v })}
            min={-50}
            max={50}
            unit="px"
          />
          <SliderInput
            label="Przesunięcie Y"
            value={config.scoreDisplay.offsetY}
            onValueChange={(v) => onChange('scoreDisplay', { offsetY: v })}
            min={-50}
            max={50}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <GradientEditor
          label="Tło"
          backgroundColor={config.scoreDisplay.backgroundColor}
          gradient={config.scoreDisplay.backgroundGradient}
          onBackgroundColorChange={(v) => onChange('scoreDisplay', { backgroundColor: v })}
          onGradientChange={(g) => onChange('scoreDisplay', { backgroundGradient: g })}
        />
        <ColorPicker
          label="Kolor tekstu"
          value={config.scoreDisplay.textColor}
          onChange={(v) => onChange('scoreDisplay', { textColor: v })}
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
            label="Przezroczystość"
            value={config.scoreDisplay.opacity ?? 1}
            onValueChange={(v) => onChange('scoreDisplay', { opacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
        </div>
        <GlowEditor
          label="Efekt świecenia"
          glow={config.scoreDisplay.glow}
          onChange={(g) => onChange('scoreDisplay', { glow: g })}
        />
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Separator</h4>
        <ColorPicker
          label="Kolor separatora"
          value={config.scoreDisplay.separatorColor}
          onChange={(v) => onChange('scoreDisplay', { separatorColor: v })}
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
        <h4 className="text-sm font-medium">Rozmiar i przesunięcie</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Przesunięcie X"
            value={config.timerDisplay.offsetX}
            onValueChange={(v) => onChange('timerDisplay', { offsetX: v })}
            min={-50}
            max={50}
            unit="px"
          />
          <SliderInput
            label="Przesunięcie Y"
            value={config.timerDisplay.offsetY}
            onValueChange={(v) => onChange('timerDisplay', { offsetY: v })}
            min={-50}
            max={50}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <GradientEditor
          label="Tło"
          backgroundColor={config.timerDisplay.backgroundColor}
          gradient={config.timerDisplay.backgroundGradient}
          onBackgroundColorChange={(v) => onChange('timerDisplay', { backgroundColor: v })}
          onGradientChange={(g) => onChange('timerDisplay', { backgroundGradient: g })}
        />
        <ColorPicker
          label="Kolor tekstu"
          value={config.timerDisplay.textColor}
          onChange={(v) => onChange('timerDisplay', { textColor: v })}
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
          <SliderInput
            label="Przezroczystość"
            value={config.timerDisplay.opacity ?? 1}
            onValueChange={(v) => onChange('timerDisplay', { opacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
        </div>
        <GlowEditor
          label="Efekt świecenia"
          glow={config.timerDisplay.glow}
          onChange={(g) => onChange('timerDisplay', { glow: g })}
        />
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
        <ColorPicker
          label="Kolor etykiety OT"
          value={config.timerDisplay.overtimeLabelColor}
          onChange={(v) => onChange('timerDisplay', { overtimeLabelColor: v })}
        />
      </div>
    </div>
  );

  const renderSeriesDisplayEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Orientacja i pozycja</h4>
        <div className="space-y-2">
          <Label className="text-xs">Orientacja</Label>
          <RadioGroup
            value={config.seriesDisplay.orientation}
            onValueChange={(v: 'horizontal' | 'vertical') => onChange('seriesDisplay', { orientation: v })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="horizontal" id="horizontal" />
              <Label htmlFor="horizontal" className="text-xs">Poziomo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vertical" id="vertical" />
              <Label htmlFor="vertical" className="text-xs">Pionowo</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Rozsuwanie X"
            value={config.seriesDisplay.offsetX}
            onValueChange={(v) => onChange('seriesDisplay', { offsetX: v })}
            min={-50}
            max={50}
            unit="px"
          />
          <SliderInput
            label="Przesunięcie Y"
            value={config.seriesDisplay.offsetY}
            onValueChange={(v) => onChange('seriesDisplay', { offsetY: v })}
            min={-50}
            max={50}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <GradientEditor
          label="Tło"
          backgroundColor={config.seriesDisplay.backgroundColor}
          gradient={config.seriesDisplay.backgroundGradient}
          onBackgroundColorChange={(v) => onChange('seriesDisplay', { backgroundColor: v })}
          onGradientChange={(g) => onChange('seriesDisplay', { backgroundGradient: g })}
        />
        <ColorPicker
          label="Kolor tekstu"
          value={config.seriesDisplay.textColor}
          onChange={(v) => onChange('seriesDisplay', { textColor: v })}
        />
        <SliderInput
          label="Rozmiar czcionki"
          value={config.seriesDisplay.fontSize}
          onValueChange={(v) => onChange('seriesDisplay', { fontSize: v })}
          min={8}
          max={20}
          unit="px"
        />
        <SliderInput
          label="Przezroczystość"
          value={config.seriesDisplay.opacity ?? 1}
          onValueChange={(v) => onChange('seriesDisplay', { opacity: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <GlowEditor
          label="Efekt świecenia"
          glow={config.seriesDisplay.glow}
          onChange={(g) => onChange('seriesDisplay', { glow: g })}
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
        <ColorPicker
          label="Kolor aktywnej kropki"
          value={config.seriesDisplay.activeDotColor}
          onChange={(v) => onChange('seriesDisplay', { activeDotColor: v })}
        />
        <ColorPicker
          label="Kolor nieaktywnej kropki"
          value={config.seriesDisplay.inactiveDotColor}
          onChange={(v) => onChange('seriesDisplay', { inactiveDotColor: v })}
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
          <h4 className="text-sm font-medium">Rozmiar i przesunięcie</h4>
          <div className="grid grid-cols-2 gap-4">
            <SliderInput
              label="Rozsuwanie X"
              value={teamConfig.offsetX}
              onValueChange={(v) => onChange(team, { offsetX: v })}
              min={-100}
              max={100}
              unit="px"
            />
            <SliderInput
              label="Przesunięcie Y"
              value={teamConfig.offsetY}
              onValueChange={(v) => onChange(team, { offsetY: v })}
              min={-50}
              max={50}
              unit="px"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Styl tekstu</h4>
          <GradientEditor
            label="Tło"
            backgroundColor={teamConfig.backgroundColor}
            gradient={teamConfig.backgroundGradient}
            onBackgroundColorChange={(v) => onChange(team, { backgroundColor: v })}
            onGradientChange={(g) => onChange(team, { backgroundGradient: g })}
          />
          <ColorPicker
            label="Kolor tekstu"
            value={teamConfig.textColor}
            onChange={(v) => onChange(team, { textColor: v })}
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
          <SliderInput
            label="Przezroczystość"
            value={teamConfig.opacity ?? 1}
            onValueChange={(v) => onChange(team, { opacity: v })}
            min={0}
            max={1}
            step={0.05}
          />
          <GlowEditor
            label="Efekt świecenia"
            glow={teamConfig.glow}
            onChange={(g) => onChange(team, { glow: g })}
          />
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
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Łamanie tekstu</h4>
          <SliderInput
            label="Znaki na linię"
            value={teamConfig.maxCharsPerLine ?? 0}
            onValueChange={(v) => onChange(team, { maxCharsPerLine: v })}
            min={0}
            max={30}
          />
          <p className="text-xs text-muted-foreground">0 = bez łamania (jedna linia), &gt;0 = łamie po tylu znakach</p>
        </div>
      </div>
    );
  };

  const renderBoostBarsEditor = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Pozycja</h4>
        <div className="grid grid-cols-2 gap-4">
          <SliderInput
            label="Pozycja pionowa"
            value={config.boostBars.verticalPosition}
            onValueChange={(v) => onChange('boostBars', { verticalPosition: v })}
            min={10}
            max={90}
            unit="%"
          />
          <SliderInput
            label="Odstęp od krawędzi"
            value={config.boostBars.horizontalPadding}
            onValueChange={(v) => onChange('boostBars', { horizontalPadding: v })}
            min={8}
            max={100}
            unit="px"
          />
        </div>
      </div>
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
          <SliderInput
            label="Szerokość paska boost"
            value={config.boostBars.boostBarWidth}
            onValueChange={(v) => onChange('boostBars', { boostBarWidth: v })}
            min={50}
            max={200}
            unit="px"
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styl</h4>
        <GradientEditor
          label="Tło"
          backgroundColor={config.boostBars.backgroundColor}
          gradient={config.boostBars.backgroundGradient}
          onBackgroundColorChange={(v) => onChange('boostBars', { backgroundColor: v })}
          onGradientChange={(g) => onChange('boostBars', { backgroundGradient: g })}
        />
        <ShapePicker
          label="Kształt elementu"
          value={config.boostBars.shape}
          onChange={(v) => onChange('boostBars', { shape: v })}
        />
        <ColorPicker
          label="Kolor drużyny A"
          value={config.boostBars.teamAColor}
          onChange={(v) => onChange('boostBars', { teamAColor: v })}
        />
        <ColorPicker
          label="Kolor drużyny B"
          value={config.boostBars.teamBColor}
          onChange={(v) => onChange('boostBars', { teamBColor: v })}
        />
        <SliderInput
          label="Zaokrąglenie"
          value={config.boostBars.borderRadius}
          onValueChange={(v) => onChange('boostBars', { borderRadius: v })}
          min={0}
          max={20}
          unit="px"
        />
        <SliderInput
          label="Przezroczystość"
          value={config.boostBars.opacity ?? 1}
          onValueChange={(v) => onChange('boostBars', { opacity: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <GlowEditor
          label="Efekt świecenia"
          glow={config.boostBars.glow}
          onChange={(g) => onChange('boostBars', { glow: g })}
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
        <ColorPicker
          label="Kolor tła"
          value={config.boostCircle.backgroundColor}
          onChange={(v) => onChange('boostCircle', { backgroundColor: v })}
        />
        <ColorPicker
          label="Kolor tekstu"
          value={config.boostCircle.textColor}
          onChange={(v) => onChange('boostCircle', { textColor: v })}
        />
        <SliderInput
          label="Rozmiar czcionki"
          value={config.boostCircle.fontSize}
          onValueChange={(v) => onChange('boostCircle', { fontSize: v })}
          min={14}
          max={48}
          unit="px"
        />
        <SliderInput
          label="Przezroczystość"
          value={config.boostCircle.opacity ?? 1}
          onValueChange={(v) => onChange('boostCircle', { opacity: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <GlowEditor
          label="Efekt świecenia"
          glow={config.boostCircle.glow}
          onChange={(g) => onChange('boostCircle', { glow: g })}
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
        <ColorPicker
          label="Kolor tła"
          value={config.playerStats.backgroundColor}
          onChange={(v) => onChange('playerStats', { backgroundColor: v })}
        />
        <ColorPicker
          label="Kolor tekstu"
          value={config.playerStats.textColor}
          onChange={(v) => onChange('playerStats', { textColor: v })}
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
        <SliderInput
          label="Przezroczystość"
          value={config.playerStats.opacity ?? 1}
          onValueChange={(v) => onChange('playerStats', { opacity: v })}
          min={0}
          max={1}
          step={0.05}
        />
        <GlowEditor
          label="Efekt świecenia"
          glow={config.playerStats.glow}
          onChange={(g) => onChange('playerStats', { glow: g })}
        />
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
          <div className="flex items-center justify-between">
            <Label className="text-xs">Kasacje</Label>
            <Switch
              checked={config.playerStats.showDemos}
              onCheckedChange={(v) => onChange('playerStats', { showDemos: v })}
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
