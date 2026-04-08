import { AnimatePresence, motion } from 'framer-motion';
import type { MatchData, PlayerData } from '@/types/studio';
import { RankIcon } from './RankIcon';
import { getRankFromMmr, normalizeRankName, isValidRank } from '@/lib/rank-utils';

interface MatchCardProps {
  match: MatchData;
  gameMode: string;
  upcomingMatches?: MatchData[];
}

function getMmrForMode(player: PlayerData, mode: string): number | null {
  if (mode === '1v1') return player.mmr_1v1;
  if (mode === '2v2') return player.mmr_2v2;
  if (mode === '3v3') return player.mmr_3v3;
  return player.mmr_2v2;
}

function getRankForMode(player: PlayerData, mode: string): string | null {
  if (mode === '1v1') return player.rank_1v1;
  if (mode === '2v2') return player.rank_2v2;
  if (mode === '3v3') return player.rank_3v3;
  return player.rank_2v2;
}

function resolveRank(player: PlayerData, mode: string): string | null {
  const rank = getRankForMode(player, mode);
  if (rank && isValidRank(rank)) return normalizeRankName(rank);
  const mmr = getMmrForMode(player, mode);
  if (mmr != null) return getRankFromMmr(mmr);
  return null;
}

const SMOKE_BLUE = [
  'radial-gradient(ellipse 80% 60% at 30% 70%, rgba(37,99,235,0.35) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 80% at 70% 30%, rgba(59,130,246,0.2) 0%, transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 50% 90%, rgba(30,64,175,0.25) 0%, transparent 70%)',
];

const SMOKE_ORANGE = [
  'radial-gradient(ellipse 80% 60% at 70% 70%, rgba(249,115,22,0.35) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 80% at 30% 30%, rgba(251,146,60,0.2) 0%, transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 50% 90%, rgba(194,65,12,0.25) 0%, transparent 70%)',
];

function SmokeLayer({ side }: { side: 'a' | 'b' }) {
  const layers = side === 'a' ? SMOKE_BLUE : SMOKE_ORANGE;
  return (
    <>
      <div
        className="absolute inset-0 animate-smoke-drift pointer-events-none"
        style={{ background: layers[0] }}
      />
      <div
        className="absolute inset-0 animate-smoke-drift-alt pointer-events-none"
        style={{ background: layers[1] }}
      />
      <div
        className="absolute inset-0 animate-smoke-drift pointer-events-none"
        style={{ background: layers[2], animationDelay: '-3s' }}
      />
    </>
  );
}

function MmrHeroText({ mmr, side }: { mmr: number | null; side: 'a' | 'b' }) {
  if (mmr == null) return null;
  const color = side === 'a' ? 'rgba(37,99,235,0.9)' : 'rgba(249,115,22,0.9)';
  return (
    <div
      className="absolute pointer-events-none z-[2]"
      style={{
        top: '48px',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mixBlendMode: 'overlay',
        opacity: 0.45,
        overflow: 'hidden',
      }}
    >
      <span
        className="font-esports font-black select-none"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '98px',
          lineHeight: 0.85,
          letterSpacing: '0.03em',
          color,
        }}
      >
        {mmr}
      </span>
    </div>
  );
}

function PlayerPanel({
  player,
  gameMode,
  side,
  index,
}: {
  player: PlayerData;
  gameMode: string;
  side: 'a' | 'b';
  index: number;
}) {
  const mmr = getMmrForMode(player, gameMode);
  const rank = resolveRank(player, gameMode);
  const displayName = player.nick_in_game ?? player.nick;

  const glassBg =
    side === 'a'
      ? 'rgba(10,15,30,0.75)'
      : 'rgba(30,15,10,0.75)';

  const glowColor = side === 'a' ? '#2563eb' : '#f97316';
  const boxGlow =
    side === 'a'
      ? '0 0 25px rgba(37,99,235,0.3), 0 0 50px rgba(37,99,235,0.1)'
      : '0 0 25px rgba(249,115,22,0.3), 0 0 50px rgba(249,115,22,0.1)';
  const accentColor = side === 'a' ? '#2563eb' : '#f97316';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative w-[160px] h-[320px] overflow-hidden"
      style={{
        background: glassBg,
        clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderTop: `2px solid ${accentColor}`,
        boxShadow: boxGlow,
        transform: 'skewX(-5deg)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <SmokeLayer side={side} />
      <MmrHeroText mmr={mmr} side={side} />

      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center"
        style={{
          height: '48px',
          background: 'rgba(0,0,0,0.5)',
          paddingLeft: '15%',
        }}
      >
        <span
          className="font-esports font-bold text-white uppercase drop-shadow-md block truncate text-center w-full px-2"
          style={{
            letterSpacing: '0.12em',
            fontSize: '11px',
            transform: 'skewX(5deg)',
          }}
          title={displayName}
        >
          {displayName}
        </span>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ transform: 'skewX(5deg)', paddingTop: '24px' }}
      >
        <div className="-mt-4 -ml-2">
          <RankIcon rank={rank} size="xl" glowColor={glowColor} />
        </div>
      </div>
    </motion.div>
  );
}

function TbdPanel({ side }: { side: 'a' | 'b' }) {
  const glassBg = side === 'a' ? 'rgba(10,15,30,0.6)' : 'rgba(30,15,10,0.6)';
  const accentColor = side === 'a' ? '#2563eb' : '#f97316';

  return (
    <div
      className="w-[160px] h-[320px] flex items-center justify-center text-white/30 text-sm font-esports font-bold uppercase"
      style={{
        background: glassBg,
        clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderTop: `2px solid ${accentColor}`,
        transform: 'skewX(-5deg)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ transform: 'skewX(5deg)' }}>TBD</span>
    </div>
  );
}

function TeamBanner({ name, side }: { name: string; side: 'a' | 'b' }) {
  const bg =
    side === 'a'
      ? 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.5) 30%, rgba(37,99,235,0.7) 100%)'
      : 'linear-gradient(270deg, transparent 0%, rgba(249,115,22,0.5) 30%, rgba(249,115,22,0.7) 100%)';
  const textAlign = side === 'a' ? ('right' as const) : ('left' as const);
  const padding = side === 'a'
    ? { paddingRight: '20px' }
    : { paddingLeft: '20px' };
  const margin = side === 'a'
    ? { marginRight: '18px', alignSelf: 'flex-end' as const }
    : { marginLeft: '-12px', alignSelf: 'flex-start' as const };

  return (
    <div
      className="py-2 px-5 font-esports text-base font-bold text-white uppercase tracking-[0.15em]"
      style={{
        width: '450px',
        background: bg,
        transform: 'skewX(-5deg)',
        textAlign,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        ...padding,
        ...margin,
      }}
    >
      <span style={{ transform: 'skewX(5deg)', display: 'block' }}>{name}</span>
    </div>
  );
}

function UpcomingQueueRow({ match }: { match: MatchData }) {
  const teamA = match.team_a?.name ?? 'TBD';
  const teamB = match.team_b?.name ?? 'TBD';

  return (
    <div
      className="flex items-center font-esports text-base font-bold text-white uppercase tracking-[0.15em]"
      style={{
        width: '956px',
        transform: 'skewX(-5deg)',
        background: 'linear-gradient(90deg, rgba(15,23,42,0.92), rgba(20,28,50,0.85), rgba(30,20,15,0.92))',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 20px',
        marginLeft: '-2px',
      }}
    >
      <div className="flex-1 text-right pr-3" style={{ transform: 'skewX(5deg)' }}>
        {teamA}
      </div>

      <div className="flex items-center gap-0 shrink-0" style={{ transform: 'skewX(5deg)' }}>
        <div style={{ width: 3, height: 18, background: '#2563eb', boxShadow: '0 0 6px rgba(37,99,235,0.6)', transform: 'skewX(-5deg)' }} />
        <div className="flex flex-col items-center px-2">
          <span className="text-[10px] text-white/60 tracking-[0.15em] leading-tight">Runda {match.round_index}</span>
          {match.match_index != null && (
            <span className="text-[10px] text-white/60 tracking-[0.15em] leading-tight">Mecz {match.match_index}</span>
          )}
        </div>
        <div style={{ width: 3, height: 18, background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.6)', transform: 'skewX(-5deg)' }} />
      </div>

      <div className="flex-1 text-left pl-3" style={{ transform: 'skewX(5deg)' }}>
        {teamB}
      </div>
    </div>
  );
}

function UpcomingQueue({ matches }: { matches: MatchData[] }) {
  const opacities = [0.8, 0.6, 0.4, 0.25];

  if (matches.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-[2px] mt-1" style={{ marginLeft: '3px' }}>
      <AnimatePresence mode="popLayout">
        {matches.slice(0, 4).map((m, i) => (
          <motion.div
            key={m.match_id}
            layout
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: opacities[i] ?? 0.2, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <UpcomingQueueRow match={m} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function HeaderPanel({ roundIndex, matchIndex, bestOf }: { roundIndex: number; matchIndex?: number; bestOf: number }) {
  return (
    <div className="relative flex items-center justify-center gap-0 mb-8">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px]"
        style={{
          background: 'linear-gradient(90deg, rgba(37,99,235,0.6) 0%, rgba(37,99,235,0) 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.15) 55%, rgba(249,115,22,0) 70%, rgba(249,115,22,0.6) 100%)',
          boxShadow: '0 0 8px rgba(37,99,235,0.3), 0 0 8px rgba(249,115,22,0.3)',
        }}
      />
      <div
        className="absolute left-[10%] top-1/2 w-[1px] h-6"
        style={{ background: 'linear-gradient(180deg, rgba(37,99,235,0.5), transparent)' }}
      />
      <div
        className="absolute right-[10%] top-1/2 w-[1px] h-6"
        style={{ background: 'linear-gradient(180deg, rgba(249,115,22,0.5), transparent)' }}
      />

      <div
        className="relative z-10 px-5 py-2 font-esports text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]"
        style={{
          background: 'rgba(10,15,30,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          transform: 'skewX(-5deg)',
          clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
        }}
      >
        <span style={{ transform: 'skewX(5deg)', display: 'block' }}>Runda {roundIndex}{matchIndex != null ? ` Mecz ${matchIndex}` : ''}</span>
      </div>

      <div
        className="relative z-20 px-8 py-2.5 mx-1"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #d4d4d8 100%)',
          transform: 'skewX(-15deg)',
          boxShadow: '0 2px 15px rgba(255,255,255,0.1)',
        }}
      >
        <span
          className="font-esports text-sm font-black uppercase tracking-[0.25em] text-black"
          style={{ transform: 'skewX(15deg)', display: 'block' }}
        >
          Wkrótce
        </span>
      </div>

      <div
        className="relative z-10 px-5 py-2 font-esports text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]"
        style={{
          background: 'rgba(30,15,10,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          transform: 'skewX(-5deg)',
          clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
        }}
      >
        <span style={{ transform: 'skewX(5deg)', display: 'block' }}>Format BO{bestOf}</span>
      </div>
    </div>
  );
}

export function MatchCard({ match, gameMode, upcomingMatches = [] }: MatchCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="p-6"
    >
      {/* Header */}
      <HeaderPanel roundIndex={match.round_index} matchIndex={match.match_index} bestOf={match.best_of} />

      {/* Players + VERSUS */}
      <div className="flex items-stretch justify-center">
        {/* Team A wrapper */}
        <div className="team-blue-wrapper flex flex-col items-end">
          <div className="flex" style={{ marginRight: '-8px' }}>
            {match.team_a?.players.map((p, i) => (
              <PlayerPanel key={p.discord_id} player={p} gameMode={gameMode} side="a" index={i} />
            )) ?? <TbdPanel side="a" />}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <TeamBanner name={match.team_a?.name ?? 'TBD'} side="a" />
          </div>
        </div>

        {/* VERSUS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-3 flex items-center justify-center z-10 self-center"
        >
          <span
            className="font-esports text-white/80 font-bold text-4xl uppercase tracking-[0.3em]"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            VS
          </span>
        </motion.div>

        {/* Team B wrapper */}
        <div className="team-orange-wrapper flex flex-col items-start">
          <div className="flex" style={{ marginLeft: '-8px' }}>
            {match.team_b?.players.map((p, i) => (
              <PlayerPanel key={p.discord_id} player={p} gameMode={gameMode} side="b" index={i + 2} />
            )) ?? <TbdPanel side="b" />}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <TeamBanner name={match.team_b?.name ?? 'TBD'} side="b" />
          </div>
        </div>
      </div>

      {/* Upcoming matches queue */}
      <UpcomingQueue matches={upcomingMatches} />
    </motion.div>
  );
}