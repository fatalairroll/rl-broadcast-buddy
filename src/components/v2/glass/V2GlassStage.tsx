import type { PlayerLive, PlayerRegistry, MatchMetadata } from '@/types/livestats';
import type { OverlayV2Config } from '@/types/overlayV2';
import type { SeriesData } from '@/hooks/useBroadcastSeries';
import { GlassScorebar } from './GlassScorebar';
import { GlassBoostPanel } from './GlassBoostPanel';
import { GlassPlayerCard } from './GlassPlayerCard';
import { useGoalEventDetector } from '@/hooks/useGoalEventDetector';
import { positionToStyle } from '@/lib/position-utils';

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

export function V2GlassStage({
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
      <GlassScorebar
        match={match}
        series={series}
        blueName={blueName}
        orangeName={orangeName}
        config={config}
      />
      {config.boostBar.visible && (
        <>
          <div style={positionToStyle(config.boostBar.positionLeft)}>
            <GlassBoostPanel players={blue} side="blue" />
          </div>
          <div style={positionToStyle(config.boostBar.positionRight)}>
            <GlassBoostPanel players={orange} side="orange" />
          </div>
        </>
      )}
      {config.playerCard.visible && (
        <GlassPlayerCard
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
    </>
  );
}