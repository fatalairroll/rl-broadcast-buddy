import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOverlayPresets } from '@/hooks/useBroadcast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Gamepad2,
  ArrowLeft,
  Save,
  Eye,
  Layout,
  Circle,
  BarChart3,
  Settings2,
  Plus,
  Trash2,
} from 'lucide-react';
import type { OverlayConfig, OverlayPreset } from '@/types/broadcast';
import { defaultOverlayConfig } from '@/types/broadcast';

export default function Creator() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { presets, createPreset, updatePreset, deletePreset } = useOverlayPresets();

  const [config, setConfig] = useState<OverlayConfig>(defaultOverlayConfig);
  const [presetName, setPresetName] = useState('Nowy preset');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const updateConfig = <K extends keyof OverlayConfig>(
    section: K,
    updates: Partial<OverlayConfig[K]>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  const handleSavePreset = async () => {
    if (selectedPresetId) {
      const { error } = await updatePreset(selectedPresetId, { config });
      if (error) {
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać presetu.' });
      } else {
        toast({ title: 'Zapisano', description: 'Preset został zaktualizowany.' });
      }
    } else {
      const { error } = await createPreset({
        name: presetName,
        config,
        is_default: false,
      });
      if (error) {
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się utworzyć presetu.' });
      } else {
        toast({ title: 'Utworzono', description: 'Nowy preset został utworzony.' });
      }
    }
  };

  const handleLoadPreset = (preset: OverlayPreset) => {
    setConfig(preset.config);
    setPresetName(preset.name);
    setSelectedPresetId(preset.id);
  };

  const handleDeletePreset = async (id: string) => {
    const { error } = await deletePreset(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć presetu.' });
    } else {
      if (selectedPresetId === id) {
        setSelectedPresetId(null);
        setConfig(defaultOverlayConfig);
        setPresetName('Nowy preset');
      }
      toast({ title: 'Usunięto', description: 'Preset został usunięty.' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Brak dostępu</h1>
          <p className="text-muted-foreground mb-4">Tylko administratorzy mogą korzystać z kreatora.</p>
          <Button onClick={() => navigate('/dashboard')}>Wróć do Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Gamepad2 className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Kreator Overlay</h1>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-48"
              placeholder="Nazwa presetu"
            />
            <Button onClick={handleSavePreset}>
              <Save className="mr-2 h-4 w-4" />
              Zapisz
            </Button>
            <Button variant="outline" onClick={() => window.open('/overlay', '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              Podgląd
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 grid grid-cols-4 gap-6">
        {/* Presets Sidebar */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Presety
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedPresetId(null);
                  setConfig(defaultOverlayConfig);
                  setPresetName('Nowy preset');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedPresetId === preset.id ? 'bg-primary/20' : 'hover:bg-secondary'
                }`}
                onClick={() => handleLoadPreset(preset)}
              >
                <span className="text-sm truncate">{preset.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePreset(preset.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {presets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak zapisanych presetów
              </p>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="col-span-3">
          <Tabs defaultValue="scoreboard">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="scoreboard">
                <Layout className="mr-2 h-4 w-4" />
                Scoreboard
              </TabsTrigger>
              <TabsTrigger value="boostBars">
                <BarChart3 className="mr-2 h-4 w-4" />
                Boost graczy
              </TabsTrigger>
              <TabsTrigger value="boostCircle">
                <Circle className="mr-2 h-4 w-4" />
                Wskaźnik
              </TabsTrigger>
              <TabsTrigger value="playerStats">
                <Settings2 className="mr-2 h-4 w-4" />
                Statystyki
              </TabsTrigger>
              <TabsTrigger value="general">
                <Settings2 className="mr-2 h-4 w-4" />
                Ogólne
              </TabsTrigger>
            </TabsList>

            {/* Scoreboard Tab */}
            <TabsContent value="scoreboard" className="space-y-4 mt-4">
              <Card className="glass-panel">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Widoczny</Label>
                    <Switch
                      checked={config.scoreboard.visible}
                      onCheckedChange={(v) => updateConfig('scoreboard', { visible: v })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pozycja X (%)</Label>
                      <Slider
                        value={[config.scoreboard.position.x]}
                        onValueChange={([v]) =>
                          updateConfig('scoreboard', {
                            position: { ...config.scoreboard.position, x: v },
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pozycja Y (%)</Label>
                      <Slider
                        value={[config.scoreboard.position.y]}
                        onValueChange={([v]) =>
                          updateConfig('scoreboard', {
                            position: { ...config.scoreboard.position, y: v },
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Szerokość</Label>
                      <Slider
                        value={[config.scoreboard.width]}
                        onValueChange={([v]) => updateConfig('scoreboard', { width: v })}
                        min={300}
                        max={1000}
                        step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wysokość</Label>
                      <Slider
                        value={[config.scoreboard.height]}
                        onValueChange={([v]) => updateConfig('scoreboard', { height: v })}
                        min={40}
                        max={150}
                        step={5}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Zaokrąglenie</Label>
                    <Slider
                      value={[config.scoreboard.borderRadius]}
                      onValueChange={([v]) => updateConfig('scoreboard', { borderRadius: v })}
                      min={0}
                      max={30}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rozmiar czcionki</Label>
                    <Slider
                      value={[config.scoreboard.fontSize]}
                      onValueChange={([v]) => updateConfig('scoreboard', { fontSize: v })}
                      min={12}
                      max={48}
                      step={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Pokaż timer</Label>
                      <Switch
                        checked={config.scoreboard.showTimer}
                        onCheckedChange={(v) => updateConfig('scoreboard', { showTimer: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Pokaż wynik serii</Label>
                      <Switch
                        checked={config.scoreboard.showSeriesScore}
                        onCheckedChange={(v) => updateConfig('scoreboard', { showSeriesScore: v })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Boost Bars Tab */}
            <TabsContent value="boostBars" className="space-y-4 mt-4">
              <Card className="glass-panel">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Widoczny</Label>
                    <Switch
                      checked={config.boostBars.visible}
                      onCheckedChange={(v) => updateConfig('boostBars', { visible: v })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Szerokość</Label>
                      <Slider
                        value={[config.boostBars.width]}
                        onValueChange={([v]) => updateConfig('boostBars', { width: v })}
                        min={150}
                        max={400}
                        step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wysokość paska</Label>
                      <Slider
                        value={[config.boostBars.barHeight]}
                        onValueChange={([v]) => updateConfig('boostBars', { barHeight: v })}
                        min={4}
                        max={20}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Nazwy graczy</Label>
                      <Switch
                        checked={config.boostBars.showPlayerNames}
                        onCheckedChange={(v) => updateConfig('boostBars', { showPlayerNames: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Wartość boosta</Label>
                      <Switch
                        checked={config.boostBars.showBoostValue}
                        onCheckedChange={(v) => updateConfig('boostBars', { showBoostValue: v })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Prędkość animacji (ms)</Label>
                    <Slider
                      value={[config.boostBars.animationSpeed]}
                      onValueChange={([v]) => updateConfig('boostBars', { animationSpeed: v })}
                      min={50}
                      max={500}
                      step={10}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Boost Circle Tab */}
            <TabsContent value="boostCircle" className="space-y-4 mt-4">
              <Card className="glass-panel">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Widoczny</Label>
                    <Switch
                      checked={config.boostCircle.visible}
                      onCheckedChange={(v) => updateConfig('boostCircle', { visible: v })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pozycja X (%)</Label>
                      <Slider
                        value={[config.boostCircle.position.x]}
                        onValueChange={([v]) =>
                          updateConfig('boostCircle', {
                            position: { ...config.boostCircle.position, x: v },
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pozycja Y (%)</Label>
                      <Slider
                        value={[config.boostCircle.position.y]}
                        onValueChange={([v]) =>
                          updateConfig('boostCircle', {
                            position: { ...config.boostCircle.position, y: v },
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rozmiar</Label>
                      <Slider
                        value={[config.boostCircle.size]}
                        onValueChange={([v]) => updateConfig('boostCircle', { size: v })}
                        min={60}
                        max={200}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grubość obramowania</Label>
                      <Slider
                        value={[config.boostCircle.strokeWidth]}
                        onValueChange={([v]) => updateConfig('boostCircle', { strokeWidth: v })}
                        min={2}
                        max={20}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Pokaż wartość</Label>
                    <Switch
                      checked={config.boostCircle.showValue}
                      onCheckedChange={(v) => updateConfig('boostCircle', { showValue: v })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Player Stats Tab */}
            <TabsContent value="playerStats" className="space-y-4 mt-4">
              <Card className="glass-panel">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Widoczny</Label>
                    <Switch
                      checked={config.playerStats.visible}
                      onCheckedChange={(v) => updateConfig('playerStats', { visible: v })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pozycja X (%)</Label>
                      <Slider
                        value={[config.playerStats.position.x]}
                        onValueChange={([v]) =>
                          updateConfig('playerStats', {
                            position: { ...config.playerStats.position, x: v },
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pozycja Y (%)</Label>
                      <Slider
                        value={[config.playerStats.position.y]}
                        onValueChange={([v]) =>
                          updateConfig('playerStats', {
                            position: { ...config.playerStats.position, y: v },
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Goals</Label>
                      <Switch
                        checked={config.playerStats.showGoals}
                        onCheckedChange={(v) => updateConfig('playerStats', { showGoals: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Assists</Label>
                      <Switch
                        checked={config.playerStats.showAssists}
                        onCheckedChange={(v) => updateConfig('playerStats', { showAssists: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Saves</Label>
                      <Switch
                        checked={config.playerStats.showSaves}
                        onCheckedChange={(v) => updateConfig('playerStats', { showSaves: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Shots</Label>
                      <Switch
                        checked={config.playerStats.showShots}
                        onCheckedChange={(v) => updateConfig('playerStats', { showShots: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Score</Label>
                      <Switch
                        checked={config.playerStats.showScore}
                        onCheckedChange={(v) => updateConfig('playerStats', { showScore: v })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <Card className="glass-panel">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Animacje włączone</Label>
                    <Switch
                      checked={config.general.animationsEnabled}
                      onCheckedChange={(v) => updateConfig('general', { animationsEnabled: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Czas przejścia (ms)</Label>
                    <Slider
                      value={[config.general.transitionDuration]}
                      onValueChange={([v]) => updateConfig('general', { transitionDuration: v })}
                      min={50}
                      max={500}
                      step={10}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
