import { useEffect, useState } from 'react';
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

  // Auto-fit the 1920x1080 stage to whatever size OBS Browser Source uses,
  // preserving 16:9 and centering. globalScale multiplies on top.
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;
      setFit(Math.min(w / 1920, h / 1080));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const stageScale = fit * config.general.globalScale;

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: 1920 * stageScale,
          height: 1080 * stageScale,
          flex: '0 0 auto',
        }}
      >
        <div
          className="relative"
        style={{
          width: 1920,
          height: 1080,
            transform: `scale(${stageScale})`,
            transformOrigin: 'top left',
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
    </div>
  );
}