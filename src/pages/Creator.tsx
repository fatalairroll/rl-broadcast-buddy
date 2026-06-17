import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Plus,
  Trash2,
  Star,
  RotateCcw,
} from 'lucide-react';
import {
  defaultOverlayV2Config,
  type OverlayV2Config,
  type V2EditableElement,
} from '@/types/overlayV2';
import { useV2Presets } from '@/hooks/useOverlayV2Config';
import { ensureGlassPreset } from '@/lib/v2-glass-preset';
import { ensureY2kPreset } from '@/lib/v2-y2k-preset';
import { ElementListV2 } from '@/components/creator/ElementListV2';
import { StyleEditorV2 } from '@/components/creator/StyleEditorV2';
import { V2Preview } from '@/components/creator/V2Preview';
import { BroadcastControlsPanel } from '@/components/creator/BroadcastControlsPanel';

export default function Creator() {
  const { toast } = useToast();
  const { presets, createPreset, updatePreset, deletePreset, setDefault } = useV2Presets();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [config, setConfig] = useState<OverlayV2Config>(defaultOverlayV2Config);
  const [name, setName] = useState('Nowy preset');
  const [element, setElement] = useState<V2EditableElement>('scoreboard');
  const [previewMode, setPreviewMode] = useState<'mock' | 'live'>('mock');
  const [dirty, setDirty] = useState(false);

  // Bootstrap systemowe presety (GLASS, Y2K) once if missing.
  const [presetsEnsured, setPresetsEnsured] = useState(false);
  useEffect(() => {
    if (presetsEnsured || presets.length === 0) return;
    setPresetsEnsured(true);
    ensureGlassPreset(presets, createPreset, updatePreset);
    ensureY2kPreset(presets, createPreset, updatePreset);
  }, [presets, createPreset, updatePreset, presetsEnsured]);

  // Load default preset on mount
  useEffect(() => {
    if (selectedId || presets.length === 0) return;
    const def = presets.find((p) => p.is_default) ?? presets[0];
    setSelectedId(def.id);
    setConfig(def.config);
    setName(def.name);
    setDirty(false);
  }, [presets, selectedId]);

  const selected = useMemo(() => presets.find((p) => p.id === selectedId) ?? null, [presets, selectedId]);

  const handleLoad = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setSelectedId(id);
    setConfig(p.config);
    setName(p.name);
    setDirty(false);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    const { error } = await updatePreset(selectedId, { name, config });
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd zapisu', description: error.message });
    } else {
      toast({ title: 'Zapisano', description: `Preset "${name}" zaktualizowany.` });
      setDirty(false);
    }
  };

  const handleSaveAs = async () => {
    const { data, error } = await createPreset(`${name} (kopia)`, config);
    if (error || !data) {
      toast({ variant: 'destructive', title: 'Błąd', description: error?.message ?? 'Nie udało się utworzyć presetu' });
      return;
    }
    toast({ title: 'Utworzono', description: `Preset "${data.name}" zapisany.` });
    setSelectedId(data.id);
    setName(data.name);
    setDirty(false);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm(`Usunąć preset "${name}"?`)) return;
    const { error } = await deletePreset(selectedId);
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd', description: error.message });
    } else {
      toast({ title: 'Usunięto' });
      setSelectedId(null);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedId) return;
    const { error } = await setDefault(selectedId);
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd', description: error.message });
    } else {
      toast({ title: 'Ustawiono jako domyślny' });
    }
  };

  const handleReset = () => {
    if (!confirm('Przywrócić wszystkie pola do wartości domyślnych?')) return;
    setConfig(defaultOverlayV2Config);
    setDirty(true);
  };

  const handleConfigChange = (next: OverlayV2Config) => {
    setConfig(next);
    setDirty(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: presets + elements */}
        <aside className="w-72 border-r border-border bg-card/30 overflow-y-auto p-4 space-y-4 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span>Preset</span>
                {dirty && <span className="text-xs font-normal text-amber-500">• niezapisane zmiany</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedId ?? ''} onValueChange={handleLoad}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz preset..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.length === 0 ? (
                    <SelectItem value="__empty__" disabled>Brak presetów</SelectItem>
                  ) : (
                    presets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.is_default && ' ★'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <div className="space-y-1">
                <Label className="text-xs">Nazwa</Label>
                <Input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} className="h-8 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={handleSave} disabled={!selectedId || !dirty}>
                  <Save className="mr-1 h-3 w-3" />
                  Zapisz
                </Button>
                <Button size="sm" variant="outline" onClick={handleSaveAs}>
                  <Plus className="mr-1 h-3 w-3" />
                  Jako nowy
                </Button>
                <Button size="sm" variant="outline" onClick={handleSetDefault} disabled={!selectedId || selected?.is_default}>
                  <Star className="mr-1 h-3 w-3" />
                  Domyślny
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
                <Button size="sm" variant="destructive" className="col-span-2" onClick={handleDelete} disabled={!selectedId}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Usuń preset
                </Button>
              </div>
            </CardContent>
          </Card>

          <ElementListV2 selected={element} onSelect={setElement} />
        </aside>

        {/* Center: live preview */}
        <main className="flex-1 overflow-auto p-6 bg-grid-pattern flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'mock' | 'live')}>
              <TabsList>
                <TabsTrigger value="mock">Mock</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="border border-border shadow-2xl">
            <V2Preview config={config} mode={previewMode} scale={0.5} />
          </div>
          {previewMode === 'live' && <BroadcastControlsPanel />}
        </main>

        {/* Right column: style editor */}
        <aside className="w-80 border-l border-border bg-card/30 shrink-0">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-4">
              <StyleEditorV2 config={config} element={element} onChange={handleConfigChange} />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
