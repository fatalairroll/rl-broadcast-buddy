import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBroadcast, useOverlayPresets } from '@/hooks/useBroadcast';
import { supabase } from '@/integrations/supabase/client';
import { TeamEditor } from '@/components/dashboard/TeamEditor';
import { MatchControls } from '@/components/dashboard/MatchControls';
import { RelayStatus } from '@/components/dashboard/RelayStatus';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Gamepad2,
  LogOut,
  Settings,
  Monitor,
  Palette,
  Users,
  Loader2,
  ExternalLink,
  Plus,
} from 'lucide-react';

const BROADCAST_CHANNEL = 'rl_broadcast_room';

export default function Dashboard() {
  const { user, loading: authLoading, hasAccess, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    session,
    loading: sessionLoading,
    updateSession,
    createSession,
    incrementTeamASeriesScore,
    decrementTeamASeriesScore,
    incrementTeamBSeriesScore,
    decrementTeamBSeriesScore,
    resetGameScore,
  } = useBroadcast();

  const { presets } = useOverlayPresets();
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     navigate('/auth');
  //   }
  // }, [authLoading, user, navigate]);

  // useEffect(() => {
  //   if (!authLoading && user && !hasAccess) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Brak dostępu',
  //       description: 'Nie masz uprawnień do panelu sterowania. Skontaktuj się z administratorem.',
  //     });
  //     navigate('/');
  //   }
  // }, [authLoading, user, hasAccess, navigate, toast]);

  const handleBroadcast = async () => {
    if (!session) return;

    await supabase.channel(BROADCAST_CHANNEL).send({
      type: 'broadcast',
      event: 'SET_TEAMS',
      payload: { session },
    });

    toast({
      title: 'Zaktualizowano',
      description: 'Dane zostały wysłane do overlaya.',
    });
  };

  const handleCreateSession = async () => {
    const { error } = await createSession('Nowa transmisja');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się utworzyć sesji.',
      });
    } else {
      toast({
        title: 'Utworzono',
        description: 'Nowa sesja transmisji została utworzona.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold">RL Broadcast</h1>
          </div>

          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/overlay', '_blank')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Overlay
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
            {/* Tymczasowo bez sprawdzania isAdmin - dev mode */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/creator')}>
              <Palette className="mr-2 h-4 w-4" />
              Kreator
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <Users className="mr-2 h-4 w-4" />
              Admin
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {!session ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Gamepad2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Brak aktywnej sesji</h2>
            <p className="text-muted-foreground mb-6">
              Utwórz nową sesję transmisji, aby rozpocząć
            </p>
            <Button onClick={handleCreateSession}>
              <Plus className="mr-2 h-4 w-4" />
              Utwórz sesję
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team A Editor */}
            <TeamEditor
              session={session}
              side="a"
              onUpdate={updateSession}
              onIncrementScore={incrementTeamASeriesScore}
              onDecrementScore={decrementTeamASeriesScore}
            />

            {/* Match Controls */}
            <MatchControls
              session={session}
              presets={presets}
              onUpdate={updateSession}
              onResetGameScore={resetGameScore}
              onBroadcast={handleBroadcast}
            />

            {/* Team B Editor */}
            <TeamEditor
              session={session}
              side="b"
              onUpdate={updateSession}
              onIncrementScore={incrementTeamBSeriesScore}
              onDecrementScore={decrementTeamBSeriesScore}
            />
          </div>
        )}

        {/* Relay Instructions */}
        <div className="mt-8 p-4 bg-secondary/30 rounded-lg border border-border">
          <h3 className="font-semibold mb-2">Instrukcja połączenia z Rocket League</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Zainstaluj BakkesMod i wtyczkę SOS w Rocket League</li>
            <li>Pobierz skrypt relay.js i uruchom go na komputerze z grą</li>
            <li>Skonfiguruj klucze API w skrypcie relay</li>
            <li>Status połączenia wyświetla się powyżej</li>
          </ol>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/relay')}>
            <Settings className="mr-2 h-4 w-4" />
            Pobierz Relay Script
          </Button>
        </div>
      </main>
    </div>
  );
}
