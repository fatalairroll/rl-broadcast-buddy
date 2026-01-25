import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBroadcast } from '@/hooks/useBroadcast';
import type { GameState, OverlayConfig, PlayerState } from '@/types/broadcast';
import { defaultOverlayConfig } from '@/types/broadcast';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getBoostColor(boost: number): string {
  if (boost >= 75) return 'hsl(217, 91%, 60%)';
  if (boost >= 50) return 'hsl(142, 76%, 46%)';
  if (boost >= 25) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 84%, 60%)';
}

export default function Overlay() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || undefined;
  const { session, gameState } = useBroadcast(sessionId);
  const [config] = useState<OverlayConfig>(defaultOverlayConfig);

  // Mock game state for development
  const [mockGameState] = useState<GameState>({
    players: [
      { id: '1', name: 'Player1', team: 0, boost: 85, goals: 2, shots: 5, assists: 1, saves: 0, score: 450, isPrimary: true },
      { id: '2', name: 'Player2', team: 0, boost: 33, goals: 0, shots: 2, assists: 1, saves: 2, score: 180, isPrimary: false },
      { id: '3', name: 'Player3', team: 0, boost: 100, goals: 1, shots: 3, assists: 0, saves: 1, score: 290, isPrimary: false },
      { id: '4', name: 'Player4', team: 1, boost: 67, goals: 1, shots: 4, assists: 0, saves: 0, score: 220, isPrimary: false },
      { id: '5', name: 'Player5', team: 1, boost: 12, goals: 0, shots: 1, assists: 1, saves: 3, score: 200, isPrimary: false },
      { id: '6', name: 'Player6', team: 1, boost: 45, goals: 0, shots: 2, assists: 0, saves: 1, score: 130, isPrimary: false },
    ],
    teams: { blue: { score: 3 }, orange: { score: 1 } },
    ball: { speed: 87, location: { x: 0, y: 0, z: 100 } },
    game: { time: 245, isOT: false, hasTarget: true },
  });

  const currentGameState = gameState || mockGameState;
  const blueTeamPlayers = currentGameState.players.filter((p) => p.team === 0);
  const orangeTeamPlayers = currentGameState.players.filter((p) => p.team === 1);
  const targetPlayer = currentGameState.players.find((p) => p.isPrimary);

  const getSeriesDots = () => {
    const seriesType = session?.series_type || 'bo5';
    const maxWins = seriesType === 'bo5' ? 3 : seriesType === 'bo7' ? 4 : seriesType === 'bo3' ? 2 : 1;
    return { maxWins, teamAWins: session?.team_a_series_score || 0, teamBWins: session?.team_b_series_score || 0 };
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative overlay-transparent">
      {/* Scoreboard */}
      {config.scoreboard.visible && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: `${config.scoreboard.position.x}%`,
            top: `${config.scoreboard.position.y}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="flex items-center"
            style={{
              backgroundColor: config.scoreboard.backgroundColor,
              borderRadius: config.scoreboard.borderRadius,
              border: `${config.scoreboard.borderWidth}px solid ${config.scoreboard.borderColor}`,
              gap: config.scoreboard.gap,
              padding: '12px 24px',
            }}
          >
            {/* Team A Name */}
            {config.teamAName.visible && (
              <div className="flex items-center gap-3"
                style={{
                  backgroundColor: config.teamAName.backgroundColor,
                  borderRadius: config.teamAName.borderRadius,
                  padding: config.teamAName.padding,
                }}
              >
                {config.teamAName.showLogo && session?.team_a_logo && (
                  <img
                    src={session.team_a_logo}
                    alt=""
                    style={{ width: config.teamAName.logoSize, height: config.teamAName.logoSize }}
                    className="object-contain"
                  />
                )}
                <span
                  className="font-semibold"
                  style={{ 
                    color: session?.team_a_color || '#3B82F6',
                    fontSize: config.teamAName.fontSize,
                    maxWidth: config.teamAName.maxWidth,
                  }}
                >
                  {session?.team_a_name || 'Blue Team'}
                </span>
              </div>
            )}

            {/* Score Display */}
            {config.scoreDisplay.visible && (
              <div 
                className="flex items-center justify-center"
                style={{
                  backgroundColor: config.scoreDisplay.backgroundColor,
                  borderRadius: config.scoreDisplay.borderRadius,
                  padding: config.scoreDisplay.padding,
                  gap: config.scoreDisplay.gap,
                }}
              >
                <motion.span
                  key={currentGameState.teams.blue.score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-bold"
                  style={{ 
                    color: session?.team_a_color || '#3B82F6',
                    fontSize: config.scoreDisplay.fontSize,
                  }}
                >
                  {currentGameState.teams.blue.score}
                </motion.span>
                <span 
                  style={{ 
                    color: config.scoreDisplay.separatorColor,
                    fontSize: config.scoreDisplay.fontSize * 0.7,
                  }}
                >
                  -
                </span>
                <motion.span
                  key={currentGameState.teams.orange.score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-bold"
                  style={{ 
                    color: session?.team_b_color || '#F97316',
                    fontSize: config.scoreDisplay.fontSize,
                  }}
                >
                  {currentGameState.teams.orange.score}
                </motion.span>
              </div>
            )}

            {/* Team B Name */}
            {config.teamBName.visible && (
              <div className="flex items-center gap-3"
                style={{
                  backgroundColor: config.teamBName.backgroundColor,
                  borderRadius: config.teamBName.borderRadius,
                  padding: config.teamBName.padding,
                }}
              >
                <span
                  className="font-semibold"
                  style={{ 
                    color: session?.team_b_color || '#F97316',
                    fontSize: config.teamBName.fontSize,
                    maxWidth: config.teamBName.maxWidth,
                  }}
                >
                  {session?.team_b_name || 'Orange Team'}
                </span>
                {config.teamBName.showLogo && session?.team_b_logo && (
                  <img
                    src={session.team_b_logo}
                    alt=""
                    style={{ width: config.teamBName.logoSize, height: config.teamBName.logoSize }}
                    className="object-contain"
                  />
                )}
              </div>
            )}

            {/* Timer Display */}
            {config.timerDisplay.visible && (
              <div 
                style={{
                  backgroundColor: config.timerDisplay.backgroundColor,
                  borderRadius: config.timerDisplay.borderRadius,
                  padding: config.timerDisplay.padding,
                }}
              >
                <span 
                  className="font-mono"
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

            {/* Series Display */}
            {config.seriesDisplay.visible && session && (
              <div 
                className="flex items-center gap-2"
                style={{
                  backgroundColor: config.seriesDisplay.backgroundColor,
                  borderRadius: config.seriesDisplay.borderRadius,
                  padding: config.seriesDisplay.padding,
                }}
              >
                {config.seriesDisplay.showSeriesType && (
                  <span
                    style={{ 
                      color: config.seriesDisplay.textColor,
                      fontSize: config.seriesDisplay.fontSize,
                    }}
                  >
                    {session.series_type.toUpperCase()}
                  </span>
                )}
                <div className="flex items-center" style={{ gap: config.seriesDisplay.dotSpacing }}>
                  {Array.from({ length: getSeriesDots().maxWins }).map((_, i) => (
                    <div
                      key={`a-${i}`}
                      className="rounded-full"
                      style={{
                        width: config.seriesDisplay.dotSize,
                        height: config.seriesDisplay.dotSize,
                        backgroundColor: i < getSeriesDots().teamAWins 
                          ? config.seriesDisplay.activeDotColor 
                          : config.seriesDisplay.inactiveDotColor,
                      }}
                    />
                  ))}
                  <span 
                    style={{ 
                      color: config.seriesDisplay.textColor, 
                      fontSize: config.seriesDisplay.fontSize * 0.8,
                      margin: '0 4px',
                    }}
                  >
                    •
                  </span>
                  {Array.from({ length: getSeriesDots().maxWins }).map((_, i) => (
                    <div
                      key={`b-${i}`}
                      className="rounded-full"
                      style={{
                        width: config.seriesDisplay.dotSize,
                        height: config.seriesDisplay.dotSize,
                        backgroundColor: i < getSeriesDots().teamBWins 
                          ? config.seriesDisplay.activeDotColor 
                          : config.seriesDisplay.inactiveDotColor,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blue Team Boost Bars (Left) */}
      {config.boostBars.visible && (
        <div
          className="absolute left-4 bottom-4 space-y-2"
          style={{ width: config.boostBars.width }}
        >
          {blueTeamPlayers.map((player) => (
            <BoostBar
              key={player.id}
              player={player}
              teamColor={session?.team_a_color || '#3B82F6'}
              config={config.boostBars}
            />
          ))}
        </div>
      )}

      {/* Orange Team Boost Bars (Right) */}
      {config.boostBars.visible && (
        <div
          className="absolute right-4 bottom-4 space-y-2"
          style={{ width: config.boostBars.width }}
        >
          {orangeTeamPlayers.map((player) => (
            <BoostBar
              key={player.id}
              player={player}
              teamColor={session?.team_b_color || '#F97316'}
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
            boost={targetPlayer.boost}
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
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${reversed ? 'flex-row-reverse' : ''}`}
      style={{
        backgroundColor: config.backgroundColor,
        borderRadius: config.borderRadius,
      }}
    >
      {config.showPlayerNames && (
        <span
          className="text-sm font-medium truncate"
          style={{ fontSize: config.fontSize, maxWidth: '80px' }}
        >
          {player.name}
        </span>
      )}
      <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{
            width: `${player.boost}%`,
            backgroundColor: getBoostColor(player.boost),
          }}
          transition={{ duration: config.animationSpeed / 1000 }}
        />
      </div>
      {config.showBoostValue && (
        <span className="font-mono text-sm w-8 text-right">{player.boost}</span>
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
      style={{ width: config.size, height: config.size }}
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
  ].filter((s) => s.show);

  return (
    <div
      className="flex items-center gap-4 px-4 py-2"
      style={{
        backgroundColor: config.backgroundColor,
        borderRadius: config.borderRadius,
        width: config.width,
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
