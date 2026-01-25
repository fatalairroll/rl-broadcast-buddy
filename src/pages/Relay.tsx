import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, ArrowLeft, Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

// Get values from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getRelayScript = () => `// RL Broadcast Relay Script
// Łączy BakkesMod SOS Plugin z Lovable Cloud
// 
// INSTALACJA:
// 1. Upewnij się, że masz Node.js zainstalowany
// 2. Zapisz ten plik jako relay.js
// 3. Zainstaluj zależności: npm install ws @supabase/supabase-js
// 4. Uruchom: node relay.js
//
// UWAGA: Ten plik jest już skonfigurowany - nie musisz nic edytować!

const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// === KONFIGURACJA (automatycznie uzupełniona) ===
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
const SOS_PORT = 49122;
const BROADCAST_CHANNEL = 'rl_broadcast_room';

// === INICJALIZACJA ===
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let channel = null;

function connect() {
  console.log('🎮 Łączenie z SOS Plugin na porcie', SOS_PORT);
  
  const ws = new WebSocket(\`ws://localhost:\${SOS_PORT}\`);

  ws.on('open', () => {
    console.log('✅ Połączono z SOS Plugin');
    initBroadcastChannel();
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      handleSOSEvent(parsed);
    } catch (e) {
      console.error('Błąd parsowania:', e);
    }
  });

  ws.on('close', () => {
    console.log('❌ Rozłączono z SOS Plugin. Ponowna próba za 5s...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('Błąd WebSocket:', err.message);
  });
}

async function initBroadcastChannel() {
  channel = supabase.channel(BROADCAST_CHANNEL);
  await channel.subscribe();
  console.log('📡 Połączono z kanałem broadcast');
  
  // Ping co 2 sekundy aby dashboard wiedział, że relay działa
  setInterval(() => {
    channel.send({
      type: 'broadcast',
      event: 'RELAY_PING',
      payload: { timestamp: Date.now() }
    });
  }, 2000);
}

function handleSOSEvent(event) {
  // SOS wysyła różne typy eventów
  // Interesują nas głównie: game:update_state, game:goal_scored, etc.
  
  if (event.event === 'game:update_state' && event.data) {
    const gameState = parseGameState(event.data);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'GAME_STATE',
        payload: gameState
      });
    }
  }
}

function parseGameState(data) {
  // Mapowanie danych z SOS na nasz format
  const players = [];
  
  if (data.players) {
    Object.values(data.players).forEach((p, idx) => {
      players.push({
        id: p.id || String(idx),
        name: p.name || 'Player',
        team: p.team === 1 ? 1 : 0, // 0 = blue, 1 = orange
        boost: Math.round(p.boost * 100) || 0,
        goals: p.goals || 0,
        shots: p.shots || 0,
        assists: p.assists || 0,
        saves: p.saves || 0,
        score: p.score || 0,
        isPrimary: p.isPrimary || false
      });
    });
  }

  return {
    players,
    teams: {
      blue: { score: data.game?.teams?.[0]?.score || 0 },
      orange: { score: data.game?.teams?.[1]?.score || 0 }
    },
    ball: {
      speed: Math.round(data.game?.ball?.speed || 0),
      location: data.game?.ball?.location || { x: 0, y: 0, z: 0 }
    },
    game: {
      time: data.game?.time_seconds || 0,
      isOT: data.game?.isOT || false,
      hasTarget: !!data.game?.hasTarget
    }
  };
}

// Start
console.log('🚀 RL Broadcast Relay');
console.log('Upewnij się, że:');
console.log('  1. Rocket League jest uruchomiony');
console.log('  2. BakkesMod jest aktywny');
console.log('  3. SOS Plugin jest włączony (F2 -> Plugins -> SOS)');
console.log('');
connect();
`;

export default function Relay() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const relayScript = getRelayScript();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(relayScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([relayScript], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relay.js';
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <h1 className="text-lg font-bold">Relay Script</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Skopiowano!' : 'Kopiuj'}
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Pobierz
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions */}
          <Card className="glass-panel lg:col-span-1">
            <CardHeader>
              <CardTitle>Instrukcja instalacji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">1. Wymagania</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Node.js (v18+)</li>
                  <li>BakkesMod</li>
                  <li>SOS Plugin</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">2. Instalacja SOS Plugin</h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Otwórz BakkesMod (F2)</li>
                  <li>Przejdź do Plugins → Plugin Manager</li>
                  <li>Zainstaluj "SOS - Overlay System"</li>
                  <li>Włącz plugin i upewnij się, że port to 49122</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">3. Konfiguracja Relay</h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Pobierz plik relay.js</li>
                  <li>Otwórz folder i uruchom: <code className="bg-secondary px-1 rounded">npm install ws @supabase/supabase-js</code></li>
                  <li>Uzupełnij SUPABASE_URL i SUPABASE_ANON_KEY w pliku</li>
                  <li>Uruchom: <code className="bg-secondary px-1 rounded">node relay.js</code></li>
                </ol>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>✓ Automatycznie skonfigurowane!</strong>
                  <br />
                  Skrypt jest gotowy do użycia - nie musisz nic edytować.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Code Preview */}
          <Card className="glass-panel lg:col-span-2">
            <CardHeader>
              <CardTitle>relay.js</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-secondary/50 p-4 rounded-lg overflow-auto max-h-[600px] text-xs font-mono">
                {relayScript}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
