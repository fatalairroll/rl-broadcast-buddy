import { useState, useEffect } from 'react';
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
import { fetchTournaments, fetchMatches } from '@/lib/mmrivals-api';
import type { PoolData, Tournament, StudioMode } from '@/types/studio';
import type { StudioTheme } from '@/lib/studio-glass-theme';
import { selectablePools, poolTabLabel, isPoolTournament } from '@/lib/pool-utils';
import { Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STREAMER_KEY_LS = 'rlbroadcast.toolKey';

export default function Studio() {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [mode, setMode] = useState<StudioMode>('next_3');
  const [count, setCount] = useState('1');
  const [streamerKey, setStreamerKey] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STREAMER_KEY_LS) ?? '';
  });
  const [keyOpen, setKeyOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !(localStorage.getItem(STREAMER_KEY_LS) ?? '');
  });
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [usePools, setUsePools] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [theme, setTheme] = useState<StudioTheme>(() => {
    if (typeof window === 'undefined') return 'standard';
    return (localStorage.getItem('studio.theme') as StudioTheme) || 'standard';
  });

  useEffect(() => {
    localStorage.setItem('studio.theme', theme);
  }, [theme]);

  useEffect(() => {
    if (streamerKey) localStorage.setItem(STREAMER_KEY_LS, streamerKey);
    else localStorage.removeItem(STREAMER_KEY_LS);
  }, [streamerKey]);

  useEffect(() => {
    fetchTournaments()
      .then((res) => setTournaments(res.tournaments ?? []))
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTournament) {
      setPools([]);
      setUsePools(false);
      setSelectedPool('');
      return;
    }
    let cancelled = false;
    fetchMatches(selectedTournament, 'bracket')
      .then((res) => {
        if (cancelled) return;
        const ps = res.pools ?? [];
        setPools(ps);
        setUsePools(res.use_pools ?? isPoolTournament(ps));
        const first = selectablePools(ps)[0];
        setSelectedPool(first?.pool_id ?? '');
      })
      .catch(() => {
        if (cancelled) return;
        setPools([]);
        setUsePools(false);
        setSelectedPool('');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTournament]);

  const renderUrl = (() => {
    if (!selectedTournament || !streamerKey) return '';
    const params = new URLSearchParams({
      tournament_id: selectedTournament,
      mode,
      count: String(count),
      key: streamerKey,
    });
    if (mode === 'bracket' && usePools && selectedPool) {
      params.set('pool_id', selectedPool);
    }
    if (theme === 'sharp-glass') {
      params.set('theme', 'glass');
    } else if (theme === 'neobrutal') {
      params.set('theme', 'neobrutal');
    }
    return `${window.location.origin}/studio/render?${params.toString()}`;
  })();

  const copyLink = () => {
    if (!renderUrl) return;
    navigator.clipboard.writeText(renderUrl);
    toast({ title: 'Skopiowano link do schowka!' });
  };

  const selectedTournamentData = tournaments.find(
    (t) => t.tournament_id === selectedTournament,
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Studio Overlay</h1>
        <p className="text-muted-foreground">
          Skonfiguruj overlay turniejowy i wygeneruj link do OBS.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Config */}
          <Card>
            <CardHeader>
              <CardTitle>Konfiguracja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tournament select */}
              <div className="space-y-2">
                <Label>Turniej</Label>
                <Select
                  value={selectedTournament}
                  onValueChange={setSelectedTournament}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? 'Ładowanie...' : 'Wybierz turniej'} />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t) => (
                      <SelectItem key={t.tournament_id} value={t.tournament_id}>
                        {t.name} ({t.mode}) — {t.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label>Tryb wyświetlania</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as StudioMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next_3">Następne mecze</SelectItem>
                    <SelectItem value="bracket">Drabinka</SelectItem>
                    <SelectItem value="recent">Zakończone mecze</SelectItem>
                    <SelectItem value="postgame">Podsumowanie</SelectItem>
                  </SelectContent>
                </Select>
                {mode === 'postgame' && (
                  <p className="text-xs text-muted-foreground">
                    Wymaga relay na tym samym PC; dane = ostatni zakończony mecz RL.
                  </p>
                )}
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label>Motyw</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as StudioTheme)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="sharp-glass">Sharp Liquid Glass</SelectItem>
                    <SelectItem value="neobrutal">Neo-Brutalism</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Count */}
              {mode === 'next_3' && (
                <div className="space-y-2">
                  <Label>Ilość meczy</Label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Pool select (bracket only, when use_pools) */}
              {mode === 'bracket' && usePools && selectablePools(pools).length > 0 && (
                <div className="space-y-2">
                  <Label>Pool</Label>
                  <Select value={selectedPool} onValueChange={setSelectedPool}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectablePools(pools).map((p) => (
                        <SelectItem key={p.pool_id} value={p.pool_id}>
                          {poolTabLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Streamer key */}
              <Collapsible open={keyOpen} onOpenChange={setKeyOpen} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Klucz streamera (do URL)</Label>
                  <div className="flex items-center gap-2">
                    {streamerKey && !keyOpen && (
                      <span className="text-xs text-green-400">Klucz zapisany ✓</span>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        {keyOpen ? 'Ukryj' : 'Zmień klucz'}
                        <ChevronDown
                          className={`ml-1 h-3 w-3 transition-transform ${keyOpen ? 'rotate-180' : ''}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="space-y-2">
                  <Input
                    value={streamerKey}
                    onChange={(e) => setStreamerKey(e.target.value)}
                    placeholder="Wpisz swój klucz autoryzacji"
                  />
                  {streamerKey && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStreamerKey('')}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Wyczyść zapisany klucz
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* OBS link */}
              {renderUrl && (
                <div className="space-y-2">
                  <Label>Link do OBS</Label>
                  <div className="flex gap-2">
                    <Input value={renderUrl} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={copyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={renderUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader>
              <CardTitle>
                Podgląd Live
                {selectedTournamentData && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    — {selectedTournamentData.name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
                  <iframe
                    src={renderUrl}
                    className="absolute inset-0 h-full w-full"
                    title="Overlay Preview"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                  Wybierz turniej i wpisz klucz, aby zobaczyć podgląd
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
