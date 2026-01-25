import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverlayPresets } from '@/hooks/useBroadcast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Gamepad2,
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import type { OverlayConfig, OverlayPreset, EditableElement } from '@/types/broadcast';
import { defaultOverlayConfig } from '@/types/broadcast';
import { ElementList } from '@/components/creator/ElementList';
import { StyleEditor } from '@/components/creator/StyleEditor';
import { OverlayPreview } from '@/components/creator/OverlayPreview';

export default function Creator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { presets, createPreset, updatePreset, deletePreset } = useOverlayPresets();

  const [config, setConfig] = useState<OverlayConfig>(defaultOverlayConfig);
  const [presetName, setPresetName] = useState('Nowy preset');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>('scoreboard');

  const updateConfig = <K extends keyof OverlayConfig>(
    section: K,
    updates: Partial<OverlayConfig[K]>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  const handleToggleVisibility = (element: EditableElement, visible: boolean) => {
    updateConfig(element, { visible } as Partial<OverlayConfig[typeof element]>);
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

  const handleResetConfig = () => {
    setConfig(defaultOverlayConfig);
    setSelectedPresetId(null);
    setPresetName('Nowy preset');
    toast({ title: 'Zresetowano', description: 'Przywrócono domyślne ustawienia.' });
  };

  const handleNewPreset = () => {
    setSelectedPresetId(null);
    setConfig(defaultOverlayConfig);
    setPresetName('Nowy preset');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Gamepad2 className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold">Kreator Overlay</h1>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-40 h-9"
              placeholder="Nazwa presetu"
            />
            <Button size="sm" onClick={handleSavePreset}>
              <Save className="mr-2 h-4 w-4" />
              Zapisz
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetConfig}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.open('/overlay', '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              Podgląd
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container py-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Presets */}
          <div className="col-span-2">
            <Card className="h-full border-border/50 bg-card/50">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  Presety
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewPreset}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 py-0">
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="space-y-1 px-2">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPresetId === preset.id ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => handleLoadPreset(preset)}
                      >
                        <span className="text-sm truncate flex-1">{preset.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
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
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Brak zapisanych presetów
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Center - Preview */}
          <div className="col-span-6 flex flex-col gap-4">
            <Card className="flex-1 border-border/50 bg-card/50">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Podgląd na żywo</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <OverlayPreview
                  config={config}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                />
              </CardContent>
            </Card>

            {/* Element List below preview */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Elementy</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ElementList
                  config={config}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onToggleVisibility={handleToggleVisibility}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Style Editor */}
          <div className="col-span-4">
            <ScrollArea className="h-[calc(100vh-120px)]">
              {selectedElement ? (
                <StyleEditor
                  element={selectedElement}
                  config={config}
                  onChange={updateConfig}
                />
              ) : (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Wybierz element z listy lub kliknij na podglądzie, aby edytować jego styl.
                    </p>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
