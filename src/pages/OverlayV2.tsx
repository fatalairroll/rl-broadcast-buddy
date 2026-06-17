import { useEffect, useState } from 'react';
import { ScoreboardV2 } from '@/components/v2/ScoreboardV2';
import { BoostStackV2 } from '@/components/v2/BoostStackV2';
import { PlayerCardV2 } from '@/components/v2/PlayerCardV2';
import { SeriesScoreV2 } from '@/components/v2/SeriesScoreV2';
import { TeamNameV2 } from '@/components/v2/TeamNameV2';
import { V2GlassStage } from '@/components/v2/glass/V2GlassStage';
import { V2Y2kStage } from '@/components/v2/y2k/V2Y2kStage';
import { V2NeobrutalStage } from '@/components/v2/neobrutal/V2NeobrutalStage';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { useActiveV2Config } from '@/hooks/useOverlayV2Config';
import { useOverlayVisibility } from '@/hooks/useOverlayVisibility';
import { useBroadcastSeries } from '@/hooks/useBroadcastSeries';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useMmrivalsBracket, findMatchById } from '@/hooks/useMmrivalsMatchData';
import { useActivePlayerMmrInfo } from '@/hooks/useActivePlayerMmrInfo';
import { ScoreboardBoundsProvider } from '@/lib/scoreboard-bounds-context';

export default function OverlayV2() {
  const {
    match,
    blue,
    orange,
    activeCameraTarget,
    activePlayer,
    activeRegistry,
    registryMap,
    relayConnected,
    relayLastMessageAgeMs,
    relayLastFrame,
  } = useLiveStatsV2();
  const { config } = useActiveV2Config();
  const series = useBroadcastSeries();
  const { session } = useBroadcast();
  const { matches } = useMmrivalsBracket(session?.mmr_tournament_id ?? null);
  const activeMmrMatch = findMatchById(matches, session?.mmr_match_id ?? null);
  const mmrOverride = useActivePlayerMmrInfo(session, activeMmrMatch, activeCameraTarget);
  const isGlass = config.general.theme === 'glass';
  const isY2k = config.general.theme === 'y2k';
  const isNeobrutal = config.general.theme === 'neobrutal';

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

  const safeGlobalScale = Number.isFinite(config.general.globalScale) ? config.general.globalScale : 1;
  const stageScale = fit * safeGlobalScale;

  const visible = useOverlayVisibility(match, {
    relayConnected,
    lastMessageAgeMs: relayLastMessageAgeMs,
    lastFrameIsActive: relayLastFrame?.match?.is_active,
  });

  return (
    <ScoreboardBoundsProvider>
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      <div
        className={`relative shrink-0 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
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
        {isGlass ? (
          <V2GlassStage
            config={config}
            match={match}
            blue={blue}
            orange={orange}
            activePlayer={activePlayer}
            activeRegistry={activeRegistry}
            registryMap={registryMap}
            series={series}
            blueName={session?.team_a_name ?? ''}
            orangeName={session?.team_b_name ?? ''}
            mmrOverride={mmrOverride}
          />
        ) : isY2k ? (
          <V2Y2kStage
            config={config}
            match={match}
            blue={blue}
            orange={orange}
            activePlayer={activePlayer}
            activeRegistry={activeRegistry}
            registryMap={registryMap}
            series={series}
            blueName={session?.team_a_name ?? ''}
            orangeName={session?.team_b_name ?? ''}
            mmrOverride={mmrOverride}
          />
        ) : isNeobrutal ? (
          <V2NeobrutalStage
            config={config}
            match={match}
            blue={blue}
            orange={orange}
            activePlayer={activePlayer}
            activeRegistry={activeRegistry}
            registryMap={registryMap}
            series={series}
            blueName={session?.team_a_name ?? ''}
            orangeName={session?.team_b_name ?? ''}
            mmrOverride={mmrOverride}
          />
        ) : (
          <>
            <ScoreboardV2 match={match} config={config} />
            <SeriesScoreV2
              type={series.type}
              blueScore={series.blueScore}
              orangeScore={series.orangeScore}
              config={config}
            />
            <TeamNameV2 name={session?.team_a_name ?? ''} style={config.teamNameBlue} team="blue" />
            <TeamNameV2 name={session?.team_b_name ?? ''} style={config.teamNameOrange} team="orange" />
            <BoostStackV2
              players={blue}
              registryMap={registryMap}
              side="left"
              activeName={activeCameraTarget}
              config={config}
              relayConnected={relayConnected}
            />
            <BoostStackV2
              players={orange}
              registryMap={registryMap}
              side="right"
              activeName={activeCameraTarget}
              config={config}
              relayConnected={relayConnected}
            />
            <PlayerCardV2 player={activePlayer} registry={activeRegistry} config={config} mmrOverride={mmrOverride} />
          </>
        )}
        </div>
      </div>
    </div>
    </ScoreboardBoundsProvider>
  );
}