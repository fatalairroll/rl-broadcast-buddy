import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2, Monitor, Trophy, ArrowRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Gamepad2 className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">RL Broadcast</h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-8">
          Profesjonalne narzędzie do broadcastingu turniejów Rocket League
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-card rounded-lg border border-border">
            <Monitor className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Overlay dla OBS</h3>
            <p className="text-sm text-muted-foreground">
              Scoreboard, boost graczy, statystyki w czasie rzeczywistym
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border">
            <Trophy className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Studio turniejowe</h3>
            <p className="text-sm text-muted-foreground">
              Bracket, najbliższe i ostatnie mecze z MMRivals
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border">
            <Gamepad2 className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Integracja z RL</h3>
            <p className="text-sm text-muted-foreground">
              Dane na żywo z gry przez BakkesMod SOS Plugin
            </p>
          </div>
        </div>

        <Button size="lg" onClick={() => navigate('/dashboard')}>
          Rozpocznij
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
