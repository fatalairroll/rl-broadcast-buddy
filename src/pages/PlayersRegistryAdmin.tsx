import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RANK_TIERS } from '@/lib/rank-utils';
import { RankIcon } from '@/components/studio/RankIcon';
import type { PlayerRegistry } from '@/types/livestats';

const EMPTY: PlayerRegistry = {
  player_name: '',
  display_name: null,
  photo_url: null,
  country_code: null,
  rank_name: null,
  mmr: null,
  team_color: null,
  notes: null,
};

export default function PlayersRegistryAdmin() {
  const { toast } = useToast();
  const [rows, setRows] = useState<PlayerRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlayerRegistry>(EMPTY);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players_registry')
      .select('*')
      .order('player_name');
    if (error) {
      toast({ title: 'Błąd ładowania', description: error.message, variant: 'destructive' });
    } else {
      setRows((data ?? []) as PlayerRegistry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setDraft(EMPTY);
    setEditingKey(null);
    setOpen(true);
  };

  const startEdit = (row: PlayerRegistry) => {
    setDraft({ ...row });
    setEditingKey(row.player_name);
    setOpen(true);
  };

  const save = async () => {
    if (!draft.player_name.trim()) {
      toast({ title: 'player_name wymagany', variant: 'destructive' });
      return;
    }
    const payload = {
      ...draft,
      player_name: draft.player_name.trim(),
      display_name: draft.display_name?.trim() || null,
      photo_url: draft.photo_url?.trim() || null,
      country_code: draft.country_code?.trim().toLowerCase() || null,
      rank_name: draft.rank_name || null,
      team_color: draft.team_color?.trim() || null,
      notes: draft.notes?.trim() || null,
      mmr: draft.mmr === null || draft.mmr === undefined ? null : Number(draft.mmr),
    };

    const { error } = await supabase
      .from('players_registry')
      .upsert(payload, { onConflict: 'player_name' });

    if (error) {
      toast({ title: 'Błąd zapisu', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingKey ? 'Zaktualizowano' : 'Dodano gracza' });
    setOpen(false);
    load();
  };

  const remove = async (player_name: string) => {
    if (!confirm(`Usunąć gracza ${player_name}?`)) return;
    const { error } = await supabase
      .from('players_registry')
      .delete()
      .eq('player_name', player_name);
    if (error) {
      toast({ title: 'Błąd usuwania', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Usunięto' });
    load();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Players Registry <span className="text-primary">V2</span>
            </h1>
          </div>
          <Button onClick={startCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj gracza
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          Opcjonalny słownik wzbogacający Player Card V2 (zdjęcie, ranga, flaga). Klucz{' '}
          <code className="bg-muted px-1 py-0.5 rounded">player_name</code> musi być{' '}
          <strong>dokładnie</strong> taki, jaki gracz ma w Rocket League. Brak dopasowania nie psuje
          overlaya — pokażą się same surowe dane z gry.
        </p>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">Player</th>
                <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">Display</th>
                <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">Country</th>
                <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">Rank</th>
                <th className="px-4 py-3 font-bold uppercase text-xs tracking-wider">MMR</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Ładowanie…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Brak graczy. Kliknij „Dodaj gracza".
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.player_name} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{r.player_name}</td>
                    <td className="px-4 py-3">{r.display_name ?? '—'}</td>
                    <td className="px-4 py-3 uppercase">{r.country_code ?? '—'}</td>
                    <td className="px-4 py-3">
                      {r.rank_name ? (
                        <div className="flex items-center gap-2">
                          <RankIcon rank={r.rank_name} size="sm" />
                          <span className="text-xs">{r.rank_name}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.mmr ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(r.player_name)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingKey ? 'Edytuj gracza' : 'Nowy gracz'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>player_name (dokładny nick z gry) *</Label>
              <Input
                value={draft.player_name}
                disabled={!!editingKey}
                onChange={(e) => setDraft({ ...draft, player_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Display name</Label>
              <Input
                value={draft.display_name ?? ''}
                onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input
                value={draft.photo_url ?? ''}
                onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Country code (ISO-2)</Label>
                <Input
                  maxLength={2}
                  value={draft.country_code ?? ''}
                  onChange={(e) => setDraft({ ...draft, country_code: e.target.value })}
                />
              </div>
              <div>
                <Label>MMR</Label>
                <Input
                  type="number"
                  value={draft.mmr ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      mmr: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Rank</Label>
              <Select
                value={draft.rank_name ?? ''}
                onValueChange={(v) => setDraft({ ...draft, rank_name: v || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz rangę…" />
                </SelectTrigger>
                <SelectContent>
                  {RANK_TIERS.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team color (hex / hsl, opcjonalnie)</Label>
              <Input
                placeholder="#3B82F6"
                value={draft.team_color ?? ''}
                onChange={(e) => setDraft({ ...draft, team_color: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={draft.notes ?? ''}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={save}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}