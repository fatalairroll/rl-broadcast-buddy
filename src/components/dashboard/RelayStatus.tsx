import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff } from 'lucide-react';

const BROADCAST_CHANNEL = 'rl_broadcast_room';
const TIMEOUT_MS = 5000;

export function RelayStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<number | null>(null);

  useEffect(() => {
    const channel = supabase.channel(BROADCAST_CHANNEL);

    channel
      .on('broadcast', { event: 'RELAY_PING' }, (payload) => {
        setIsConnected(true);
        setLastPing(payload.payload?.timestamp || Date.now());
      })
      .subscribe();

    // Check for timeout - if no ping received, consider disconnected
    const interval = setInterval(() => {
      if (lastPing && Date.now() - lastPing > TIMEOUT_MS) {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [lastPing]);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isConnected
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-muted text-muted-foreground border border-border'
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Relay aktywny</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Relay nieaktywny</span>
        </>
      )}
    </div>
  );
}
