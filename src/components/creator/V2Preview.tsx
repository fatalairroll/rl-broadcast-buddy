import { ScoreboardV2 } from '@/components/v2/ScoreboardV2';
import { BoostStackV2 } from '@/components/v2/BoostStackV2';
import { PlayerCardV2 } from '@/components/v2/PlayerCardV2';
import { SeriesScoreV2 } from '@/components/v2/SeriesScoreV2';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { useBroadcastSeries } from '@/hooks/useBroadcastSeries';
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

  return (
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
        className="absolute top-1/2 left-1/2"
        style={{
          width: 1920,
          height: 1080,
          transform: `translate(-50%, -50%) scale(${scale * config.general.globalScale})`,
          transformOrigin: 'center center',
        }}
      >
        <ScoreboardV2 match={match} config={config} />
        <SeriesScoreV2
          type={series.type}
          blueScore={series.blueScore}
          orangeScore={series.orangeScore}
          config={config}
        />
        <BoostStackV2 players={blue} registryMap={registryMap} side="left" activeName={activeName} config={config} />
        <BoostStackV2 players={orange} registryMap={registryMap} side="right" activeName={activeName} config={config} />
        <PlayerCardV2 player={activePlayer} registry={activeRegistry} config={config} />
      </div>
    </div>
  );
}
