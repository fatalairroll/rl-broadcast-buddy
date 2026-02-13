import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBroadcast } from '@/hooks/useBroadcast';
import type { GameState, OverlayConfig, PlayerState, ElementShape, GradientConfig } from '@/types/broadcast';
import { defaultOverlayConfig } from '@/types/broadcast';
import { getShapeStyle } from '@/components/ui/shape-picker';
import { getBackgroundStyle } from '@/lib/gradient-utils';
import { getGlowStyle } from '@/lib/glow-utils';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function splitTeamName(name: string, maxChars: number): string[] {
  if (maxChars <= 0 || name.length <= maxChars) return [name];
  const words = name.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if (currentLine && (currentLine.length + 1 + word.length) > maxChars) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function normalizeBoost(value: number, max: number = 100): number {
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

function getBoostColor(boost: number): string {
  if (boost >= 75) return 'hsl(217, 91%, 60%)';
  if (boost >= 50) return 'hsl(142, 76%, 46%)';
  if (boost >= 25) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 84%, 60%)';
}

function getShapeStyleForScoreboard(shape: ElementShape, borderRadius: number): React.CSSProperties {
  switch (shape) {
    case 'skewed':
      return { 
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        borderRadius: 0,
      };
    case 'sharp':
      return { borderRadius: 0 };
    case 'pill':
      return { borderRadius: 9999 };
    case 'hexagon':
      return { 
        clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
        borderRadius: 0,
      };
    case 'parallelogram':
      return { 
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        borderRadius: 0,
      };
    case 'rounded':
    default:
      return { borderRadius };
  }
}

export default function Overlay() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || undefined;
  const { session, gameState, overlayConfig } = useBroadcast(sessionId);
  const config = overlayConfig; // Use config from preset linked to session

  // Mock game state for development
  const [mockGameState] = useState<GameState>({
    players: [
      { id: '1', name: 'BUZZ', team: 0, boost: 33, goals: 2, shots: 5, assists: 1, saves: 0, demos: 1, score: 450, isPrimary: true },
      { id: '2', name: 'FURY', team: 0, boost: 0, goals: 0, shots: 2, assists: 1, saves: 2, demos: 0, score: 180, isPrimary: false },
      { id: '3', name: 'HOLLYWOOD', team: 0, boost: 4, goals: 1, shots: 3, assists: 0, saves: 1, demos: 2, score: 290, isPrimary: false },
      { id: '4', name: 'BANDIT', team: 1, boost: 8, goals: 1, shots: 4, assists: 0, saves: 0, demos: 1, score: 220, isPrimary: false },
      { id: '5', name: 'CHIPPER', team: 1, boost: 33, goals: 0, shots: 1, assists: 1, saves: 3, demos: 0, score: 200, isPrimary: false },
      { id: '6', name: 'REX', team: 1, boost: 100, goals: 0, shots: 2, assists: 0, saves: 1, demos: 3, score: 130, isPrimary: false },
    ],
    teams: { blue: { score: 1 }, orange: { score: 5 } },
    ball: { speed: 87, location: { x: 0, y: 0, z: 100 } },
    game: { time: 121, isOT: false, hasTarget: true },
  });

  const currentGameState = gameState || mockGameState;
  const blueTeamPlayers = currentGameState.players.filter((p) => p.team === 0);
  const orangeTeamPlayers = currentGameState.players.filter((p) => p.team === 1);
  const targetPlayer = currentGameState.players.find((p) => p.isPrimary);

  const getSeriesDotsCount = () => {
    const seriesType = session?.series_type || 'bo5';
    switch (seriesType) {
      case 'bo1': return 0;
      case 'bo3': return 2;
      case 'bo5': return 3;
      case 'bo7': return 4;
      default: return 3;
    }
  };

  const teamAWins = session?.team_a_series_score || 0;
  const teamBWins = session?.team_b_series_score || 0;
  const seriesDotsCount = getSeriesDotsCount();

  return (
    <div className="w-screen h-screen overflow-hidden relative overlay-transparent">
      {/* Main Scoreboard - New Professional Layout */}
      {config.scoreboard.visible && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${config.scoreboard.position.x}%`,
            top: `${config.scoreboard.position.y}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Main scoreboard bar */}
          <div
            className="flex items-center justify-center"
            style={{
              width: config.scoreboard.width,
              minWidth: config.scoreboard.width,
              ...getBackgroundStyle(config.scoreboard.backgroundColor, config.scoreboard.backgroundGradient),
              border: `${config.scoreboard.borderWidth}px solid ${config.scoreboard.borderColor}`,
              ...getShapeStyleForScoreboard(config.scoreboard.shape, config.scoreboard.borderRadius),
              ...getGlowStyle(config.scoreboard.glow),
              opacity: config.scoreboard.opacity,
              padding: '8px 0',
            }}
          >
            {/* Team A: Logo + Name + Score */}
            <div className="flex items-center">
              {/* Team A Logo */}
              {config.teamAName.visible && config.teamAName.showLogo && (
                <div 
                  className="flex items-center justify-center px-4"
                  style={{
                    height: config.scoreboard.height * 0.7,
                    opacity: config.teamAName.opacity,
                    ...getGlowStyle(config.teamAName.glow),
                  }}
                >
                  {session?.team_a_logo ? (
                    <img
                      src={session.team_a_logo}
                      alt=""
                      style={{ width: config.teamAName.logoSize, height: config.teamAName.logoSize }}
                      className="object-contain"
                    />
                  ) : (
                    <div 
                      className="flex items-center justify-center font-bold text-sm"
                      style={{ 
                        width: config.teamAName.logoSize, 
                        height: config.teamAName.logoSize,
                        backgroundColor: `${session?.team_a_color || '#3B82F6'}33`,
                        color: session?.team_a_color || '#3B82F6',
                        ...getShapeStyleForScoreboard(config.scoreboard.shape, 8),
                      }}
                    >
                      BD
                    </div>
                  )}
                </div>
              )}

              {/* Team A Name */}
              {config.teamAName.visible && (
                <div 
                  className="flex flex-col items-end pr-3"
                  style={{
                    transform: `translate(${-config.teamAName.offsetX}px, ${config.teamAName.offsetY}px)`,
                  }}
                >
                  <span
                    className="font-bold uppercase tracking-wide flex flex-col items-end"
                    style={{ 
                      color: config.teamAName.textColor,
                      fontSize: config.teamAName.fontSize,
                      maxWidth: config.teamAName.maxWidth,
                    }}
                  >
                    {splitTeamName(session?.team_a_name || 'Blue Team', config.teamAName.maxCharsPerLine).map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </span>
                  {/* Team A Series dots - under team name */}
                  {config.seriesDisplay.visible && seriesDotsCount > 0 && (
                    <div 
                      className="flex items-center gap-1 mt-1"
                      style={{
                        flexDirection: config.seriesDisplay.orientation === 'vertical' ? 'column' : 'row',
                        transform: `translate(${-config.seriesDisplay.offsetX}px, ${config.seriesDisplay.offsetY}px)`,
                        opacity: config.seriesDisplay.opacity,
                        ...getGlowStyle(config.seriesDisplay.glow),
                      }}
                    >
                      {Array.from({ length: seriesDotsCount }).map((_, i) => (
                        <div
                          key={`a-${i}`}
                          className="rounded-full"
                          style={{
                            width: config.seriesDisplay.dotSize,
                            height: config.seriesDisplay.dotSize,
                            backgroundColor: i < teamAWins 
                              ? config.seriesDisplay.activeDotColor 
                              : config.seriesDisplay.inactiveDotColor,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Team A Score */}
              {config.scoreDisplay.visible && (
                <div style={{ transform: `translate(${-config.scoreDisplay.offsetX}px, ${config.scoreDisplay.offsetY}px)` }}>
                  <motion.div
                    className="flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: session?.team_a_color || '#3B82F6',
                      color: '#ffffff',
                      fontSize: config.scoreDisplay.fontSize,
                      minWidth: config.scoreDisplay.fontSize * 1.8,
                      height: config.scoreDisplay.fontSize * 1.6,
                      opacity: config.scoreDisplay.opacity,
                      ...getShapeStyleForScoreboard(config.scoreboard.shape, config.scoreDisplay.borderRadius),
                      ...getGlowStyle(config.scoreDisplay.glow),
                    }}
                    key={`a-${currentGameState.teams.blue.score}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    {currentGameState.teams.blue.score}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Timer in center */}
            {config.timerDisplay.visible && (
              <div 
                className="flex items-center justify-center mx-2"
                style={{
                  backgroundColor: config.timerDisplay.backgroundColor,
                  padding: `${config.timerDisplay.padding}px ${config.timerDisplay.padding * 2}px`,
                  ...getShapeStyleForScoreboard(config.scoreboard.shape, config.timerDisplay.borderRadius),
                  ...getGlowStyle(config.timerDisplay.glow),
                  opacity: config.timerDisplay.opacity,
                  minWidth: 80,
                  transform: `translate(${config.timerDisplay.offsetX}px, ${config.timerDisplay.offsetY}px)`,
                }}
              >
                <span 
                  className="font-mono font-bold"
                  style={{ 
                    color: config.timerDisplay.textColor,
                    fontSize: config.timerDisplay.fontSize,
                  }}
                >
                  {formatTime(currentGameState.game.time)}
                </span>
                {config.timerDisplay.showOvertimeLabel && currentGameState.game.isOT && (
                  <span 
                    className="ml-2 font-semibold"
                    style={{ color: config.timerDisplay.overtimeLabelColor }}
                  >
                    OT
                  </span>
                )}
              </div>
            )}

            {/* Team B: Score + Name + Logo */}
            <div className="flex items-center">
              {/* Team B Score */}
              {config.scoreDisplay.visible && (
                <div style={{ transform: `translate(${config.scoreDisplay.offsetX}px, ${config.scoreDisplay.offsetY}px)` }}>
                  <motion.div
                    className="flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: session?.team_b_color || '#F97316',
                      color: '#ffffff',
                      fontSize: config.scoreDisplay.fontSize,
                      minWidth: config.scoreDisplay.fontSize * 1.8,
                      height: config.scoreDisplay.fontSize * 1.6,
                      opacity: config.scoreDisplay.opacity,
                      ...getShapeStyleForScoreboard(config.scoreboard.shape, config.scoreDisplay.borderRadius),
                      ...getGlowStyle(config.scoreDisplay.glow),
                    }}
                    key={`b-${currentGameState.teams.orange.score}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    {currentGameState.teams.orange.score}
                  </motion.div>
                </div>
              )}

              {/* Team B Name */}
              {config.teamBName.visible && (
                <div 
                  className="flex flex-col items-start pl-3"
                  style={{
                    transform: `translate(${config.teamBName.offsetX}px, ${config.teamBName.offsetY}px)`,
                  }}
                >
                  <span
                    className="font-bold uppercase tracking-wide"
                    style={{ 
                      color: config.teamBName.textColor,
                      fontSize: config.teamBName.fontSize,
                      maxWidth: config.teamBName.maxWidth,
                    }}
                  >
                    {splitTeamName(session?.team_b_name || 'Orange Team', config.teamBName.maxCharsPerLine).map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </span>
                  {/* Team B Series dots - under team name */}
                  {config.seriesDisplay.visible && seriesDotsCount > 0 && (
                    <div 
                      className="flex items-center gap-1 mt-1"
                      style={{
                        flexDirection: config.seriesDisplay.orientation === 'vertical' ? 'column' : 'row',
                        transform: `translate(${config.seriesDisplay.offsetX}px, ${config.seriesDisplay.offsetY}px)`,
                        opacity: config.seriesDisplay.opacity,
                        ...getGlowStyle(config.seriesDisplay.glow),
                      }}
                    >
                      {Array.from({ length: seriesDotsCount }).map((_, i) => (
                        <div
                          key={`b-${i}`}
                          className="rounded-full"
                          style={{
                            width: config.seriesDisplay.dotSize,
                            height: config.seriesDisplay.dotSize,
                            backgroundColor: i < teamBWins 
                              ? config.seriesDisplay.activeDotColor 
                              : config.seriesDisplay.inactiveDotColor,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Team B Logo */}
              {config.teamBName.visible && config.teamBName.showLogo && (
                <div 
                  className="flex items-center justify-center px-4"
                  style={{
                    height: config.scoreboard.height * 0.7,
                    opacity: config.teamBName.opacity,
                    ...getGlowStyle(config.teamBName.glow),
                  }}
                >
                  {session?.team_b_logo ? (
                    <img
                      src={session.team_b_logo}
                      alt=""
                      style={{ width: config.teamBName.logoSize, height: config.teamBName.logoSize }}
                      className="object-contain"
                    />
                  ) : (
                    <div 
                      className="flex items-center justify-center font-bold text-sm"
                      style={{ 
                        width: config.teamBName.logoSize, 
                        height: config.teamBName.logoSize,
                        backgroundColor: `${session?.team_b_color || '#F97316'}33`,
                        color: session?.team_b_color || '#F97316',
                        ...getShapeStyleForScoreboard(config.scoreboard.shape, 8),
                      }}
                    >
                      OP
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blue Team Boost Bars (Left) - positioned at verticalPosition% */}
      {config.boostBars.visible && (
        <div
          className="absolute space-y-2"
          style={{ 
            width: config.boostBars.width,
            left: config.boostBars.horizontalPadding,
            top: `${config.boostBars.verticalPosition}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {blueTeamPlayers.map((player) => (
            <BoostBar
              key={player.id}
              player={player}
              teamColor={session?.team_a_color || config.boostBars.teamAColor}
              config={config.boostBars}
            />
          ))}
        </div>
      )}

      {/* Orange Team Boost Bars (Right) - positioned at verticalPosition% */}
      {config.boostBars.visible && (
        <div
          className="absolute space-y-2"
          style={{ 
            width: config.boostBars.width,
            right: config.boostBars.horizontalPadding,
            top: `${config.boostBars.verticalPosition}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {orangeTeamPlayers.map((player) => (
            <BoostBar
              key={player.id}
              player={player}
              teamColor={session?.team_b_color || config.boostBars.teamBColor}
              config={config.boostBars}
              reversed
            />
          ))}
        </div>
      )}

      {/* Boost Circle (Target Player) */}
      {config.boostCircle.visible && targetPlayer && (
        <div
          className="absolute"
          style={{
            left: `${config.boostCircle.position.x}%`,
            top: `${config.boostCircle.position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <BoostCircle
            boost={normalizeBoost(targetPlayer.boost)}
            config={config.boostCircle}
            teamColor={
              targetPlayer.team === 0
                ? session?.team_a_color || '#3B82F6'
                : session?.team_b_color || '#F97316'
            }
          />
        </div>
      )}

      {/* Player Stats (Target Player) */}
      {config.playerStats.visible && targetPlayer && (
        <div
          className="absolute"
          style={{
            left: `${config.playerStats.position.x}%`,
            top: `${config.playerStats.position.y}%`,
          }}
        >
          <PlayerStats player={targetPlayer} config={config.playerStats} />
        </div>
      )}
    </div>
  );
}

interface BoostBarProps {
  player: PlayerState;
  teamColor: string;
  config: OverlayConfig['boostBars'];
  reversed?: boolean;
}

function BoostBar({ player, teamColor, config, reversed }: BoostBarProps) {
  const normalizedBoost = normalizeBoost(player.boost);
  const shapeStyles = getShapeStyle(config.shape, config.borderRadius);
  const barShapeStyles = getShapeStyle(config.shape, config.barHeight / 2);
  
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${reversed ? 'flex-row-reverse' : ''}`}
      style={{
        ...getBackgroundStyle(config.backgroundColor, config.backgroundGradient),
        ...shapeStyles,
        ...getGlowStyle(config.glow),
        opacity: config.opacity,
      }}
    >
      {/* Player name - flex container that can shrink */}
      {config.showPlayerNames && (
        <div className="flex-1 min-w-0">
          <span
            className="font-semibold truncate uppercase block"
            style={{ 
              fontSize: config.fontSize, 
              color: '#ffffff',
              textAlign: reversed ? 'right' : 'left',
            }}
          >
            {player.name}
          </span>
        </div>
      )}
      
      {/* Boost bar - fixed width, won't shrink */}
      <div 
        className="flex-shrink-0 overflow-hidden"
        style={{
          width: config.boostBarWidth,
          height: config.barHeight,
          backgroundColor: 'rgba(255,255,255,0.1)',
          ...barShapeStyles,
        }}
      >
        <motion.div
          className="h-full"
          initial={false}
          animate={{
            width: `${normalizedBoost}%`,
            backgroundColor: teamColor,
          }}
          transition={{ duration: config.animationSpeed / 1000 }}
          style={barShapeStyles}
        />
      </div>
      
      {/* Boost value - fixed width */}
      {config.showBoostValue && (
        <span 
          className="font-mono font-bold w-8 text-center flex-shrink-0"
          style={{ fontSize: config.fontSize, color: '#ffffff' }}
        >
          {normalizedBoost}
        </span>
      )}
    </div>
  );
}

interface BoostCircleProps {
  boost: number;
  config: OverlayConfig['boostCircle'];
  teamColor: string;
}

function BoostCircle({ boost, config, teamColor }: BoostCircleProps) {
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (boost / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ 
        width: config.size, 
        height: config.size,
        opacity: config.opacity,
        ...getGlowStyle(config.glow),
      }}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${config.size} ${config.size}`}>
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill={config.backgroundColor}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={config.strokeWidth}
        />
        {/* Boost progress */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="transparent"
          stroke={getBoostColor(boost)}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: config.animationSpeed / 1000 }}
        />
      </svg>
      {config.showValue && (
        <motion.span
          className="font-mono font-bold"
          style={{
            fontSize: config.fontSize,
            color: config.textColor,
          }}
          key={boost}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
        >
          {boost}
        </motion.span>
      )}
    </div>
  );
}

interface PlayerStatsProps {
  player: PlayerState;
  config: OverlayConfig['playerStats'];
}

function PlayerStats({ player, config }: PlayerStatsProps) {
  const stats = [
    { label: 'SCR', value: player.score, show: config.showScore },
    { label: 'G', value: player.goals, show: config.showGoals },
    { label: 'A', value: player.assists, show: config.showAssists },
    { label: 'SV', value: player.saves, show: config.showSaves },
    { label: 'SH', value: player.shots, show: config.showShots },
    { label: 'DEM', value: player.demos, show: config.showDemos },
  ].filter((s) => s.show);

  return (
    <div
      className="flex items-center gap-4 px-4 py-2"
      style={{
        backgroundColor: config.backgroundColor,
        borderRadius: config.borderRadius,
        width: config.width,
        opacity: config.opacity,
        ...getGlowStyle(config.glow),
      }}
    >
      <span className="font-semibold truncate max-w-[100px]">{player.name}</span>
      <div className="flex items-center gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{stat.label}</span>
            <span className="font-mono font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
