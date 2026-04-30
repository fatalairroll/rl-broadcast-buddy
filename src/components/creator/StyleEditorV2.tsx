import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { SliderInput } from '@/components/ui/slider-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  V2_ELEMENT_LABELS,
  type OverlayV2Config,
  type V2EditableElement,
  type PositionV2,
  type AnchorH,
  type AnchorV,
} from '@/types/overlayV2';
import type { GlowConfig } from '@/lib/glow-utils';
import type { GradientConfig, GradientStop } from '@/lib/gradient-utils';

interface Props {
  config: OverlayV2Config;
  element: V2EditableElement;
  onChange: (next: OverlayV2Config) => void;
}

export function StyleEditorV2({ config, element, onChange }: Props) {
  const update = <K extends keyof OverlayV2Config>(key: K, patch: Partial<OverlayV2Config[K]>) =>
    onChange({ ...config, [key]: { ...config[key], ...patch } });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{V2_ELEMENT_LABELS[element]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {element === 'scoreboard' && (
          <>
            <Toggle label="Widoczny" value={config.scoreboard.visible} onChange={(v) => update('scoreboard', { visible: v })} />
            <PositionEditor value={config.scoreboard.position} onChange={(p) => update('scoreboard', { position: p })} />
            <Separator />
            <SliderInput label="Odstęp między kafelkami" value={config.scoreboard.gap} onValueChange={(v) => update('scoreboard', { gap: v })} min={0} max={64} unit="px" />
            <SliderInput label="Skew" value={config.scoreboard.skewDeg} onValueChange={(v) => update('scoreboard', { skewDeg: v })} min={-30} max={30} unit="°" />
            <SliderInput label="Opacity" value={config.scoreboard.opacity} onValueChange={(v) => update('scoreboard', { opacity: v })} min={0} max={1} step={0.05} />
            <FontInput label="Font" value={config.scoreboard.fontFamily} onChange={(v) => update('scoreboard', { fontFamily: v })} />
          </>
        )}

        {(element === 'scoreBlue' || element === 'scoreOrange') && (
          <ScoreSideEditor
            value={element === 'scoreBlue' ? config.scoreBlue : config.scoreOrange}
            onChange={(patch) => update(element, patch)}
          />
        )}

        {element === 'timer' && (
          <>
            <Toggle label="Odepnij timer (osobna pozycja)" value={config.timer.detached} onChange={(v) => update('timer', { detached: v })} />
            {config.timer.detached && (
              <>
                <PositionEditor value={config.timer.position} onChange={(p) => update('timer', { position: p })} />
                <Separator />
              </>
            )}
            <ColorPicker label="Tło" value={config.timer.background} onChange={(v) => update('timer', { background: v })} />
            <FontInput label="Font" value={config.timer.fontFamily} onChange={(v) => update('timer', { fontFamily: v })} />
            <SliderInput label="Rozmiar fontu" value={config.timer.fontSize} onValueChange={(v) => update('timer', { fontSize: v })} min={20} max={120} unit="px" />
            <ColorPicker label="Kolor tekstu" value={config.timer.textColor} onChange={(v) => update('timer', { textColor: v })} />
            <SliderInput label="Padding X" value={config.timer.paddingX} onValueChange={(v) => update('timer', { paddingX: v })} min={0} max={120} unit="px" />
            <SliderInput label="Padding Y" value={config.timer.paddingY} onValueChange={(v) => update('timer', { paddingY: v })} min={0} max={60} unit="px" />
            <SliderInput label="Min. szerokość" value={config.timer.minWidth} onValueChange={(v) => update('timer', { minWidth: v })} min={120} max={500} unit="px" />
            <Separator />
            <Toggle label="Etykieta Overtime" value={config.timer.showOvertimeLabel} onChange={(v) => update('timer', { showOvertimeLabel: v })} />
            <ColorPicker label="Kolor etykiety OT" value={config.timer.overtimeLabelColor} onChange={(v) => update('timer', { overtimeLabelColor: v })} />
            <Separator />
            <GlowEditor value={config.timer.glow} onChange={(v) => update('timer', { glow: v })} />
          </>
        )}

        {element === 'boostBar' && (
          <>
            <Toggle label="Widoczne" value={config.boostBar.visible} onChange={(v) => update('boostBar', { visible: v })} />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja lewy stack</h4>
            <PositionEditor value={config.boostBar.positionLeft} onChange={(p) => update('boostBar', { positionLeft: p })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja prawy stack</h4>
            <PositionEditor value={config.boostBar.positionRight} onChange={(p) => update('boostBar', { positionRight: p })} />
            <Separator />
            <SliderInput label="Szerokość paska" value={config.boostBar.width} onValueChange={(v) => update('boostBar', { width: v })} min={180} max={500} unit="px" />
            <SliderInput label="Odstęp w pionie" value={config.boostBar.gap} onValueChange={(v) => update('boostBar', { gap: v })} min={0} max={40} unit="px" />
            <SliderInput label="Skew" value={config.boostBar.skewDeg} onValueChange={(v) => update('boostBar', { skewDeg: v })} min={-30} max={30} unit="°" />
            <ColorPicker label="Tło" value={config.boostBar.background} onChange={(v) => update('boostBar', { background: v })} />
            <ColorPicker label="Kolor obramowania" value={config.boostBar.borderColor} onChange={(v) => update('boostBar', { borderColor: v })} />
            <SliderInput label="Padding X" value={config.boostBar.paddingX} onValueChange={(v) => update('boostBar', { paddingX: v })} min={0} max={40} unit="px" />
            <SliderInput label="Padding Y" value={config.boostBar.paddingY} onValueChange={(v) => update('boostBar', { paddingY: v })} min={0} max={30} unit="px" />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Niebiescy</h4>
            <ColorPicker label="Gradient od" value={config.boostBar.blueFrom} onChange={(v) => update('boostBar', { blueFrom: v })} />
            <ColorPicker label="Gradient do" value={config.boostBar.blueTo} onChange={(v) => update('boostBar', { blueTo: v })} />
            <ColorPicker label="Glow" value={config.boostBar.blueGlow} onChange={(v) => update('boostBar', { blueGlow: v })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pomarańczowi</h4>
            <ColorPicker label="Gradient od" value={config.boostBar.orangeFrom} onChange={(v) => update('boostBar', { orangeFrom: v })} />
            <ColorPicker label="Gradient do" value={config.boostBar.orangeTo} onChange={(v) => update('boostBar', { orangeTo: v })} />
            <ColorPicker label="Glow" value={config.boostBar.orangeGlow} onChange={(v) => update('boostBar', { orangeGlow: v })} />
            <Separator />
            <ColorPicker label="Kolor supersonic" value={config.boostBar.supersonicColor} onChange={(v) => update('boostBar', { supersonicColor: v })} />
            <ColorPicker label="Kolor demolished" value={config.boostBar.demolishedColor} onChange={(v) => update('boostBar', { demolishedColor: v })} />
            <Separator />
            <FontInput label="Font nicku" value={config.boostBar.nameFontFamily} onChange={(v) => update('boostBar', { nameFontFamily: v })} />
            <SliderInput label="Rozmiar nicku" value={config.boostBar.nameFontSize} onValueChange={(v) => update('boostBar', { nameFontSize: v })} min={10} max={28} unit="px" />
            <ColorPicker label="Kolor nicku" value={config.boostBar.nameColor} onChange={(v) => update('boostBar', { nameColor: v })} />
            <SliderInput label="Rozmiar boost (liczba)" value={config.boostBar.boostFontSize} onValueChange={(v) => update('boostBar', { boostFontSize: v })} min={10} max={32} unit="px" />
            <Separator />
            <Toggle label="Mini-statystyki" value={config.boostBar.showStats} onChange={(v) => update('boostBar', { showStats: v })} />
            <SliderInput label="Rozmiar statystyk" value={config.boostBar.statsFontSize} onValueChange={(v) => update('boostBar', { statsFontSize: v })} min={8} max={20} unit="px" />
            <ColorPicker label="Kolor statystyk" value={config.boostBar.statsColor} onChange={(v) => update('boostBar', { statsColor: v })} />
          </>
        )}

        {element === 'playerCard' && (
          <>
            <Toggle label="Widoczna" value={config.playerCard.visible} onChange={(v) => update('playerCard', { visible: v })} />
            <PositionEditor value={config.playerCard.position} onChange={(p) => update('playerCard', { position: p })} />
            <Separator />
            <SliderInput label="Min. szerokość" value={config.playerCard.width} onValueChange={(v) => update('playerCard', { width: v })} min={400} max={1200} unit="px" />
            <SliderInput label="Wysokość" value={config.playerCard.height} onValueChange={(v) => update('playerCard', { height: v })} min={100} max={300} unit="px" />
            <SliderInput label="Skew" value={config.playerCard.skewDeg} onValueChange={(v) => update('playerCard', { skewDeg: v })} min={-30} max={30} unit="°" />
            <ColorPicker label="Kolor obramowania" value={config.playerCard.borderColor} onChange={(v) => update('playerCard', { borderColor: v })} />
            <SliderInput label="Grubość obramowania" value={config.playerCard.borderWidth} onValueChange={(v) => update('playerCard', { borderWidth: v })} min={0} max={8} unit="px" />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient niebiescy (fallback)</h4>
            <GradientEditor value={config.playerCard.blueGradient} onChange={(v) => update('playerCard', { blueGradient: v })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient pomarańczowi (fallback)</h4>
            <GradientEditor value={config.playerCard.orangeGradient} onChange={(v) => update('playerCard', { orangeGradient: v })} />
            <Separator />
            <GlowEditor value={config.playerCard.glow} onChange={(v) => update('playerCard', { glow: v })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">MMR watermark</h4>
            <SliderInput label="Rozmiar" value={config.playerCard.mmrFontSize} onValueChange={(v) => update('playerCard', { mmrFontSize: v })} min={40} max={200} unit="px" />
            <FontInput label="Font" value={config.playerCard.mmrFontFamily} onChange={(v) => update('playerCard', { mmrFontFamily: v })} />
            <ColorPicker label="Kolor" value={config.playerCard.mmrColor} onChange={(v) => update('playerCard', { mmrColor: v })} />
            <SliderInput label="Opacity" value={config.playerCard.mmrOpacity} onValueChange={(v) => update('playerCard', { mmrOpacity: v })} min={0} max={1} step={0.05} />
            <Separator />
            <SliderInput label="Szerokość zdjęcia" value={config.playerCard.photoWidth} onValueChange={(v) => update('playerCard', { photoWidth: v })} min={80} max={300} unit="px" />
            <Separator />
            <FontInput label="Font nicku" value={config.playerCard.nickFontFamily} onChange={(v) => update('playerCard', { nickFontFamily: v })} />
            <SliderInput label="Rozmiar nicku" value={config.playerCard.nickFontSize} onValueChange={(v) => update('playerCard', { nickFontSize: v })} min={18} max={60} unit="px" />
            <ColorPicker label="Kolor nicku" value={config.playerCard.nickColor} onChange={(v) => update('playerCard', { nickColor: v })} />
            <Separator />
            <SliderInput label="Rozmiar statystyk" value={config.playerCard.statsFontSize} onValueChange={(v) => update('playerCard', { statsFontSize: v })} min={14} max={36} unit="px" />
            <ColorPicker label="Kolor statystyk" value={config.playerCard.statsColor} onChange={(v) => update('playerCard', { statsColor: v })} />
            <Separator />
            <ColorPicker label="Tło chip-a kraju" value={config.playerCard.countryBg} onChange={(v) => update('playerCard', { countryBg: v })} />
            <ColorPicker label="Kolor tekstu kraju" value={config.playerCard.countryColor} onChange={(v) => update('playerCard', { countryColor: v })} />
          </>
        )}

        {element === 'general' && (
          <>
            <Toggle label="Animacje" value={config.general.animationsEnabled} onChange={(v) => update('general', { animationsEnabled: v })} />
            <SliderInput label="Czas animacji" value={config.general.transitionDuration} onValueChange={(v) => update('general', { transitionDuration: v })} min={100} max={1500} step={50} unit="ms" />
            <SliderInput label="Globalna skala" value={config.general.globalScale} onValueChange={(v) => update('general', { globalScale: v })} min={0.5} max={1.5} step={0.05} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreSideEditor({
  value,
  onChange,
}: {
  value: OverlayV2Config['scoreBlue'];
  onChange: (patch: Partial<OverlayV2Config['scoreBlue']>) => void;
}) {
  return (
    <>
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient tła</h4>
      <GradientEditor value={value.gradient} onChange={(g) => onChange({ gradient: g })} />
      <Separator />
      <GlowEditor value={value.glow} onChange={(g) => onChange({ glow: g })} />
      <Separator />
      <SliderInput label="Padding X" value={value.paddingX} onValueChange={(v) => onChange({ paddingX: v })} min={0} max={120} unit="px" />
      <SliderInput label="Padding Y" value={value.paddingY} onValueChange={(v) => onChange({ paddingY: v })} min={0} max={60} unit="px" />
      <SliderInput label="Min. szerokość" value={value.minWidth} onValueChange={(v) => onChange({ minWidth: v })} min={80} max={400} unit="px" />
      <SliderInput label="Rozmiar fontu" value={value.fontSize} onValueChange={(v) => onChange({ fontSize: v })} min={20} max={140} unit="px" />
      <SliderInput label="Grubość" value={value.fontWeight} onValueChange={(v) => onChange({ fontWeight: v })} min={300} max={900} step={100} />
      <ColorPicker label="Kolor tekstu" value={value.textColor} onChange={(v) => onChange({ textColor: v })} />
      <div className="space-y-2">
        <Label className="text-xs">Cień tekstu (CSS)</Label>
        <Input value={value.textShadow} onChange={(e) => onChange({ textShadow: e.target.value })} className="h-8 text-xs font-mono" />
      </div>
    </>
  );
}

function GlowEditor({ value, onChange }: { value: GlowConfig; onChange: (v: GlowConfig) => void }) {
  return (
    <>
      <Toggle label="Glow włączony" value={value.enabled} onChange={(v) => onChange({ ...value, enabled: v })} />
      {value.enabled && (
        <>
          <ColorPicker label="Kolor glow" value={value.color} onChange={(c) => onChange({ ...value, color: c })} />
          <SliderInput label="Blur" value={value.blur} onValueChange={(v) => onChange({ ...value, blur: v })} min={0} max={80} unit="px" />
          <SliderInput label="Spread" value={value.spread} onValueChange={(v) => onChange({ ...value, spread: v })} min={0} max={20} unit="px" />
          <SliderInput label="Intensywność" value={value.intensity} onValueChange={(v) => onChange({ ...value, intensity: v })} min={0} max={1} step={0.05} />
        </>
      )}
    </>
  );
}

function GradientEditor({ value, onChange }: { value: GradientConfig; onChange: (v: GradientConfig) => void }) {
  const setStop = (idx: number, patch: Partial<GradientStop>) => {
    const stops = value.stops.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange({ ...value, stops });
  };
  return (
    <>
      <Toggle label="Gradient włączony" value={value.enabled} onChange={(v) => onChange({ ...value, enabled: v })} />
      {value.enabled && (
        <>
          <SliderInput label="Kąt" value={value.angle} onValueChange={(v) => onChange({ ...value, angle: v })} min={0} max={360} unit="°" />
          {value.stops.map((stop, i) => (
            <div key={i} className="space-y-2 border-l-2 border-border pl-3">
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Stop {i + 1}</Label>
              <ColorPicker label="Kolor" value={stop.color} onChange={(c) => setStop(i, { color: c })} />
              <SliderInput label="Pozycja" value={stop.position} onValueChange={(v) => setStop(i, { position: v })} min={0} max={100} unit="%" />
            </div>
          ))}
        </>
      )}
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function FontInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs font-mono" />
    </div>
  );
}

function PositionEditor({ value, onChange }: { value: PositionV2; onChange: (v: PositionV2) => void }) {
  return (
    <div className="space-y-3 border-l-2 border-primary/40 pl-3">
      <Label className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Anchor X</Label>
          <Select value={value.anchorH} onValueChange={(v) => onChange({ ...value, anchorH: v as AnchorH })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Lewa</SelectItem>
              <SelectItem value="center">Środek</SelectItem>
              <SelectItem value="right">Prawa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Anchor Y</Label>
          <Select value={value.anchorV} onValueChange={(v) => onChange({ ...value, anchorV: v as AnchorV })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Góra</SelectItem>
              <SelectItem value="middle">Środek</SelectItem>
              <SelectItem value="bottom">Dół</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <SliderInput label="Offset X" value={value.offsetX} onValueChange={(v) => onChange({ ...value, offsetX: v })} min={-1920} max={1920} unit="px" />
      <SliderInput label="Offset Y" value={value.offsetY} onValueChange={(v) => onChange({ ...value, offsetY: v })} min={-1080} max={1080} unit="px" />
    </div>
  );
}
