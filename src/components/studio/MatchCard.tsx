import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Check, Clock } from 'lucide-react';
import type { MatchData, PlayerData, PollResults, TeamData } from '@/types/studio';
import { RankIcon } from './RankIcon';
import { getRankFromMmr, normalizeRankName, isValidRank } from '@/lib/rank-utils';
import { isFullyTbdMatch } from '@/lib/studio-match-utils';
import { STUDIO_CONTENT_MAX_WIDTH } from '@/lib/studio-layout';
import {
  type StudioTheme,
  glassBarBlue,
  glassBarOrange,
  glassBarDead,
  glassChip,
  glassScoreBox,
  glassScoreDigitWin,
  glassSpecularSweep,
  chamferLeft,
  chamferRight,
  chamferTag,
  glassTitleCool,
  glassTitleWarm,
  glassName,
  glassNameDead,
  glassLabel,
  glassContentLayer,
} from '@/lib/studio-glass-theme';
import {
  NB_ACID,
  NB_BLUE,
  NB_BORDER,
  NB_BORDER_THIN,
  NB_DIM,
  NB_FONT,
  NB_INK,
  NB_MONO,
  NB_ORANGE,
  NB_WHITE,
  nbShadow,
  nbShadowSmall,
} from '@/lib/studio-neobrutal-theme';

function formatCheckInTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface MatchCardProps {
  match: MatchData;
  gameMode: string;
  upcomingMatches?: MatchData[];
  pollResults?: PollResults;
  theme?: StudioTheme;
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
  const color = '#ffffff';
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
        mixBlendMode: 'normal' as const,
        opacity: 0.25,
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
  theme = 'standard',
}: {
  player: PlayerData;
  gameMode: string;
  side: 'a' | 'b';
  index: number;
  theme?: StudioTheme;
}) {
  const mmr = getMmrForMode(player, gameMode);
  const rank = resolveRank(player, gameMode);
  const displayName = player.nick_in_game ?? player.nick;
  const isGlass = theme === 'sharp-glass';

  const fallbackBg =
    side === 'a'
      ? 'rgba(10,15,30,0.85)'
      : 'rgba(30,15,10,0.85)';

  const glowColor = side === 'a' ? '#2563eb' : '#f97316';
  const boxGlow =
    side === 'a'
      ? '0 0 25px rgba(37,99,235,0.3), 0 0 50px rgba(37,99,235,0.1)'
      : '0 0 25px rgba(249,115,22,0.3), 0 0 50px rgba(249,115,22,0.1)';
  const accentColor = side === 'a' ? '#2563eb' : '#f97316';

  const glassPanel = side === 'a' ? glassBarBlue : glassBarOrange;
  const glassChamfer = side === 'a' ? chamferLeft(14) : chamferRight(14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative w-[160px] h-[320px] overflow-hidden"
      style={isGlass
        ? { ...glassPanel, ...glassChamfer, boxShadow: boxGlow }
        : {
            background: fallbackBg,
            clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: `2px solid ${accentColor}`,
            boxShadow: boxGlow,
            transform: 'skewX(-5deg)',
            backdropFilter: 'blur(15px)',
          }}
    >
      {isGlass && <div style={glassSpecularSweep} aria-hidden />}
      <SmokeLayer side={side} />
      <MmrHeroText mmr={mmr} side={side} />

      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center"
        style={{
          height: '48px',
          background: 'rgba(0,0,0,0.75)',
          paddingLeft: isGlass ? 0 : '15%',
        }}
      >
        <span
          className="font-bold text-white uppercase drop-shadow-md block truncate text-center w-full px-2"
          style={isGlass
            ? { ...glassName, fontSize: 13 }
            : {
                letterSpacing: '0.12em',
                fontSize: '11px',
                fontFamily: 'Rajdhani, Inter, sans-serif',
                transform: 'skewX(5deg)',
              }}
          title={displayName}
        >
          {displayName}
        </span>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ transform: isGlass ? undefined : 'skewX(5deg)', paddingTop: '24px' }}
      >
        <div className="-mt-4 -ml-2">
          <RankIcon rank={rank} size="xl" glowColor={glowColor} />
        </div>
      </div>
    </motion.div>
  );
}

function TbdPanel({ side, theme = 'standard' }: { side: 'a' | 'b'; theme?: StudioTheme }) {
  const isGlass = theme === 'sharp-glass';
  const glassBg = side === 'a' ? 'rgba(10,15,30,0.6)' : 'rgba(30,15,10,0.6)';
  const accentColor = side === 'a' ? '#2563eb' : '#f97316';

  return (
    <div
      className="w-[160px] h-[320px] flex items-center justify-center text-white/30 text-sm font-esports font-bold uppercase"
      style={isGlass
        ? { ...glassBarDead, ...(side === 'a' ? chamferLeft(14) : chamferRight(14)) }
        : {
            background: glassBg,
            clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: `2px solid ${accentColor}`,
            transform: 'skewX(-5deg)',
            backdropFilter: 'blur(10px)',
          }}
    >
      <span style={isGlass ? glassNameDead : { transform: 'skewX(5deg)' }}>TBD</span>
    </div>
  );
}

function CheckInBadge({ team, side }: { team: TeamData | null; side: 'a' | 'b' }) {
  if (!team) return null;
  const checkedIn = team.checked_in === true;
  const time = formatCheckInTime(team.checked_in_at);
  const color = checkedIn ? '#22c55e' : 'rgba(255,255,255,0.4)';
  const label = checkedIn ? (time || 'OK') : 'Oczekuje';

  return (
    <div
      className="flex items-center gap-1 font-esports font-bold uppercase"
      style={{
        fontSize: '10px',
        letterSpacing: '0.15em',
        color,
        flexDirection: side === 'a' ? 'row-reverse' : 'row',
        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
      }}
    >
      {checkedIn ? <Check size={11} strokeWidth={3} /> : <Clock size={11} strokeWidth={2.5} />}
      <span>{label}</span>
    </div>
  );
}

function TeamBanner({ name, side, pollPct, team, theme = 'standard' }: { name: string; side: 'a' | 'b'; pollPct?: number; team: TeamData | null; theme?: StudioTheme }) {
  const isGlass = theme === 'sharp-glass';
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

  const checkedIn = team?.checked_in === true;
  const checkIcon = checkedIn ? (
    <Check
      size={18}
      strokeWidth={3}
      color="#22c55e"
      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7)) drop-shadow(0 0 6px rgba(34,197,94,0.5))', flexShrink: 0 }}
    />
  ) : null;

  const banner = (
    <div style={{ ...margin }}>
      <div
        className="py-2 px-5 text-base font-bold text-white uppercase tracking-[0.15em] relative"
        style={isGlass
          ? {
              width: '360px',
              marginLeft: side === 'a' ? 'auto' : undefined,
              marginRight: side === 'b' ? 'auto' : undefined,
              ...(side === 'a' ? glassBarBlue : glassBarOrange),
              ...(side === 'a' ? chamferRight(12) : chamferLeft(12)),
              textAlign,
              ...padding,
            }
          : {
              width: '450px',
              background: bg,
              transform: 'skewX(-5deg)',
              textAlign,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              fontFamily: 'Rajdhani, Inter, sans-serif',
              ...padding,
            }}
      >
        {isGlass && <div style={glassSpecularSweep} aria-hidden />}
        <span
          style={isGlass ? {
            ...glassContentLayer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          } : {
            transform: 'skewX(5deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          {side === 'a' ? checkIcon : <span style={{ width: 0 }} />}
          <span style={isGlass ? { ...glassName, flex: 1, textAlign, overflow: 'hidden', textOverflow: 'ellipsis' } : { flex: 1, textAlign }}>{name}</span>
          {side === 'b' ? checkIcon : <span style={{ width: 0 }} />}
        </span>
      </div>
      <div
        className="mt-1 flex"
        style={{
          justifyContent: side === 'a' ? 'flex-end' : 'flex-start',
          paddingLeft: side === 'a' ? 0 : '20px',
          paddingRight: side === 'a' ? '20px' : 0,
        }}
      >
        <CheckInBadge team={team} side={side} />
      </div>
    </div>
  );

  if (side === 'a' && pollPct != null) {
    return (
      <div className="flex items-center">
        <div
          className="flex items-center gap-1 text-white font-esports font-bold text-base uppercase tracking-[0.15em] shrink-0"
          style={{ marginRight: '8px', transform: isGlass ? undefined : 'skewX(-5deg)', textShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
        >
          <BarChart3 size={16} />
          <span>{pollPct}%</span>
        </div>
        {banner}
      </div>
    );
  }

  return banner;
}

function UpcomingQueueRow({ match, pollPct, theme = 'standard' }: { match: MatchData; pollPct?: number; theme?: StudioTheme }) {
  const isGlass = theme === 'sharp-glass';
  const teamA = match.team_a?.name ?? 'TBD';
  const teamB = match.team_b?.name ?? 'TBD';
  const aCheckedIn = match.team_a?.checked_in === true;
  const bCheckedIn = match.team_b?.checked_in === true;
  const checkIcon = (
    <Check
      size={14}
      strokeWidth={3}
      color="#22c55e"
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7)) drop-shadow(0 0 4px rgba(34,197,94,0.5))',
        flexShrink: 0,
      }}
    />
  );

  const row = (
    <div
      className="flex items-center text-base font-bold text-white uppercase tracking-[0.15em] relative"
      style={isGlass
        ? { width: '956px', ...glassBarDead, padding: '8px 20px', marginLeft: '-2px' }
        : {
            width: '956px',
            transform: 'skewX(-5deg)',
            background: 'linear-gradient(90deg, rgba(15,23,42,0.92), rgba(20,28,50,0.85), rgba(30,20,15,0.92))',
            border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'Rajdhani, Inter, sans-serif',
            padding: '8px 20px',
            marginLeft: '-2px',
          }}
    >
      {isGlass && <div style={glassSpecularSweep} aria-hidden />}
      <div className="flex-1 flex items-center pr-3 relative" style={isGlass ? glassContentLayer : { transform: 'skewX(5deg)' }}>
        {aCheckedIn && (
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
            {checkIcon}
          </div>
        )}
        <span className="truncate w-full text-right" style={isGlass ? glassName : undefined}>{teamA}</span>
      </div>

      <div className="flex items-center gap-0 shrink-0" style={isGlass ? { ...glassChip, ...chamferTag, padding: '4px 10px', ...glassContentLayer } : { transform: 'skewX(5deg)' }}>
        {!isGlass && <div style={{ width: 3, height: 18, background: '#2563eb', boxShadow: '0 0 6px rgba(37,99,235,0.6)', transform: 'skewX(-5deg)' }} />}
        <div className="flex flex-col items-center px-2">
          <span className="text-[10px] text-white/60 tracking-[0.15em] leading-tight">Runda {match.round_index}</span>
          {match.match_index != null && (
            <span className="text-[10px] text-white/60 tracking-[0.15em] leading-tight">Mecz {match.match_index}</span>
          )}
        </div>
        {!isGlass && <div style={{ width: 3, height: 18, background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.6)', transform: 'skewX(-5deg)' }} />}
      </div>

      <div className="flex-1 flex items-center pl-3 relative" style={isGlass ? glassContentLayer : { transform: 'skewX(5deg)' }}>
        <span className="truncate w-full text-left" style={isGlass ? glassName : undefined}>{teamB}</span>
        {bCheckedIn && (
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
            {checkIcon}
          </div>
        )}
      </div>
    </div>
  );

  if (pollPct != null) {
    return (
      <div className="flex items-center">
        <div
          className="flex items-center gap-1 text-white font-esports font-bold text-base uppercase tracking-[0.15em] shrink-0"
          style={{ marginRight: '8px', transform: isGlass ? undefined : 'skewX(-5deg)', textShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
        >
          <BarChart3 size={16} />
          <span>{pollPct}%</span>
        </div>
        {row}
      </div>
    );
  }

  return row;
}

function UpcomingQueue({ matches, pollResults, theme }: { matches: MatchData[]; pollResults?: PollResults; theme?: StudioTheme }) {
  const visible = matches.filter((m) => !isFullyTbdMatch(m));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-[2px] mt-1" style={{ marginLeft: '3px' }}>
      <AnimatePresence mode="popLayout">
        {visible.map((m) => {
          const pollKey = `Runda ${m.round_index} Mecz ${m.match_index ?? '?'}`;
          return (
            <motion.div
              key={m.match_id}
              layout
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <UpcomingQueueRow match={m} pollPct={pollResults?.[pollKey]} theme={theme} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function HeaderPanel({ roundIndex, matchIndex, bestOf, theme = 'standard' }: { roundIndex: number; matchIndex?: number; bestOf: number; theme?: StudioTheme }) {
  const isGlass = theme === 'sharp-glass';
  if (isGlass) {
    const H = 28;
    return (
      <div className="relative flex items-center justify-center mb-8" style={{ gap: 8 }}>
        {/* Left: round/match */}
        <div
          className="relative flex items-center justify-center px-5"
          style={{ height: H, ...glassBarDead, ...chamferTag }}
        >
          <div style={glassSpecularSweep} aria-hidden />
          <span style={{ ...glassLabel, fontSize: 10.5, ...glassContentLayer }}>
            Runda {roundIndex}{matchIndex != null ? ` Mecz ${matchIndex}` : ''}
          </span>
        </div>
        {/* Center: WKRÓTCE — same shape, distinguished by material + glow */}
        <div
          className="relative flex items-center justify-center px-6"
          style={{ height: H, ...glassScoreBox, ...chamferTag }}
        >
          <div style={glassSpecularSweep} aria-hidden />
          <span
            className="uppercase tracking-[0.25em]"
            style={{
              ...glassContentLayer,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 13,
              ...glassScoreDigitWin,
            }}
          >
            Wkrótce
          </span>
        </div>
        {/* Right: BOx */}
        <div
          className="relative flex items-center justify-center px-5"
          style={{ height: H, ...glassBarOrange, ...chamferTag }}
        >
          <div style={glassSpecularSweep} aria-hidden />
          <span style={{ ...glassLabel, fontSize: 10.5, ...glassContentLayer }}>
            Format BO{bestOf}
          </span>
        </div>
      </div>
    );
  }
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
        className="relative z-10 px-5 py-2 text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]"
        style={isGlass
          ? { ...glassTitleCool }
          : {
              background: 'rgba(10,15,30,0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Rajdhani, Inter, sans-serif',
              transform: 'skewX(-5deg)',
              clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
            }}
      >
        {isGlass && <div style={glassSpecularSweep} aria-hidden />}
        <span style={isGlass ? { ...glassLabel, fontSize: 11, ...glassContentLayer, display: 'block' } : { transform: 'skewX(5deg)', display: 'block' }}>Runda {roundIndex}{matchIndex != null ? ` Mecz ${matchIndex}` : ''}</span>
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
        className="relative z-10 px-5 py-2 text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]"
        style={isGlass
          ? { ...glassTitleWarm }
          : {
              background: 'rgba(30,15,10,0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Rajdhani, Inter, sans-serif',
              transform: 'skewX(-5deg)',
              clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
            }}
      >
        {isGlass && <div style={glassSpecularSweep} aria-hidden />}
        <span style={isGlass ? { ...glassLabel, fontSize: 11, ...glassContentLayer, display: 'block' } : { transform: 'skewX(5deg)', display: 'block' }}>Format BO{bestOf}</span>
      </div>
    </div>
  );
}

export function MatchCard({ match, gameMode, upcomingMatches = [], pollResults, theme = 'standard' }: MatchCardProps) {
  const activePollKey = `Runda ${match.round_index} Mecz ${match.match_index ?? '?'}`;
  const activePollPct = pollResults?.[activePollKey];

  if (theme === 'neobrutal') {
    return (
      <NbMatchView
        match={match}
        gameMode={gameMode}
        upcomingMatches={upcomingMatches}
        pollResults={pollResults}
      />
    );
  }

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
      <HeaderPanel roundIndex={match.round_index} matchIndex={match.match_index} bestOf={match.best_of} theme={theme} />

      {/* Players + VERSUS */}
      <div className="flex items-stretch justify-center">
        {/* Team A wrapper */}
        <div className="team-blue-wrapper flex flex-col items-end">
          <div className="flex" style={{ marginRight: '-8px' }}>
            {match.team_a?.players.map((p, i) => (
              <PlayerPanel key={p.discord_id} player={p} gameMode={gameMode} side="a" index={i} theme={theme} />
            )) ?? <TbdPanel side="a" theme={theme} />}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <TeamBanner name={match.team_a?.name ?? 'TBD'} side="a" pollPct={activePollPct} team={match.team_a} theme={theme} />
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
              <PlayerPanel key={p.discord_id} player={p} gameMode={gameMode} side="b" index={i + 2} theme={theme} />
            )) ?? <TbdPanel side="b" theme={theme} />}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <TeamBanner name={match.team_b?.name ?? 'TBD'} side="b" team={match.team_b} theme={theme} />
          </div>
        </div>
      </div>

      {/* Upcoming matches queue */}
      <UpcomingQueue matches={upcomingMatches} pollResults={pollResults} theme={theme} />
    </motion.div>
  );
}

/* ───────────────────── NEO-BRUTALISM ───────────────────── */

function formatMatchTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function NbRow({
  match,
  active,
  pollPct,
}: {
  match: MatchData;
  active?: boolean;
  pollPct?: number;
}) {
  const H = active ? 84 : 60;
  const nameFs = active ? 28 : 20;
  const seedFs = active ? 26 : 18;
  const vsFs = active ? 22 : 16;
  const teamA = match.team_a?.name ?? 'TBD';
  const teamB = match.team_b?.name ?? 'TBD';
  const seedA = match.team_a?.seed;
  const seedB = match.team_b?.seed;
  const time = formatMatchTime(match.scheduled_at);

  const nameCell = (
    name: string,
    align: 'left' | 'right',
    accent: string,
    isTbd: boolean,
  ): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    height: '100%',
    background: NB_WHITE,
    border: NB_BORDER,
    borderRight: 'none',
    borderLeft: align === 'left' ? 'none' : NB_BORDER,
    borderBottom: `8px solid ${accent}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
    padding: '0 18px',
    fontFamily: NB_FONT,
    fontWeight: 900,
    fontSize: nameFs,
    textTransform: 'uppercase',
    color: isTbd ? NB_DIM : NB_INK,
    letterSpacing: '-.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: H,
        boxShadow: active ? nbShadow : nbShadowSmall,
        marginBottom: active ? 24 : 12,
      }}
    >
      {/* Seed A */}
      <div
        style={{
          width: H,
          background: NB_INK,
          border: NB_BORDER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: NB_ACID,
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: seedFs,
        }}
      >
        {seedA ?? '·'}
      </div>
      {/* Name A */}
      <div style={nameCell(teamA, 'right', NB_BLUE, !match.team_a)}>{teamA}</div>
      {/* VS */}
      <div
        style={{
          width: active ? 72 : 56,
          background: NB_ACID,
          border: NB_BORDER,
          borderLeft: 'none',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: vsFs,
          color: NB_INK,
        }}
      >
        <span>VS</span>
        {pollPct != null && (
          <span
            style={{
              fontFamily: NB_MONO,
              fontSize: 9,
              letterSpacing: '.1em',
              marginTop: 2,
            }}
          >
            {pollPct}%
          </span>
        )}
      </div>
      {/* Name B */}
      <div style={nameCell(teamB, 'left', NB_ORANGE, !match.team_b)}>{teamB}</div>
      {/* Seed B */}
      <div
        style={{
          width: H,
          background: NB_INK,
          border: NB_BORDER,
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: NB_ACID,
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: seedFs,
        }}
      >
        {seedB ?? '·'}
      </div>
      {/* Time */}
      <div
        style={{
          minWidth: active ? 168 : 130,
          background: NB_INK,
          border: NB_BORDER,
          borderLeft: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: NB_WHITE,
          padding: '0 14px',
        }}
      >
        <span
          style={{
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: active ? 26 : 20,
            lineHeight: 1,
          }}
        >
          {time}
        </span>
        <span
          style={{
            fontFamily: NB_MONO,
            fontSize: 9,
            letterSpacing: '.16em',
            color: NB_ACID,
            marginTop: 3,
            textTransform: 'uppercase',
          }}
        >
          R{match.round_index}
          {match.match_index != null ? ` · M${match.match_index}` : ''} · BO{match.best_of}
        </span>
      </div>
    </div>
  );
}

function NbMatchView({
  match,
  gameMode,
  upcomingMatches,
  pollResults,
}: {
  match: MatchData;
  gameMode: string;
  upcomingMatches: MatchData[];
  pollResults?: PollResults;
}) {
  const visibleUpcoming = upcomingMatches.filter((m) => !isFullyTbdMatch(m));
  const activeKey = `Runda ${match.round_index} Mecz ${match.match_index ?? '?'}`;
  const playersPerTeam =
    gameMode === '1v1' ? 1 : gameMode === '3v3' ? 3 : 2;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ width: '100%', maxWidth: STUDIO_CONTENT_MAX_WIDTH }}
    >
      <NbHeader
        roundIndex={match.round_index}
        matchIndex={match.match_index}
        bestOf={match.best_of}
      />
      <NbActiveMatchBlock
        match={match}
        gameMode={gameMode}
        playersPerTeam={playersPerTeam}
        pollPct={pollResults?.[activeKey]}
      />
      {visibleUpcoming.length > 0 && (
        <div
          style={{
            fontFamily: NB_MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: NB_INK,
            border: NB_BORDER_THIN,
            display: 'inline-block',
            padding: '2px 10px',
            background: NB_WHITE,
            margin: '18px 0 10px',
          }}
        >
          Następne
        </div>
      )}
      <AnimatePresence mode="popLayout">
        {visibleUpcoming.map((m) => {
          const key = `Runda ${m.round_index} Mecz ${m.match_index ?? '?'}`;
          return (
            <motion.div
              key={m.match_id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <NbRow match={m} pollPct={pollResults?.[key]} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

/* ───── NEO-BRUTALISM: nagłówek + panele graczy + bannery ───── */

function NbHeader({
  roundIndex,
  matchIndex,
  bestOf,
}: {
  roundIndex: number;
  matchIndex?: number;
  bestOf: number;
}) {
  const cell: React.CSSProperties = {
    border: NB_BORDER,
    padding: '10px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: NB_MONO,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    color: NB_INK,
    background: NB_WHITE,
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        boxShadow: nbShadowSmall,
        marginBottom: 16,
      }}
    >
      <div style={{ ...cell, flex: 1 }}>
        R{roundIndex}
        {matchIndex != null ? ` · M${matchIndex}` : ''}
      </div>
      <div
        style={{
          ...cell,
          marginLeft: -3,
          background: NB_ACID,
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 18,
          letterSpacing: '.2em',
          padding: '10px 28px',
        }}
      >
        Wkrótce
      </div>
      <div style={{ ...cell, marginLeft: -3, flex: 1 }}>FORMAT BO{bestOf}</div>
    </div>
  );
}

function NbActiveMatchBlock({
  match,
  gameMode,
  playersPerTeam,
  pollPct,
}: {
  match: MatchData;
  gameMode: string;
  playersPerTeam: number;
  pollPct?: number;
}) {
  // Layout: panel widths scale to STUDIO_CONTENT_MAX_WIDTH (956)
  const VS_W = 72;
  const PANEL_GAP = 6;
  const sideW = (STUDIO_CONTENT_MAX_WIDTH - VS_W) / 2; // ≈ 442
  const panelW = Math.floor(
    (sideW - PANEL_GAP * (playersPerTeam - 1)) / playersPerTeam,
  );
  const panelH = playersPerTeam >= 3 ? 240 : 260;
  const iconSize = playersPerTeam >= 3 ? 'lg' : 'xl';

  const aPlayers = match.team_a?.players?.slice(0, playersPerTeam) ?? [];
  const bPlayers = match.team_b?.players?.slice(0, playersPerTeam) ?? [];
  const aSlots = Array.from({ length: playersPerTeam }, (_, i) => aPlayers[i] ?? null);
  const bSlots = Array.from({ length: playersPerTeam }, (_, i) => bPlayers[i] ?? null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {/* Side A */}
        <div style={{ width: sideW, display: 'flex', gap: PANEL_GAP }}>
          {aSlots.map((p, i) => (
            <NbPlayerPanel
              key={p?.discord_id ?? `a-${i}`}
              player={p}
              side="a"
              gameMode={gameMode}
              width={panelW}
              height={panelH}
              iconSize={iconSize}
              index={i}
            />
          ))}
        </div>
        {/* VS */}
        <div
          style={{
            width: VS_W,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: NB_ACID,
            border: NB_BORDER,
            boxShadow: nbShadow,
            marginLeft: -3,
            marginRight: -3,
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: NB_FONT,
              fontWeight: 900,
              fontSize: 32,
              color: NB_INK,
              letterSpacing: '-.02em',
            }}
          >
            VS
          </span>
          {pollPct != null && (
            <span
              style={{
                fontFamily: NB_MONO,
                fontSize: 10,
                letterSpacing: '.12em',
                color: NB_INK,
                marginTop: 4,
              }}
            >
              {pollPct}%
            </span>
          )}
        </div>
        {/* Side B */}
        <div style={{ width: sideW, display: 'flex', gap: PANEL_GAP }}>
          {bSlots.map((p, i) => (
            <NbPlayerPanel
              key={p?.discord_id ?? `b-${i}`}
              player={p}
              side="b"
              gameMode={gameMode}
              width={panelW}
              height={panelH}
              iconSize={iconSize}
              index={i + playersPerTeam}
            />
          ))}
        </div>
      </div>

      {/* Team banners */}
      <div style={{ display: 'flex', gap: 0, marginTop: 14 }}>
        <NbTeamBanner
          name={match.team_a?.name ?? 'TBD'}
          side="a"
          team={match.team_a}
          width={sideW + VS_W / 2}
        />
        <NbTeamBanner
          name={match.team_b?.name ?? 'TBD'}
          side="b"
          team={match.team_b}
          width={sideW + VS_W / 2}
        />
      </div>
    </div>
  );
}

function NbPlayerPanel({
  player,
  side,
  gameMode,
  width,
  height,
  iconSize,
  index,
}: {
  player: PlayerData | null;
  side: 'a' | 'b';
  gameMode: string;
  width: number;
  height: number;
  iconSize: 'lg' | 'xl';
  index: number;
}) {
  const accent = side === 'a' ? NB_BLUE : NB_ORANGE;

  if (!player) {
    return (
      <div
        style={{
          width,
          height,
          border: NB_BORDER,
          boxShadow: nbShadowSmall,
          background: NB_WHITE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: 24,
          color: NB_DIM,
          textTransform: 'uppercase',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 10,
            background: accent,
            borderTop: NB_BORDER,
          }}
        />
        TBD
      </div>
    );
  }

  const mmr = getMmrForMode(player, gameMode);
  const rank = resolveRank(player, gameMode);
  const displayName = player.nick_in_game ?? player.nick;
  const nameFs = iconSize === 'xl' ? 14 : 11;
  const fallbackMmr =
    mmr ?? player.mmr_2v2 ?? player.mmr_3v3 ?? player.mmr_1v1 ?? null;
  const mmrLabel = fallbackMmr != null ? `MMR · ${fallbackMmr}` : 'MMR · —';
  const mmrFs = iconSize === 'xl' ? 16 : 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      style={{
        width,
        height,
        border: NB_BORDER,
        boxShadow: nbShadow,
        background: NB_WHITE,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* MMR watermark */}
      {fallbackMmr != null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontFamily: NB_FONT,
              fontWeight: 900,
              fontSize: 92,
              lineHeight: 0.85,
              color: 'rgba(17,17,17,.08)',
              userSelect: 'none',
            }}
          >
            {fallbackMmr}
          </span>
        </div>
      )}

      {/* Top name bar */}
      <div
        style={{
          height: 36,
          background: NB_INK,
          color: NB_WHITE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px',
          borderBottom: NB_BORDER,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span
          title={displayName}
          style={{
            fontFamily: NB_FONT,
            fontWeight: 800,
            fontSize: nameFs,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {displayName}
        </span>
      </div>

      {/* Rank icon */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <RankIcon rank={rank} size={iconSize} />
      </div>

      {/* MMR strip */}
      <div
        style={{
          padding: '6px 10px',
          fontFamily: NB_MONO,
          fontSize: mmrFs,
          fontWeight: 800,
          letterSpacing: '.12em',
          color: NB_INK,
          textTransform: 'uppercase',
          borderTop: NB_BORDER,
          background: NB_ACID,
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {mmrLabel}
      </div>

      {/* Accent bottom bar */}
      <div
        style={{
          height: 10,
          background: accent,
          borderTop: NB_BORDER,
          position: 'relative',
          zIndex: 2,
        }}
      />
    </motion.div>
  );
}

function NbTeamBanner({
  name,
  side,
  team,
  width,
}: {
  name: string;
  side: 'a' | 'b';
  team: TeamData | null;
  width: number;
}) {
  const bg = side === 'a' ? NB_BLUE : NB_ORANGE;
  const checkedIn = team?.checked_in === true;
  const statusText = checkedIn
    ? `CHECK-IN · ${formatMatchTime(team?.checked_in_at)}`
    : 'OCZEKUJE';
  const statusColor = checkedIn ? NB_INK : NB_DIM;

  return (
    <div
      style={{
        width,
        marginLeft: side === 'b' ? -3 : 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: bg,
          color: NB_WHITE,
          border: NB_BORDER,
          boxShadow: nbShadow,
          padding: '12px 18px',
          fontFamily: NB_FONT,
          fontWeight: 900,
          fontSize: 22,
          textTransform: 'uppercase',
          letterSpacing: '-.01em',
          textAlign: side === 'a' ? 'right' : 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={name}
      >
        {name}
      </div>
      <div
        style={{
          marginTop: 4,
          padding: '0 6px',
          fontFamily: NB_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.2em',
          color: statusColor,
          textTransform: 'uppercase',
          textAlign: side === 'a' ? 'right' : 'left',
        }}
      >
        {statusText}
      </div>
    </div>
  );
}