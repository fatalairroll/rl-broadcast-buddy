import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PlayerLive, PlayerRegistry } from '@/types/livestats';
import type { OverlayV2Config } from '@/types/overlayV2';
import type { GoalEvent } from '@/hooks/useGoalEventDetector';
import { positionToStyle } from '@/lib/position-utils';
import { getRankIcon, getRankFromMmr } from '@/lib/rank-utils';
import {
  NB_FONT,
  NB_MONO,
  NB_ACID,
  NB_INK,
  NB_PAPER,
  NB_ORANGE,
  NB_BORDER,
  nbShadow,
  GOAL_HOLD_MS,
  GOAL_SWAP_MS,
} from '@/lib/neobrutal-theme';

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

const CARD_W = 460;
const CARD_H = 76;
const BOX_W = 100;

interface DisplayPlayer {
  player: PlayerLive;
  side: 'blue' | 'orange';
  mmr: number | null;
  rank: string | null;
  teamName: string;
}

function resolve(
  player: PlayerLive,
  registry: PlayerRegistry | null,
  mmrOverride: { mmr: number | null; rank: string | null } | null,
  blueName: string,
  orangeName: string,
): DisplayPlayer {
  const side: 'blue' | 'orange' = player.team_num === 0 ? 'blue' : 'orange';
  const mmr = mmrOverride?.mmr ?? registry?.mmr ?? player.mmr ?? null;
  const rank =
    mmrOverride?.rank ?? registry?.rank_name ?? (mmr != null ? getRankFromMmr(mmr) : null);
  return { player, side, mmr, rank, teamName: side === 'blue' ? blueName : orangeName };
}

export function NbPlayerCard({
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
  const [activeGoal, setActiveGoal] = useState<GoalEvent | null>(null);
  useEffect(() => {
    if (!goal) return;
    setActiveGoal(goal);
    const t = setTimeout(() => {
      setActiveGoal((g) => (g && g.nonce === goal.nonce ? null : g));
    }, GOAL_HOLD_MS);
    return () => clearTimeout(t);
  }, [goal]);

  let display: DisplayPlayer | null = null;
  let inGoal = false;
  if (activeGoal) {
    const all = [...blue, ...orange];
    const scorer = all.find((p) => p.player_name === activeGoal.scorerName);
    if (scorer) {
      display = resolve(scorer, registryMap.get(scorer.player_name) ?? null, null, blueName, orangeName);
      inGoal = true;
    }
  }
  if (!display && activePlayer) {
    display = resolve(activePlayer, activeRegistry, mmrOverride, blueName, orangeName);
  }

  const visible = !!display;
  const rankSize = config.playerCard.rankIconSize ?? 48;
  const rankOx = config.playerCard.rankOffsetX ?? 0;
  const rankOy = config.playerCard.rankOffsetY ?? 0;

  return (
    <div style={positionToStyle(config.playerCard.position)}>
      <AnimatePresence>
        {visible && display && (
          <motion.div
            key="nb-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ width: CARD_W, fontFamily: NB_FONT }}
          >
            <CardBody display={display} goal={inGoal ? activeGoal : null} rankSize={rankSize} rankOx={rankOx} rankOy={rankOy} />
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
  const renderBox = inGoal || hasRank;
  const barWidth = renderBox ? CARD_W - BOX_W : CARD_W;
  const rankIconSrc = display.rank ? getRankIcon(display.rank) : null;

  return (
    <div style={{ display: 'flex', width: CARD_W, height: CARD_H, filter: `drop-shadow(${nbShadow})` }}>
      {renderBox && (
        <div
          style={{
            position: 'relative',
            width: BOX_W,
            height: CARD_H,
            background: NB_ACID,
            border: NB_BORDER,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            {inGoal ? (
              <motion.div
                key="gol"
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
                  color: NB_INK,
                  fontFamily: NB_FONT,
                  fontWeight: 900,
                  fontSize: 26,
                  letterSpacing: '.06em',
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
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: rankSize,
                    height: rankSize,
                    marginLeft: rankOx,
                    marginTop: rankOy,
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
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {/* Name / MMR bar */}
      <div
        style={{
          position: 'relative',
          width: barWidth,
          height: CARD_H,
          background: NB_PAPER,
          border: NB_BORDER,
          marginLeft: renderBox ? -3 : 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 18px',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={goal ? `g-${goal.nonce}` : `n-${display.player.player_name}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: GOAL_SWAP_MS / 1000, ease: 'easeOut' }}
            style={{
              color: NB_INK,
              fontFamily: NB_FONT,
              fontWeight: 900,
              fontSize: 24,
              lineHeight: 1,
              letterSpacing: '-.01em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {goal ? goal.scorerName : display.player.player_name}
          </motion.div>
        </AnimatePresence>
        <div
          style={{
            color: NB_ORANGE,
            fontFamily: NB_MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.14em',
            marginTop: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {goal
            ? goal.assistName
              ? `ASYSTA · ${goal.assistName.toUpperCase()}`
              : `${display.teamName?.toUpperCase() || display.side.toUpperCase()}`
            : `${(display.rank ?? '').toUpperCase()}${display.rank && display.mmr != null ? ' · ' : ''}${display.mmr != null ? `${display.mmr} MMR` : ''}`}
        </div>
      </div>
    </div>
  );
}