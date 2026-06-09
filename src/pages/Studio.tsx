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
import { fetchTournaments } from '@/lib/mmrivals-api';
import type { Tournament, StudioMode } from '@/types/studio';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Studio() {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [mode, setMode] = useState<StudioMode>('next_3');
  const [count, setCount] = useState('1');
  const [streamerKey, setStreamerKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments()
      .then((res) => setTournaments(res.tournaments ?? []))
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, []);

  const renderUrl = (() => {
    if (!selectedTournament || !streamerKey) return '';
    const params = new URLSearchParams({
      tournament_id: selectedTournament,
      mode,
      count: String(count),
      key: streamerKey,
    });
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

              {/* Streamer key */}
              <div className="space-y-2">
                <Label>Klucz streamera (do URL)</Label>
                <Input
                  value={streamerKey}
                  onChange={(e) => setStreamerKey(e.target.value)}
                  placeholder="Wpisz swój klucz autoryzacji"
                />
              </div>

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
