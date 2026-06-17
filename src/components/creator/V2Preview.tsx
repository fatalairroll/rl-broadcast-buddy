import { ScoreboardV2 } from '@/components/v2/ScoreboardV2';
import { BoostStackV2 } from '@/components/v2/BoostStackV2';
import { PlayerCardV2 } from '@/components/v2/PlayerCardV2';
import { SeriesScoreV2 } from '@/components/v2/SeriesScoreV2';
import { TeamNameV2 } from '@/components/v2/TeamNameV2';
import { V2GlassStage } from '@/components/v2/glass/V2GlassStage';
import { V2Y2kStage } from '@/components/v2/y2k/V2Y2kStage';
import { V2NeobrutalStage } from '@/components/v2/neobrutal/V2NeobrutalStage';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { useBroadcastSeries } from '@/hooks/useBroadcastSeries';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useMmrivalsBracket, findMatchById } from '@/hooks/useMmrivalsMatchData';
import { useActivePlayerMmrInfo } from '@/hooks/useActivePlayerMmrInfo';
import { ScoreboardBoundsProvider } from '@/lib/scoreboard-bounds-context';
import {
  MOCK_MATCH,
  MOCK_PLAYERS,
  MOCK_CAMERA,
  MOCK_SERIES,
  buildMockRegistryMap,
} from '@/lib/v2-mock-data';
import type { OverlayV2Config } from '@/types/overlayV2';

interface Props {
  config: OverlayV2Config;
  mode: 'live' | 'mock';
  scale?: number;
}

export function V2Preview({ config, mode, scale = 0.5 }: Props) {
  const live = useLiveStatsV2();
  const liveSeries = useBroadcastSeries();
  const { session } = useBroadcast();
  const { matches } = useMmrivalsBracket(mode === 'live' ? session?.mmr_tournament_id ?? null : null);
  const activeMmrMatch = findMatchById(matches, session?.mmr_match_id ?? null);
  const liveMmrOverride = useActivePlayerMmrInfo(session, activeMmrMatch, live.activeCameraTarget);
  const safeGlobalScale = Number.isFinite(config.general.globalScale) ? config.general.globalScale : 1;
  const stageScale = scale * safeGlobalScale;

  const useMock = mode === 'mock';
  const match = useMock ? MOCK_MATCH : live.match;
  const blue = useMock ? MOCK_PLAYERS.filter((p) => p.team_num === 0) : live.blue;
  const orange = useMock ? MOCK_PLAYERS.filter((p) => p.team_num === 1) : live.orange;
  const registryMap = useMock ? buildMockRegistryMap() : live.registryMap;
  const activeName = useMock ? MOCK_CAMERA.target_name : live.activeCameraTarget;
  const activePlayer = useMock
    ? MOCK_PLAYERS.find((p) => p.player_name === MOCK_CAMERA.target_name) ?? null
    : live.activePlayer;
  const activeRegistry = useMock
    ? buildMockRegistryMap().get(MOCK_CAMERA.target_name ?? '') ?? null
    : live.activeRegistry;
  const series = useMock ? MOCK_SERIES : liveSeries;
  const mmrOverride = useMock ? null : liveMmrOverride;
  const blueName = useMock ? 'TEAM BLUE' : (session?.team_a_name ?? '');
  const orangeName = useMock ? 'TEAM ORANGE' : (session?.team_b_name ?? '');

  const isGlass = config.general.theme === 'glass';
  const isY2k = config.general.theme === 'y2k';
  const isNeobrutal = config.general.theme === 'neobrutal';

  return (
    <ScoreboardBoundsProvider>
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: 1920 * scale,
        height: 1080 * scale,
        background:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, transparent 12px 24px), #0a0a0a',
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 overflow-hidden"
        style={{
          width: 1920 * stageScale,
          height: 1080 * stageScale,
          transform: 'translate(-50%, -50%)',
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
            blueName={blueName}
            orangeName={orangeName}
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
            blueName={blueName}
            orangeName={orangeName}
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
            blueName={blueName}
            orangeName={orangeName}
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
            <TeamNameV2 name={blueName} style={config.teamNameBlue} team="blue" />
            <TeamNameV2 name={orangeName} style={config.teamNameOrange} team="orange" />
            <BoostStackV2 players={blue} registryMap={registryMap} side="left" activeName={activeName} config={config} />
            <BoostStackV2 players={orange} registryMap={registryMap} side="right" activeName={activeName} config={config} />
            <PlayerCardV2 player={activePlayer} registry={activeRegistry} config={config} mmrOverride={mmrOverride} />
          </>
        )}
        </div>
      </div>
    </div>
    </ScoreboardBoundsProvider>
  );
}
