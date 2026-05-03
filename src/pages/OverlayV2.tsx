import { useEffect, useRef, useState } from 'react';
import { ScoreboardV2 } from '@/components/v2/ScoreboardV2';
import { BoostStackV2 } from '@/components/v2/BoostStackV2';
import { PlayerCardV2 } from '@/components/v2/PlayerCardV2';
import { SeriesScoreV2 } from '@/components/v2/SeriesScoreV2';
import { TeamNameV2 } from '@/components/v2/TeamNameV2';
import { PostMatchStats } from '@/components/v2/PostMatchStats';
import { useLiveStatsV2 } from '@/hooks/useLiveStatsV2';
import { useActiveV2Config } from '@/hooks/useOverlayV2Config';
import { useBroadcastSeries } from '@/hooks/useBroadcastSeries';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useMmrivalsBracket, findMatchById } from '@/hooks/useMmrivalsMatchData';
import { useActivePlayerMmrInfo } from '@/hooks/useActivePlayerMmrInfo';
import { usePostMatchStats } from '@/hooks/usePostMatchStats';

export default function OverlayV2() {
  const {
    match,
    players,
    blue,
    orange,
    activeCameraTarget,
    activePlayer,
    activeRegistry,
    registryMap,
  } = useLiveStatsV2();
  const { config } = useActiveV2Config();
  const series = useBroadcastSeries();
  const { session } = useBroadcast();
  const { matches } = useMmrivalsBracket(session?.mmr_tournament_id ?? null);
  const activeMmrMatch = findMatchById(matches, session?.mmr_match_id ?? null);
  const mmrOverride = useActivePlayerMmrInfo(session, activeMmrMatch, activeCameraTarget);
  const winners = usePostMatchStats(players, match);

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

  const isActive = match?.is_active ?? true;

  // Show recap card 2 s after match ends (is_active true -> false).
  // Hide automatically after 12 s, or when a new match becomes active /
  // match_guid changes.
  const [showRecap, setShowRecap] = useState(false);
  const prevActiveRef = useRef<boolean>(true);
  const prevGuidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!match) return;
    const guid = match.match_guid ?? null;
    if (prevGuidRef.current !== guid) {
      prevGuidRef.current = guid;
      setShowRecap(false);
    }
    if (prevActiveRef.current && !isActive) {
      setShowRecap(true);
      const t = setTimeout(() => setShowRecap(false), config.postMatchStats.delayMs + config.postMatchStats.durationMs);
      prevActiveRef.current = isActive;
      return () => clearTimeout(t);
    }
    if (!prevActiveRef.current && isActive) {
      setShowRecap(false);
    }
    prevActiveRef.current = isActive;
  }, [match, isActive, config.postMatchStats.delayMs, config.postMatchStats.durationMs]);

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      <div
        className={`relative shrink-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
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
        <TeamNameV2 name={session?.team_a_name ?? ''} style={config.teamNameBlue} team="blue" />
        <TeamNameV2 name={session?.team_b_name ?? ''} style={config.teamNameOrange} team="orange" />
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
          <PlayerCardV2 player={activePlayer} registry={activeRegistry} config={config} mmrOverride={mmrOverride} />
        </div>
      </div>
      {showRecap && (
        <div
          className="relative shrink-0"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            className="relative"
            style={{
              width: 1920 * stageScale,
              height: 1080 * stageScale,
              margin: 'auto',
              position: 'absolute',
              inset: 0,
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
              <PostMatchStats winners={winners} registryMap={registryMap} style={config.postMatchStats} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}