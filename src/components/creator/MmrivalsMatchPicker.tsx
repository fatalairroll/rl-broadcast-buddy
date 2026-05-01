import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, Wand2, Unlink2 } from 'lucide-react';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { fetchTournaments } from '@/lib/mmrivals-api';
import { useMmrivalsBracket, findMatchById } from '@/hooks/useMmrivalsMatchData';
import { autoPair, flattenMatchPlayers, type PairingMap } from '@/lib/player-matching';
import type { Tournament, MatchData } from '@/types/studio';
import { useToast } from '@/hooks/use-toast';

export function MmrivalsMatchPicker() {
  const { session, updateSession } = useBroadcast();
  const live = useLiveStatsV2();
  const { toast } = useToast();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingT, setLoadingT] = useState(true);

  useEffect(() => {
    fetchTournaments()
      .then((r) => setTournaments(r.tournaments ?? []))
      .catch(() => setTournaments([]))
      .finally(() => setLoadingT(false));
  }, []);

  const tournamentId = session?.mmr_tournament_id ?? null;
  const matchId = session?.mmr_match_id ?? null;
  const { matches, loading: loadingM } = useMmrivalsBracket(tournamentId);

  const rounds = useMemo(() => {
    const map = new Map<number, MatchData[]>();
    for (const m of matches) {
      const r = m.round_index ?? 0;
      const arr = map.get(r) ?? [];
      arr.push(m);
      map.set(r, arr);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, list]) => ({ round, list }));
  }, [matches]);

  const currentMatch = findMatchById(matches, matchId);
  const currentRound = currentMatch?.round_index ?? null;
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  useEffect(() => {
    if (currentRound != null) setSelectedRound(currentRound);
  }, [currentRound]);

  const matchesInRound = useMemo(() => {
    if (selectedRound == null) return [];
    return rounds.find((r) => r.round === selectedRound)?.list ?? [];
  }, [rounds, selectedRound]);

  const candidates = useMemo(() => flattenMatchPlayers(currentMatch), [currentMatch]);
  const liveNames = useMemo(() => live.players.map((p) => p.player_name), [live.players]);

  const pairings: PairingMap = (session?.player_pairings ?? {}) as PairingMap;

  const handleSelectTournament = (id: string) => {
    updateSession({
      mmr_tournament_id: id,
      mmr_match_id: null,
      mmr_team_a_id: null,
      mmr_team_b_id: null,
      player_pairings: {},
    });
    setSelectedRound(null);
  };

  const handleSelectRound = (v: string) => {
    setSelectedRound(Number(v));
  };

  const handleSelectMatch = (id: string) => {
    const m = findMatchById(matches, id);
    if (!m) return;
    const newPairings = autoPair(liveNames, flattenMatchPlayers(m));
    updateSession({
      mmr_match_id: m.match_id,
      mmr_team_a_id: m.team_a?.team_id ?? null,
      mmr_team_b_id: m.team_b?.team_id ?? null,
      team_a_name: m.team_a?.name ?? session?.team_a_name,
      team_b_name: m.team_b?.name ?? session?.team_b_name,
      player_pairings: newPairings,
    });
    toast({
      title: 'Wczytano mecz z MMRivals',
      description: `Sparowano ${Object.keys(newPairings).length} z ${liveNames.length} graczy`,
    });
  };

  const handleAutoPair = () => {
    if (!currentMatch) return;
    const newPairings = autoPair(liveNames, candidates);
    updateSession({ player_pairings: newPairings });
    toast({
      title: 'Sparowano automatycznie',
      description: `${Object.keys(newPairings).length} z ${liveNames.length} graczy`,
    });
  };

  const handleManualSet = (playerName: string, discordId: string) => {
    const next = { ...pairings };
    if (discordId === '__none__') {
      delete next[playerName];
    } else {
      next[playerName] = { discord_id: discordId, status: 'manual' };
    }
    updateSession({ player_pairings: next });
  };

  const handleUnlink = () => {
    updateSession({
      mmr_match_id: null,
      mmr_team_a_id: null,
      mmr_team_b_id: null,
      player_pairings: {},
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">MMRivals</CardTitle>
        {currentMatch && (
          <Button size="sm" variant="ghost" onClick={handleUnlink}>
            <Unlink2 className="mr-1 h-3 w-3" /> Odepnij
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tournament */}
        <div className="space-y-1">
          <Label className="text-xs">Turniej</Label>
          <Select
            value={tournamentId ?? ''}
            onValueChange={handleSelectTournament}
            disabled={loadingT}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingT ? 'Ładowanie...' : 'Wybierz turniej'} />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (
                <SelectItem key={t.tournament_id} value={t.tournament_id}>
                  {t.name} ({t.mode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Round */}
        <div className="space-y-1">
          <Label className="text-xs">Runda</Label>
          <Select
            value={selectedRound != null ? String(selectedRound) : ''}
            onValueChange={handleSelectRound}
            disabled={!tournamentId || loadingM || rounds.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingM ? 'Ładowanie...' : 'Wybierz rundę'} />
            </SelectTrigger>
            <SelectContent>
              {rounds.map(({ round, list }) => (
                <SelectItem key={round} value={String(round)}>
                  Runda {round + 1} ({list.length} mecz{list.length === 1 ? '' : 'y'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Match */}
        <div className="space-y-1">
          <Label className="text-xs">Mecz</Label>
          <Select
            value={matchId ?? ''}
            onValueChange={handleSelectMatch}
            disabled={selectedRound == null || matchesInRound.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz mecz" />
            </SelectTrigger>
            <SelectContent>
              {matchesInRound.map((m) => {
                const aCap = m.team_a?.players?.[0];
                const bCap = m.team_b?.players?.[0];
                const aLabel = m.team_a?.name ?? '?';
                const bLabel = m.team_b?.name ?? '?';
                const aNick = aCap ? aCap.nick_in_game ?? aCap.nick : null;
                const bNick = bCap ? bCap.nick_in_game ?? bCap.nick : null;
                return (
                  <SelectItem key={m.match_id} value={m.match_id}>
                    {aLabel} vs {bLabel}
                    {(aNick || bNick) && (
                      <span className="opacity-60"> — {aNick ?? '?'} / {bNick ?? '?'}</span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Pairings */}
        {currentMatch && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Parowanie graczy ({liveNames.length} w grze)</Label>
              <Button size="sm" variant="ghost" onClick={handleAutoPair}>
                <Wand2 className="mr-1 h-3 w-3" /> Auto
              </Button>
            </div>
            {liveNames.length === 0 ? (
              <p className="text-xs text-muted-foreground">Brak graczy w grze.</p>
            ) : (
              <ScrollArea className="max-h-48 pr-2">
                <div className="space-y-1.5">
                  {liveNames.map((name) => {
                    const entry = pairings[name];
                    const status = entry?.status ?? 'none';
                    const dotClass =
                      status === 'auto'
                        ? 'bg-green-500'
                        : status === 'manual'
                          ? 'bg-amber-500'
                          : 'bg-muted-foreground/40';
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                        <span className="text-xs font-mono w-28 truncate" title={name}>
                          {name}
                        </span>
                        <Select
                          value={entry?.discord_id ?? '__none__'}
                          onValueChange={(v) => handleManualSet(name, v)}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— brak parowania —</SelectItem>
                            {candidates.map((c) => (
                              <SelectItem key={c.discord_id} value={c.discord_id}>
                                [{c.team_name}] {c.nick_in_game ?? c.nick}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}