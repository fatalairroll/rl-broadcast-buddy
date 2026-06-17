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
  type TeamNameStyle,
} from '@/types/overlayV2';
import type { GlowConfig } from '@/lib/glow-utils';
import type { GradientConfig, GradientStop } from '@/lib/gradient-utils';
import { OverrideLock } from './OverrideLock';
import { useRegistryOverrides } from '@/hooks/useRegistryOverrides';
import { useBroadcast } from '@/hooks/useBroadcast';

interface Props {
  config: OverlayV2Config;
  element: V2EditableElement;
  onChange: (next: OverlayV2Config) => void;
}

export function StyleEditorV2({ config, element, onChange }: Props) {
  const update = <K extends keyof OverlayV2Config>(key: K, patch: Partial<OverlayV2Config[K]>) =>
    onChange({ ...config, [key]: { ...config[key], ...patch } });
  const { session } = useBroadcast();
  const overrides = useRegistryOverrides(session);
  const isY2k = config.general.theme === 'y2k';
  const isNeobrutal = config.general.theme === 'neobrutal';
  const isLocked = isY2k || isNeobrutal;

  // For Y2K: lock all design fields (hardcoded look). Only position/size editable.
  const lockedNotice = (
    <p className="text-[10px] text-muted-foreground leading-snug">
      {isNeobrutal ? 'Motyw NEO-BRUTALISM' : 'Motyw Y2K CHROME'} ma styl hardcodowany. Edytowalne są tylko pozycja i rozmiar.
    </p>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{V2_ELEMENT_LABELS[element]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {element === 'scoreboard' && isLocked && (
          <>
            <Toggle label="Widoczny" value={config.scoreboard.visible} onChange={(v) => update('scoreboard', { visible: v })} />
            <PositionEditor value={config.scoreboard.position} onChange={(p) => update('scoreboard', { position: p })} />
            <Separator />
            <SliderInput label="Szerokość belki" value={config.scoreboard.coverWidth ?? 740} onValueChange={(v) => update('scoreboard', { coverWidth: v })} min={400} max={1600} unit="px" />
            <SliderInput label="Wysokość belki" value={config.scoreboard.coverHeight ?? 76} onValueChange={(v) => update('scoreboard', { coverHeight: v })} min={48} max={200} unit="px" />
            {lockedNotice}
          </>
        )}
        {element === 'scoreboard' && !isLocked && (
          <>
            <Toggle label="Widoczny" value={config.scoreboard.visible} onChange={(v) => update('scoreboard', { visible: v })} />
            <PositionEditor value={config.scoreboard.position} onChange={(p) => update('scoreboard', { position: p })} />
            <Separator />
            <SliderInput label="Odstęp między kafelkami" value={config.scoreboard.gap} onValueChange={(v) => update('scoreboard', { gap: v })} min={0} max={64} unit="px" />
            <SliderInput label="Skew (rodzic)" value={config.scoreboard.skewDeg} onValueChange={(v) => update('scoreboard', { skewDeg: v })} min={-30} max={30} unit="°" />
            <SliderInput label="Opacity" value={config.scoreboard.opacity} onValueChange={(v) => update('scoreboard', { opacity: v })} min={0} max={1} step={0.05} />
            <FontInput label="Font (fallback rodzica)" value={config.scoreboard.fontFamily} onChange={(v) => update('scoreboard', { fontFamily: v })} />
            <p className="text-[10px] text-muted-foreground leading-snug">
              Skew i font są dziedziczone przez Wynik Niebieskich/Pomarańczowych/Timer tylko gdy ich pole „Dziedzicz po rodzicu" jest włączone.
            </p>
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
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Wymiary (Fixed Box)</h4>
            <SliderInput label="Szerokość" value={config.timer.width} onValueChange={(v) => update('timer', { width: v })} min={80} max={500} unit="px" />
            <SliderInput label="Wysokość" value={config.timer.height} onValueChange={(v) => update('timer', { height: v })} min={40} max={240} unit="px" />
            <Separator />
            <ColorPicker label="Tło" value={config.timer.background} onChange={(v) => update('timer', { background: v })} />
            <FontInput label="Font" value={config.timer.fontFamily} onChange={(v) => update('timer', { fontFamily: v })} />
            <SliderInput label="Rozmiar fontu" value={config.timer.fontSize} onValueChange={(v) => update('timer', { fontSize: v })} min={20} max={120} unit="px" />
            <ColorPicker label="Kolor tekstu" value={config.timer.textColor} onChange={(v) => update('timer', { textColor: v })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Skew</h4>
            <Toggle label="Dziedzicz skew po Scoreboardzie" value={config.timer.inheritParentSkew} onChange={(v) => update('timer', { inheritParentSkew: v })} />
            {!config.timer.inheritParentSkew && (
              <SliderInput label="Skew (własny)" value={config.timer.skewDeg} onValueChange={(v) => update('timer', { skewDeg: v })} min={-30} max={30} unit="°" />
            )}
            <Separator />
            <Toggle label="Etykieta Overtime" value={config.timer.showOvertimeLabel} onChange={(v) => update('timer', { showOvertimeLabel: v })} />
            <ColorPicker label="Kolor etykiety OT" value={config.timer.overtimeLabelColor} onChange={(v) => update('timer', { overtimeLabelColor: v })} />
            <Separator />
            <GlowEditor value={config.timer.glow} onChange={(v) => update('timer', { glow: v })} />
          </>
        )}

        {element === 'boostBar' && isLocked && (
          <>
            <Toggle label="Widoczne" value={config.boostBar.visible} onChange={(v) => update('boostBar', { visible: v })} />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja lewy stack</h4>
            <PositionEditor value={config.boostBar.positionLeft} onChange={(p) => update('boostBar', { positionLeft: p })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja prawy stack</h4>
            <PositionEditor value={config.boostBar.positionRight} onChange={(p) => update('boostBar', { positionRight: p })} />
            {lockedNotice}
          </>
        )}
        {element === 'boostBar' && !isLocked && (
          <>
            <Toggle label="Widoczne" value={config.boostBar.visible} onChange={(v) => update('boostBar', { visible: v })} />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja lewy stack</h4>
            <PositionEditor value={config.boostBar.positionLeft} onChange={(p) => update('boostBar', { positionLeft: p })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja prawy stack</h4>
            <PositionEditor value={config.boostBar.positionRight} onChange={(p) => update('boostBar', { positionRight: p })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Wymiary (Fixed Box)</h4>
            <SliderInput label="Szerokość paska" value={config.boostBar.width} onValueChange={(v) => update('boostBar', { width: v })} min={180} max={500} unit="px" />
            <SliderInput label="Wysokość kafelka gracza" value={config.boostBar.cardHeight} onValueChange={(v) => update('boostBar', { cardHeight: v })} min={32} max={160} unit="px" />
            <SliderInput label="Wysokość paska boost" value={config.boostBar.barHeight} onValueChange={(v) => update('boostBar', { barHeight: v })} min={2} max={32} unit="px" />
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
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Statystyki w pasku</h4>
            <Toggle label="Gole" value={config.boostBar.stats.goals} onChange={(v) => update('boostBar', { stats: { ...config.boostBar.stats, goals: v } })} />
            <Toggle label="Asysty" value={config.boostBar.stats.assists} onChange={(v) => update('boostBar', { stats: { ...config.boostBar.stats, assists: v } })} />
            <Toggle label="Obrony" value={config.boostBar.stats.saves} onChange={(v) => update('boostBar', { stats: { ...config.boostBar.stats, saves: v } })} />
            <Toggle label="Strzały" value={config.boostBar.stats.shots} onChange={(v) => update('boostBar', { stats: { ...config.boostBar.stats, shots: v } })} />
            <Toggle label="Demo" value={config.boostBar.stats.demos} onChange={(v) => update('boostBar', { stats: { ...config.boostBar.stats, demos: v } })} />
            <SliderInput label="Rozmiar statystyk" value={config.boostBar.statsFontSize} onValueChange={(v) => update('boostBar', { statsFontSize: v })} min={8} max={20} unit="px" />
            <ColorPicker label="Kolor statystyk" value={config.boostBar.statsColor} onChange={(v) => update('boostBar', { statsColor: v })} />
          </>
        )}

        {element === 'playerCard' && isLocked && (
          <>
            <Toggle label="Widoczna" value={config.playerCard.visible} onChange={(v) => update('playerCard', { visible: v })} />
            <PositionEditor value={config.playerCard.position} onChange={(p) => update('playerCard', { position: p })} />
            <Separator />
            <SliderInput label="Rozmiar ikony rangi" value={config.playerCard.rankIconSize ?? 48} onValueChange={(v) => update('playerCard', { rankIconSize: v })} min={16} max={120} unit="px" />
            <SliderInput label="Ranga - offset X" value={config.playerCard.rankOffsetX ?? 0} onValueChange={(v) => update('playerCard', { rankOffsetX: v })} min={-100} max={100} unit="px" />
            <SliderInput label="Ranga - offset Y" value={config.playerCard.rankOffsetY ?? 0} onValueChange={(v) => update('playerCard', { rankOffsetY: v })} min={-100} max={100} unit="px" />
            {lockedNotice}
          </>
        )}
        {element === 'playerCard' && !isLocked && (
          <>
            <Toggle label="Widoczna" value={config.playerCard.visible} onChange={(v) => update('playerCard', { visible: v })} />
            <PositionEditor value={config.playerCard.position} onChange={(p) => update('playerCard', { position: p })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pokazuj pola</h4>
            <Toggle label="Zdjęcie" value={config.playerCard.fields.photo} onChange={(v) => update('playerCard', { fields: { ...config.playerCard.fields, photo: v } })} />
            <Toggle label="Flaga kraju" value={config.playerCard.fields.country} onChange={(v) => update('playerCard', { fields: { ...config.playerCard.fields, country: v } })} />
            <Toggle label="Ranga" value={config.playerCard.fields.rank} onChange={(v) => update('playerCard', { fields: { ...config.playerCard.fields, rank: v } })} />
            <Toggle label="MMR (watermark)" value={config.playerCard.fields.mmrWatermark} onChange={(v) => update('playerCard', { fields: { ...config.playerCard.fields, mmrWatermark: v } })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pokazuj statystyki</h4>
            <Toggle label="Gole" value={config.playerCard.stats.goals} onChange={(v) => update('playerCard', { stats: { ...config.playerCard.stats, goals: v } })} />
            <Toggle label="Asysty" value={config.playerCard.stats.assists} onChange={(v) => update('playerCard', { stats: { ...config.playerCard.stats, assists: v } })} />
            <Toggle label="Obrony" value={config.playerCard.stats.saves} onChange={(v) => update('playerCard', { stats: { ...config.playerCard.stats, saves: v } })} />
            <Toggle label="Strzały" value={config.playerCard.stats.shots} onChange={(v) => update('playerCard', { stats: { ...config.playerCard.stats, shots: v } })} />
            <Toggle label="Demo" value={config.playerCard.stats.demos} onChange={(v) => update('playerCard', { stats: { ...config.playerCard.stats, demos: v } })} />
            <Toggle label="Boost" value={config.playerCard.stats.boost} onChange={(v) => update('playerCard', { stats: { ...config.playerCard.stats, boost: v } })} />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Wymiary (Fixed Box)</h4>
            <SliderInput label="Szerokość" value={config.playerCard.width} onValueChange={(v) => update('playerCard', { width: v })} min={400} max={1200} unit="px" />
            <SliderInput label="Wysokość" value={config.playerCard.height} onValueChange={(v) => update('playerCard', { height: v })} min={100} max={300} unit="px" />
            <SliderInput label="Skew" value={config.playerCard.skewDeg} onValueChange={(v) => update('playerCard', { skewDeg: v })} min={-30} max={30} unit="°" />
            <ColorPicker label="Kolor obramowania" value={config.playerCard.borderColor} onChange={(v) => update('playerCard', { borderColor: v })} />
            <SliderInput label="Grubość obramowania" value={config.playerCard.borderWidth} onValueChange={(v) => update('playerCard', { borderWidth: v })} min={0} max={8} unit="px" />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient niebiescy (fallback)</h4>
            <OverrideLock active={overrides.hasTeamColorOverride} reason="Nadpisane przez players_registry.team_color">
              <GradientEditor value={config.playerCard.blueGradient} onChange={(v) => update('playerCard', { blueGradient: v })} />
            </OverrideLock>
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient pomarańczowi (fallback)</h4>
            <OverrideLock active={overrides.hasTeamColorOverride} reason="Nadpisane przez players_registry.team_color">
              <GradientEditor value={config.playerCard.orangeGradient} onChange={(v) => update('playerCard', { orangeGradient: v })} />
            </OverrideLock>
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
            <Separator />
            <SliderInput label="Rozmiar ikony rangi" value={config.playerCard.rankIconSize ?? 36} onValueChange={(v) => update('playerCard', { rankIconSize: v })} min={16} max={160} unit="px" />
            <SliderInput label="Ranga - offset X" value={config.playerCard.rankOffsetX ?? 0} onValueChange={(v) => update('playerCard', { rankOffsetX: v })} min={-200} max={200} unit="px" />
            <SliderInput label="Ranga - offset Y" value={config.playerCard.rankOffsetY ?? 0} onValueChange={(v) => update('playerCard', { rankOffsetY: v })} min={-200} max={200} unit="px" />
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja nicku (w karcie)</h4>
            <SliderInput label="Nick - offset X" value={config.playerCard.nickOffsetX ?? 0} onValueChange={(v) => update('playerCard', { nickOffsetX: v })} min={-800} max={800} unit="px" />
            <SliderInput label="Nick - offset Y" value={config.playerCard.nickOffsetY ?? 0} onValueChange={(v) => update('playerCard', { nickOffsetY: v })} min={-400} max={400} unit="px" />
            <p className="text-[10px] text-muted-foreground">Nick może być przesuwany poza obrys karty.</p>
            <Separator />
            <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja statystyk (w karcie)</h4>
            <SliderInput label="Statystyki - offset X" value={config.playerCard.statsOffsetX ?? 0} onValueChange={(v) => update('playerCard', { statsOffsetX: v })} min={-400} max={400} unit="px" />
            <SliderInput label="Statystyki - offset Y" value={config.playerCard.statsOffsetY ?? 0} onValueChange={(v) => update('playerCard', { statsOffsetY: v })} min={-200} max={200} unit="px" />
          </>
        )}

        {element === 'seriesScore' && (
          <>
            <Toggle label="Widoczne" value={config.seriesScore.visible} onChange={(v) => update('seriesScore', { visible: v })} />
            <PositionEditor value={config.seriesScore.position} onChange={(p) => update('seriesScore', { position: p })} />
            <Separator />
            <SliderInput label="Rozmiar kropki" value={config.seriesScore.dotSize} onValueChange={(v) => update('seriesScore', { dotSize: v })} min={6} max={48} unit="px" />
            <SliderInput label="Odstęp kropek" value={config.seriesScore.gap} onValueChange={(v) => update('seriesScore', { gap: v })} min={0} max={32} unit="px" />
            <SliderInput label="Odstęp grup" value={config.seriesScore.groupGap} onValueChange={(v) => update('seriesScore', { groupGap: v })} min={0} max={120} unit="px" />
            <SliderInput label="Skew" value={config.seriesScore.skewDeg} onValueChange={(v) => update('seriesScore', { skewDeg: v })} min={-30} max={30} unit="°" />
            <div className="space-y-2">
              <Label className="text-xs">Kształt</Label>
              <Select value={config.seriesScore.shape} onValueChange={(v) => update('seriesScore', { shape: v as 'circle' | 'square' | 'pill' })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Koło</SelectItem>
                  <SelectItem value="square">Kwadrat</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <ColorPicker label="Kolor niebieskich" value={config.seriesScore.blueColor} onChange={(v) => update('seriesScore', { blueColor: v })} />
            <ColorPicker label="Kolor pomarańczowych" value={config.seriesScore.orangeColor} onChange={(v) => update('seriesScore', { orangeColor: v })} />
            <ColorPicker label="Kolor pustej kropki" value={config.seriesScore.dimColor} onChange={(v) => update('seriesScore', { dimColor: v })} />
            <ColorPicker label="Kolor obramowania" value={config.seriesScore.borderColor} onChange={(v) => update('seriesScore', { borderColor: v })} />
            <Separator />
            <Toggle label="Etykieta (BOx)" value={config.seriesScore.showLabel} onChange={(v) => update('seriesScore', { showLabel: v })} />
            <ColorPicker label="Kolor etykiety" value={config.seriesScore.labelColor} onChange={(v) => update('seriesScore', { labelColor: v })} />
            <SliderInput label="Rozmiar etykiety" value={config.seriesScore.labelFontSize} onValueChange={(v) => update('seriesScore', { labelFontSize: v })} min={8} max={48} unit="px" />
            <FontInput label="Font" value={config.seriesScore.fontFamily} onChange={(v) => update('seriesScore', { fontFamily: v })} />
          </>
        )}

        {element === 'general' && (
          <>
            <Toggle label="Animacje" value={config.general.animationsEnabled} onChange={(v) => update('general', { animationsEnabled: v })} />
            <SliderInput label="Czas animacji" value={config.general.transitionDuration} onValueChange={(v) => update('general', { transitionDuration: v })} min={100} max={1500} step={50} unit="ms" />
            <SliderInput label="Globalna skala" value={config.general.globalScale} onValueChange={(v) => update('general', { globalScale: v })} min={0.5} max={1.5} step={0.05} />
          </>
        )}

        {(element === 'teamNameBlue' || element === 'teamNameOrange') && (
          <TeamNameEditor
            value={element === 'teamNameBlue' ? config.teamNameBlue : config.teamNameOrange}
            onChange={(patch) => update(element, patch)}
            mmrLocked={overrides.hasMmrMatchBinding}
          />
        )}

        {element === 'boostGauge' && (config.general.theme === 'glass' || isLocked) && (
          <>
            <Toggle label="Widoczny" value={config.boostGauge.visible} onChange={(v) => update('boostGauge', { visible: v })} />
            <PositionEditor value={config.boostGauge.position} onChange={(p) => update('boostGauge', { position: p })} />
            <Separator />
            <SliderInput label="Rozmiar tarczy" value={config.boostGauge.size} onValueChange={(v) => update('boostGauge', { size: v })} min={180} max={320} unit="px" />
            <p className="text-[10px] text-muted-foreground leading-snug">
              Pierścień pokazuje boost aktywnego gracza. Kolor wg drużyny; &lt; 10 czerwony, = 100 złoty.
            </p>
            {isLocked && lockedNotice}
          </>
        )}
        {element === 'boostGauge' && config.general.theme !== 'glass' && !isLocked && (
          <p className="text-xs text-muted-foreground leading-snug">
            Wskaźnik boosta (gauge) jest dostępny dla motywów <b>Glass</b>, <b>Y2K CHROME</b> i <b>NEO-BRUTALISM</b>.
            Zmień motyw w sekcji „Ogólne", aby go skonfigurować i wyświetlić w overlay.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TeamNameEditor({
  value,
  onChange,
  mmrLocked,
}: {
  value: TeamNameStyle;
  onChange: (patch: Partial<TeamNameStyle>) => void;
  mmrLocked: boolean;
}) {
  return (
    <>
      <Toggle label="Widoczna" value={value.visible} onChange={(v) => onChange({ visible: v })} />
      <Toggle label="Przyklej do Scoreboardu" value={value.attachToScoreboard} onChange={(v) => onChange({ attachToScoreboard: v })} />
      {value.attachToScoreboard ? (
        <>
          <SliderInput label="Attach offset X" value={value.attachOffsetX} onValueChange={(v) => onChange({ attachOffsetX: v })} min={-400} max={400} unit="px" />
          <SliderInput label="Attach offset Y" value={value.attachOffsetY} onValueChange={(v) => onChange({ attachOffsetY: v })} min={-200} max={200} unit="px" />
        </>
      ) : (
        <PositionEditor value={value.position} onChange={(p) => onChange({ position: p })} />
      )}
      <Separator />
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Wymiary (Fixed Box)</h4>
      <SliderInput label="Szerokość" value={value.width} onValueChange={(v) => onChange({ width: v })} min={80} max={800} unit="px" />
      <SliderInput label="Wysokość" value={value.height} onValueChange={(v) => onChange({ height: v })} min={28} max={240} unit="px" />
      <SliderInput label="Padding X (wewnątrz)" value={value.paddingX} onValueChange={(v) => onChange({ paddingX: v })} min={0} max={120} unit="px" />
      <SliderInput label="Skew (box)" value={value.skewDeg} onValueChange={(v) => onChange({ skewDeg: v })} min={-30} max={30} unit="°" />
      <SliderInput label="Opacity" value={value.opacity} onValueChange={(v) => onChange({ opacity: v })} min={0} max={1} step={0.05} />
      <Separator />
      <FontInput label="Font" value={value.fontFamily} onChange={(v) => onChange({ fontFamily: v })} />
      <SliderInput label="Rozmiar fontu" value={value.fontSize} onValueChange={(v) => onChange({ fontSize: v })} min={12} max={120} unit="px" />
      <SliderInput label="Grubość" value={value.fontWeight} onValueChange={(v) => onChange({ fontWeight: v })} min={300} max={900} step={100} />
      <ColorPicker label="Kolor tekstu" value={value.textColor} onChange={(v) => onChange({ textColor: v })} />
      <SliderInput label="Letter spacing" value={value.letterSpacing} onValueChange={(v) => onChange({ letterSpacing: v })} min={-2} max={20} step={0.5} unit="px" />
      <div className="space-y-2">
        <Label className="text-xs">Wyrównanie tekstu</Label>
        <Select value={value.textAlign} onValueChange={(v) => onChange({ textAlign: v as 'left' | 'center' | 'right' })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Lewo</SelectItem>
            <SelectItem value="center">Środek</SelectItem>
            <SelectItem value="right">Prawo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Toggle label="Wielkie litery" value={value.uppercase} onChange={(v) => onChange({ uppercase: v })} />
      <SliderInput label="Max znaków (0 = bez limitu)" value={value.maxChars} onValueChange={(v) => onChange({ maxChars: v })} min={0} max={40} />
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs">Kształt</Label>
        <Select value={value.shape} onValueChange={(v) => onChange({ shape: v as TeamNameStyle['shape'] })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sharp">Prostokąt</SelectItem>
            <SelectItem value="rounded">Zaokrąglony</SelectItem>
            <SelectItem value="pill">Pill</SelectItem>
            <SelectItem value="parallelogram">Parallelogram (skew)</SelectItem>
            <SelectItem value="hexagon">Hexagon</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <SliderInput label="Border radius" value={value.borderRadius} onValueChange={(v) => onChange({ borderRadius: v })} min={0} max={48} unit="px" />
      <ColorPicker label="Kolor obramowania" value={value.borderColor} onChange={(v) => onChange({ borderColor: v })} />
      <SliderInput label="Grubość obramowania" value={value.borderWidth} onValueChange={(v) => onChange({ borderWidth: v })} min={0} max={8} unit="px" />
      <Separator />
      <OverrideLock active={mmrLocked} reason="Kolor drużyny nadpisywany przez bracket MMRivals">
        <ColorPicker label="Tło (fallback)" value={value.background} onChange={(v) => onChange({ background: v })} />
      </OverrideLock>
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient tła</h4>
      <OverrideLock active={mmrLocked} reason="Kolor drużyny nadpisywany przez bracket MMRivals">
        <GradientEditor value={value.gradient} onChange={(g) => onChange({ gradient: g })} />
      </OverrideLock>
      <Separator />
      <GlowEditor value={value.glow} onChange={(g) => onChange({ glow: g })} />
    </>
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
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Wymiary (Fixed Box)</h4>
      <SliderInput label="Szerokość" value={value.width} onValueChange={(v) => onChange({ width: v })} min={60} max={400} unit="px" />
      <SliderInput label="Wysokość" value={value.height} onValueChange={(v) => onChange({ height: v })} min={40} max={240} unit="px" />
      <Separator />
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Pozycja (Fine-tune)</h4>
      <SliderInput label="Offset X" value={value.offsetX} onValueChange={(v) => onChange({ offsetX: v })} min={-200} max={200} unit="px" />
      <SliderInput label="Offset Y" value={value.offsetY} onValueChange={(v) => onChange({ offsetY: v })} min={-100} max={100} unit="px" />
      <Separator />
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Skew</h4>
      <Toggle label="Dziedzicz skew po Scoreboardzie" value={value.inheritParentSkew} onChange={(v) => onChange({ inheritParentSkew: v })} />
      {!value.inheritParentSkew && (
        <SliderInput label="Skew (własny)" value={value.skewDeg} onValueChange={(v) => onChange({ skewDeg: v })} min={-30} max={30} unit="°" />
      )}
      <Separator />
      <h4 className="text-xs uppercase text-muted-foreground tracking-wider">Gradient tła</h4>
      <GradientEditor value={value.gradient} onChange={(g) => onChange({ gradient: g })} />
      <Separator />
      <GlowEditor value={value.glow} onChange={(g) => onChange({ glow: g })} />
      <Separator />
      <FontInput label="Font" value={value.fontFamily} onChange={(v) => onChange({ fontFamily: v })} />
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
