import type { PlayerLive, PlayerRegistry, MatchMetadata } from '@/types/livestats';
import type { OverlayV2Config } from '@/types/overlayV2';
import type { SeriesData } from '@/hooks/useBroadcastSeries';
import { positionToStyle } from '@/lib/position-utils';
import { useGoalEventDetector } from '@/hooks/useGoalEventDetector';
import { Y2kScorebar } from './Y2kScorebar';
import { Y2kBoostStack } from './Y2kBoostStack';
import { Y2kPlayerCard } from './Y2kPlayerCard';
import { Y2kBoostGauge } from './Y2kBoostGauge';

interface Props {
  config: OverlayV2Config;
  match: MatchMetadata | null;
  blue: PlayerLive[];
  orange: PlayerLive[];
  activePlayer: PlayerLive | null;
  activeRegistry: PlayerRegistry | null;
  registryMap: Map<string, PlayerRegistry>;
  series: SeriesData;
  blueName: string;
  orangeName: string;
  mmrOverride: { mmr: number | null; rank: string | null } | null;
}

export function V2Y2kStage({
  config,
  match,
  blue,
  orange,
  activePlayer,
  activeRegistry,
  registryMap,
  series,
  blueName,
  orangeName,
  mmrOverride,
}: Props) {
  const goal = useGoalEventDetector(match, blue, orange);

  return (
    <>
      <Y2kScorebar
        match={match}
        series={series}
        blueName={blueName}
        orangeName={orangeName}
        config={config}
      />
      {config.boostBar.visible && (
        <>
          <div style={positionToStyle(config.boostBar.positionLeft)}>
            <Y2kBoostStack players={blue} side="blue" />
          </div>
          <div style={positionToStyle(config.boostBar.positionRight)}>
            <Y2kBoostStack players={orange} side="orange" />
          </div>
        </>
      )}
      {config.playerCard.visible && (
        <Y2kPlayerCard
          config={config}
          activePlayer={activePlayer}
          activeRegistry={activeRegistry}
          mmrOverride={mmrOverride}
          blue={blue}
          orange={orange}
          registryMap={registryMap}
          blueName={blueName}
          orangeName={orangeName}
          goal={goal}
        />
      )}
      {config.boostGauge.visible && (
        <Y2kBoostGauge config={config} activePlayer={activePlayer} />
      )}
    </>
  );
}