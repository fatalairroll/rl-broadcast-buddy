import { useEffect } from 'react';
import { ScoreboardV2 } from '@/components/v2/ScoreboardV2';
import { BoostStackV2 } from '@/components/v2/BoostStackV2';
import { PlayerCardV2 } from '@/components/v2/PlayerCardV2';
import { SeriesScoreV2 } from '@/components/v2/SeriesScoreV2';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { useActiveV2Config } from '@/hooks/useOverlayV2Config';
import { useBroadcastSeries } from '@/hooks/useBroadcastSeries';

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
  const { config } = useActiveV2Config();
  const series = useBroadcastSeries();

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
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${config.general.globalScale})`,
        }}
      >
        <ScoreboardV2 match={match} config={config} />
        <SeriesScoreV2
          type={series.type}
          blueScore={series.blueScore}
          orangeScore={series.orangeScore}
          config={config}
        />
        <BoostStackV2
          players={blue}
          registryMap={registryMap}
          side="left"
          activeName={activeCameraTarget}
          config={config}
        />
        <BoostStackV2
          players={orange}
          registryMap={registryMap}
          side="right"
          activeName={activeCameraTarget}
          config={config}
        />
        <PlayerCardV2 player={activePlayer} registry={activeRegistry} config={config} />
      </div>
    </div>
  );
}