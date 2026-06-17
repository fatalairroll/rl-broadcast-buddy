import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const BROADCAST_CHANNEL = 'rl_broadcast_room';
const GREEN_MS = 10_000;
const AMBER_MS = 30_000;

export function RelayStatus() {
  const lastPingRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel(BROADCAST_CHANNEL)
      .on('broadcast', { event: 'RELAY_PING' }, (payload) => {
        const ts = (payload.payload as { timestamp?: number } | undefined)?.timestamp;
        lastPingRef.current = typeof ts === 'number' ? ts : Date.now();
        setTick((t) => t + 1);
      })
      .subscribe();

    const interval = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const last = lastPingRef.current;
  const age = last == null ? Infinity : Date.now() - last;

  let cls = 'bg-red-500/20 text-red-400 border-red-500/30';
  let label = 'Brak relaya';
  let Icon = WifiOff;

  if (age < GREEN_MS) {
    cls = 'bg-green-500/20 text-green-400 border-green-500/30';
    label = 'Relay aktywny';
    Icon = Wifi;
  } else if (age < AMBER_MS) {
    cls = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    label = `Relay — brak danych ${Math.floor(age / 1000)}s`;
    Icon = AlertCircle;
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${cls}`}
      title={last ? `Ostatni ping: ${Math.floor(age / 1000)}s temu` : 'Brak pingów'}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}
