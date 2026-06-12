import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import {
  chamferLeft,
  chamferRight,
  GLASS_BLUE_FROM,
  GLASS_BLUE_TO,
  GLASS_ORANGE_FROM,
  GLASS_ORANGE_TO,
  GOAL_BANNER_HOLD_MS,
  GOAL_SWAP_MS,
  glassContentLayer,
  glassLabel,
  glassName,
  glassScoreDigitWin,
  glassSpecularSweep,
  opaqueBarBlue,
  opaqueBarOrange,
  opaqueDark,
  fakeRefractionBlue,
  fakeRefractionOrange,
  fakeRefractionDark,
} from '@/lib/studio-glass-theme';
import { getRankIcon, getRankFromMmr } from '@/lib/rank-utils';
import { positionToStyle } from '@/lib/position-utils';
import type { OverlayV2Config } from '@/types/overlayV2';
import type { GoalEvent } from '@/hooks/useGoalEventDetector';

interface Props {
  config: OverlayV2Config;
  activePlayer: PlayerLive | null;
  activeRegistry: PlayerRegistry | null;
  mmrOverride: { mmr: number | null; rank: string | null } | null;
  blue: PlayerLive[];
  orange: PlayerLive[];
  registryMap: Map<string, PlayerRegistry>;
  blueName: string;
  orangeName: string;
  goal: GoalEvent | null;
}

const CARD_W = 430;
const CARD_H = 52;
const BOX_W = 84;

interface DisplayPlayer {
  player: PlayerLive;
  registry: PlayerRegistry | null;
  side: 'blue' | 'orange';
  mmr: number | null;
  rank: string | null;
  teamName: string;
}

function resolvePlayer(
  player: PlayerLive,
  registry: PlayerRegistry | null,
  mmrOverride: { mmr: number | null; rank: string | null } | null,
  blueName: string,
  orangeName: string,
): DisplayPlayer {
  const side: 'blue' | 'orange' = player.team_num === 0 ? 'blue' : 'orange';
  const mmr = mmrOverride?.mmr ?? registry?.mmr ?? player.mmr ?? null;
  const rank =
    mmrOverride?.rank ??
    registry?.rank_name ??
    (mmr != null ? getRankFromMmr(mmr) : null);
  return {
    player,
    registry,
    side,
    mmr,
    rank,
    teamName: side === 'blue' ? blueName : orangeName,
  };
}

function barStyleFor(side: 'blue' | 'orange', bothChamfers: boolean) {
  const base = side === 'blue' ? opaqueBarBlue : opaqueBarOrange;
  if (bothChamfers) {
    // both chamfers: combine clip-paths by intersecting via single polygon.
    return {
      ...base,
      clipPath:
        'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
    };
  }
  return { ...base, ...chamferRight(10) };
}

function tickColor(side: 'blue' | 'orange') {
  return side === 'blue' ? GLASS_BLUE_FROM : GLASS_ORANGE_FROM;
}

function shardColor(side: 'blue' | 'orange') {
  return side === 'blue' ? GLASS_BLUE_TO : GLASS_ORANGE_TO;
}

export function GlassPlayerCard({
  config,
  activePlayer,
  activeRegistry,
  mmrOverride,
  blue,
  orange,
  registryMap,
  blueName,
  orangeName,
  goal,
}: Props) {
  // Goal banner state: tracks current goal event + hold timer.
  const [activeGoal, setActiveGoal] = useState<GoalEvent | null>(null);
  useEffect(() => {
    if (!goal) return;
    setActiveGoal(goal);
    const t = setTimeout(() => {
      setActiveGoal((g) => (g && g.nonce === goal.nonce ? null : g));
    }, GOAL_BANNER_HOLD_MS);
    return () => clearTimeout(t);
  }, [goal]);

  // Build display target:
  // - if goal active → show scorer
  // - else → show active camera player (idle)
  let display: DisplayPlayer | null = null;
  let inGoalState = false;

  if (activeGoal) {
    const all = [...blue, ...orange];
    const scorer = all.find((p) => p.player_name === activeGoal.scorerName);
    if (scorer) {
      display = resolvePlayer(
        scorer,
        registryMap.get(scorer.player_name) ?? null,
        null,
        blueName,
        orangeName,
      );
      inGoalState = true;
    }
  }
  if (!display && activePlayer) {
    display = resolvePlayer(activePlayer, activeRegistry, mmrOverride, blueName, orangeName);
  }

  const cardVisible = !!display;

  return (
    <div style={positionToStyle(config.playerCard.position)}>
      <AnimatePresence>
        {cardVisible && display && (
          <motion.div
            key="glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ width: CARD_W }}
          >
            {/* Kicker */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                paddingLeft: 6,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 2.5,
                  background: tickColor(display.side),
                  transform: 'skewX(-35deg)',
                }}
              />
              <div
                style={{
                  ...glassLabel,
                  fontSize: 10,
                  color: 'rgba(255,255,255,.6)',
                  textShadow: '0 1px 8px rgba(0,0,0,.5)',
                }}
              >
                {inGoalState && activeGoal
                  ? `${display.teamName.toUpperCase() || (display.side === 'blue' ? 'BLUE' : 'ORANGE')} · ${activeGoal.matchTimer}`
                  : (display.teamName.toUpperCase() || (display.side === 'blue' ? 'BLUE' : 'ORANGE'))}
              </div>
            </div>
            <CardBody
              display={display}
              goal={inGoalState ? activeGoal : null}
              rankSize={config.playerCard.rankIconSize ?? 30}
              rankOx={config.playerCard.rankOffsetX ?? 0}
              rankOy={config.playerCard.rankOffsetY ?? 0}
            />
            {/* Shards */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 4, marginTop: 4, paddingLeft: 2 }}>
              <div style={{ width: 14, height: 4, background: shardColor(display.side), transform: 'skewX(-30deg)' }} />
              <div style={{ width: 10, height: 4, background: '#fff', opacity: 0.7, transform: 'skewX(-30deg)' }} />
              <div style={{ width: 6, height: 4, background: shardColor(display.side), transform: 'skewX(-30deg)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardBody({
  display,
  goal,
  rankSize,
  rankOx,
  rankOy,
}: {
  display: DisplayPlayer;
  goal: GoalEvent | null;
  rankSize: number;
  rankOx: number;
  rankOy: number;
}) {
  const hasRank = !!display.rank;
  const inGoal = !!goal;
  // In goal state we ALWAYS render the box (with GOL!), even if no rank.
  const renderBox = inGoal || hasRank;
  const barWidth = renderBox ? CARD_W - BOX_W : CARD_W;
  const rankIconSrc = display.rank ? getRankIcon(display.rank) : null;

  return (
    <div style={{ display: 'flex', width: CARD_W, height: CARD_H }}>
      {renderBox && (
        <div
          style={{
            ...opaqueDark,
            ...chamferLeft(10),
            width: BOX_W,
            height: CARD_H,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div style={fakeRefractionDark} />
          <div style={glassSpecularSweep} />
          <div style={{ ...glassContentLayer, position: 'relative', width: '100%', height: '100%' }}>
            <AnimatePresence mode="wait">
              {inGoal ? (
                <motion.div
                  key="goal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: GOAL_SWAP_MS / 1000, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...glassName,
                    ...glassScoreDigitWin,
                    fontSize: 24,
                    letterSpacing: '.04em',
                  }}
                >
                  GOL!
                </motion.div>
              ) : rankIconSrc ? (
                <motion.div
                  key="rank"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: GOAL_SWAP_MS / 1000, ease: 'easeIn' }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    marginLeft: -rankSize / 2 + rankOx,
                    marginTop: -rankSize / 2 + rankOy,
                    width: rankSize,
                    height: rankSize,
                  }}
                >
                  <img
                    src={rankIconSrc}
                    alt={display.rank ?? ''}
                    width={rankSize}
                    height={rankSize}
                    style={{ display: 'block', objectFit: 'contain' }}
                    draggable={false}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      )}
      {/* Bar */}
      <div
        style={{
          ...barStyleFor(display.side, !renderBox),
          width: barWidth,
          height: CARD_H,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          overflow: 'hidden',
        }}
      >
        <div style={display.side === 'blue' ? fakeRefractionBlue : fakeRefractionOrange} />
        <div style={glassSpecularSweep} />
        <div
          style={{
            ...glassContentLayer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={goal ? `g-${goal.nonce}` : `n-${display.player.player_name}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: GOAL_SWAP_MS / 1000, ease: 'easeOut' }}
              style={{ ...glassName, fontSize: 23, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {goal ? goal.scorerName : display.player.player_name}
            </motion.div>
          </AnimatePresence>
          <div style={{ ...glassLabel, fontSize: 11, color: 'rgba(255,255,255,.8)' }}>
            {goal
              ? goal.assistName
                ? `asysta · ${goal.assistName}`
                : ''
              : display.mmr != null
                ? `${display.mmr} MMR`
                : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
