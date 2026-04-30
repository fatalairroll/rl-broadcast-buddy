import { useEffect } from 'react';
import { ScoreboardV2 } from '@/components/v2/ScoreboardV2';
import { BoostStackV2 } from '@/components/v2/BoostStackV2';
import { PlayerCardV2 } from '@/components/v2/PlayerCardV2';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';

export default function OverlayV2() {
  const {
    match,
    blue,
    orange,
    activeCameraTarget,
    activePlayer,
    activeRegistry,
    registryMap,
  } = useLiveStatsV2();

  // Transparent body for OBS capture
  useEffect(() => {
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 1920, height: 1080, background: 'transparent' }}
    >
      <ScoreboardV2 match={match} />

      <BoostStackV2
        players={blue}
        registryMap={registryMap}
        side="left"
        activeName={activeCameraTarget}
      />
      <BoostStackV2
        players={orange}
        registryMap={registryMap}
        side="right"
        activeName={activeCameraTarget}
      />

      <PlayerCardV2 player={activePlayer} registry={activeRegistry} />
    </div>
  );
}