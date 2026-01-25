import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { OverlayConfig, EditableElement, GameState } from '@/types/broadcast';

interface OverlayPreviewProps {
  config: OverlayConfig;
  selectedElement: EditableElement | null;
  onSelectElement: (element: EditableElement) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Mock data for preview
const mockGameState: GameState = {
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
};

const mockSession = {
  team_a_name: 'Blue Dragons',
  team_b_name: 'Orange Phoenix',
  team_a_color: '#3B82F6',
  team_b_color: '#F97316',
  series_type: 'bo5',
  team_a_series_score: 2,
  team_b_series_score: 1,
};

export function OverlayPreview({ config, selectedElement, onSelectElement }: OverlayPreviewProps) {
  const blueTeamPlayers = mockGameState.players.filter((p) => p.team === 0);
  const orangeTeamPlayers = mockGameState.players.filter((p) => p.team === 1);
  const targetPlayer = mockGameState.players.find((p) => p.isPrimary);

  const getHighlightClass = (element: EditableElement) =>
    cn(
      'cursor-pointer transition-all duration-200',
      selectedElement === element && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    );

  const getSeriesDots = () => {
    const maxWins = mockSession.series_type === 'bo5' ? 3 : mockSession.series_type === 'bo7' ? 4 : mockSession.series_type === 'bo3' ? 2 : 1;
    return { maxWins, teamAWins: mockSession.team_a_series_score, teamBWins: mockSession.team_b_series_score };
  };

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border border-border/50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Scoreboard */}
      {config.scoreboard.visible && (
        <div
          className={cn('absolute', getHighlightClass('scoreboard'))}
          style={{
            left: `${config.scoreboard.position.x}%`,
            top: `${config.scoreboard.position.y}%`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => { e.stopPropagation(); onSelectElement('scoreboard'); }}
        >
          <div
            className="flex items-center"
            style={{
              backgroundColor: config.scoreboard.backgroundColor,
              borderRadius: config.scoreboard.borderRadius,
              border: `${config.scoreboard.borderWidth}px solid ${config.scoreboard.borderColor}`,
              gap: config.scoreboard.gap,
              padding: '12px 20px',
              width: config.scoreboard.width * 0.5, // Scale for preview
              height: config.scoreboard.height * 0.5,
            }}
          >
            {/* Team A Name */}
            {config.teamAName.visible && (
              <div
                className={cn('flex items-center gap-2', getHighlightClass('teamAName'))}
                onClick={(e) => { e.stopPropagation(); onSelectElement('teamAName'); }}
                style={{
                  backgroundColor: config.teamAName.backgroundColor,
                  borderRadius: config.teamAName.borderRadius,
                  padding: config.teamAName.padding * 0.5,
                }}
              >
                {config.teamAName.showLogo && (
                  <div 
                    className="rounded bg-blue-500/20 flex items-center justify-center text-xs font-bold"
                    style={{ 
                      width: config.teamAName.logoSize * 0.4, 
                      height: config.teamAName.logoSize * 0.4,
                      color: mockSession.team_a_color 
                    }}
                  >
                    BD
                  </div>
                )}
                <span
                  className="font-semibold truncate"
                  style={{ 
                    color: mockSession.team_a_color,
                    fontSize: config.teamAName.fontSize * 0.5,
                    maxWidth: config.teamAName.maxWidth * 0.4,
                  }}
                >
                  {mockSession.team_a_name}
                </span>
              </div>
            )}

            {/* Score Display */}
            {config.scoreDisplay.visible && (
              <div
                className={cn('flex items-center justify-center', getHighlightClass('scoreDisplay'))}
                onClick={(e) => { e.stopPropagation(); onSelectElement('scoreDisplay'); }}
                style={{
                  backgroundColor: config.scoreDisplay.backgroundColor,
                  borderRadius: config.scoreDisplay.borderRadius,
                  padding: config.scoreDisplay.padding * 0.5,
                  gap: config.scoreDisplay.gap * 0.5,
                }}
              >
                <span
                  className="font-bold"
                  style={{ 
                    color: mockSession.team_a_color,
                    fontSize: config.scoreDisplay.fontSize * 0.5,
                  }}
                >
                  {mockGameState.teams.blue.score}
                </span>
                <span 
                  style={{ 
                    color: config.scoreDisplay.separatorColor,
                    fontSize: config.scoreDisplay.fontSize * 0.4,
                  }}
                >
                  -
                </span>
                <span
                  className="font-bold"
                  style={{ 
                    color: mockSession.team_b_color,
                    fontSize: config.scoreDisplay.fontSize * 0.5,
                  }}
                >
                  {mockGameState.teams.orange.score}
                </span>
              </div>
            )}

            {/* Team B Name */}
            {config.teamBName.visible && (
              <div
                className={cn('flex items-center gap-2', getHighlightClass('teamBName'))}
                onClick={(e) => { e.stopPropagation(); onSelectElement('teamBName'); }}
                style={{
                  backgroundColor: config.teamBName.backgroundColor,
                  borderRadius: config.teamBName.borderRadius,
                  padding: config.teamBName.padding * 0.5,
                }}
              >
                <span
                  className="font-semibold truncate"
                  style={{ 
                    color: mockSession.team_b_color,
                    fontSize: config.teamBName.fontSize * 0.5,
                    maxWidth: config.teamBName.maxWidth * 0.4,
                  }}
                >
                  {mockSession.team_b_name}
                </span>
                {config.teamBName.showLogo && (
                  <div 
                    className="rounded bg-orange-500/20 flex items-center justify-center text-xs font-bold"
                    style={{ 
                      width: config.teamBName.logoSize * 0.4, 
                      height: config.teamBName.logoSize * 0.4,
                      color: mockSession.team_b_color 
                    }}
                  >
                    OP
                  </div>
                )}
              </div>
            )}

            {/* Timer Display */}
            {config.timerDisplay.visible && (
              <div
                className={cn(getHighlightClass('timerDisplay'))}
                onClick={(e) => { e.stopPropagation(); onSelectElement('timerDisplay'); }}
                style={{
                  backgroundColor: config.timerDisplay.backgroundColor,
                  borderRadius: config.timerDisplay.borderRadius,
                  padding: config.timerDisplay.padding * 0.5,
                }}
              >
                <span
                  className="font-mono"
                  style={{ 
                    color: config.timerDisplay.textColor,
                    fontSize: config.timerDisplay.fontSize * 0.5,
                  }}
                >
                  {formatTime(mockGameState.game.time)}
                </span>
              </div>
            )}

            {/* Series Display */}
            {config.seriesDisplay.visible && (
              <div
                className={cn('flex items-center gap-1', getHighlightClass('seriesDisplay'))}
                onClick={(e) => { e.stopPropagation(); onSelectElement('seriesDisplay'); }}
                style={{
                  backgroundColor: config.seriesDisplay.backgroundColor,
                  borderRadius: config.seriesDisplay.borderRadius,
                  padding: config.seriesDisplay.padding * 0.5,
                }}
              >
                {config.seriesDisplay.showSeriesType && (
                  <span
                    className="mr-1"
                    style={{ 
                      color: config.seriesDisplay.textColor,
                      fontSize: config.seriesDisplay.fontSize * 0.5,
                    }}
                  >
                    {mockSession.series_type.toUpperCase()}
                  </span>
                )}
                <div className="flex items-center" style={{ gap: config.seriesDisplay.dotSpacing * 0.5 }}>
                  {Array.from({ length: getSeriesDots().maxWins }).map((_, i) => (
                    <div
                      key={`a-${i}`}
                      className="rounded-full"
                      style={{
                        width: config.seriesDisplay.dotSize * 0.5,
                        height: config.seriesDisplay.dotSize * 0.5,
                        backgroundColor: i < getSeriesDots().teamAWins 
                          ? config.seriesDisplay.activeDotColor 
                          : config.seriesDisplay.inactiveDotColor,
                      }}
                    />
                  ))}
                  <span style={{ color: config.seriesDisplay.textColor, fontSize: 6, margin: '0 2px' }}>•</span>
                  {Array.from({ length: getSeriesDots().maxWins }).map((_, i) => (
                    <div
                      key={`b-${i}`}
                      className="rounded-full"
                      style={{
                        width: config.seriesDisplay.dotSize * 0.5,
                        height: config.seriesDisplay.dotSize * 0.5,
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
          className={cn('absolute left-2 bottom-2 space-y-1', getHighlightClass('boostBars'))}
          style={{ width: config.boostBars.width * 0.4 }}
          onClick={(e) => { e.stopPropagation(); onSelectElement('boostBars'); }}
        >
          {blueTeamPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-1 px-2 py-1"
              style={{
                backgroundColor: config.boostBars.backgroundColor,
                borderRadius: config.boostBars.borderRadius * 0.5,
                fontSize: config.boostBars.fontSize * 0.5,
              }}
            >
              {config.boostBars.showPlayerNames && (
                <span className="text-white truncate" style={{ maxWidth: 40 }}>{player.name}</span>
              )}
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${player.boost}%`, backgroundColor: config.boostBars.teamAColor }}
                />
              </div>
              {config.boostBars.showBoostValue && (
                <span className="font-mono text-white w-4 text-right">{player.boost}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Orange Team Boost Bars (Right) */}
      {config.boostBars.visible && (
        <div
          className="absolute right-2 bottom-2 space-y-1"
          style={{ width: config.boostBars.width * 0.4 }}
        >
          {orangeTeamPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-1 px-2 py-1 flex-row-reverse"
              style={{
                backgroundColor: config.boostBars.backgroundColor,
                borderRadius: config.boostBars.borderRadius * 0.5,
                fontSize: config.boostBars.fontSize * 0.5,
              }}
            >
              {config.boostBars.showPlayerNames && (
                <span className="text-white truncate" style={{ maxWidth: 40 }}>{player.name}</span>
              )}
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${player.boost}%`, backgroundColor: config.boostBars.teamBColor }}
                />
              </div>
              {config.boostBars.showBoostValue && (
                <span className="font-mono text-white w-4 text-left">{player.boost}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Boost Circle */}
      {config.boostCircle.visible && targetPlayer && (
        <div
          className={cn('absolute', getHighlightClass('boostCircle'))}
          style={{
            left: `${config.boostCircle.position.x}%`,
            top: `${config.boostCircle.position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => { e.stopPropagation(); onSelectElement('boostCircle'); }}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ 
              width: config.boostCircle.size * 0.4, 
              height: config.boostCircle.size * 0.4,
              backgroundColor: config.boostCircle.backgroundColor,
              borderRadius: '50%',
            }}
          >
            <svg 
              className="absolute inset-0 -rotate-90" 
              viewBox={`0 0 ${config.boostCircle.size * 0.4} ${config.boostCircle.size * 0.4}`}
            >
              <circle
                cx={config.boostCircle.size * 0.2}
                cy={config.boostCircle.size * 0.2}
                r={(config.boostCircle.size * 0.4 - config.boostCircle.strokeWidth * 0.4) / 2}
                fill="transparent"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={config.boostCircle.strokeWidth * 0.4}
              />
              <circle
                cx={config.boostCircle.size * 0.2}
                cy={config.boostCircle.size * 0.2}
                r={(config.boostCircle.size * 0.4 - config.boostCircle.strokeWidth * 0.4) / 2}
                fill="transparent"
                stroke={mockSession.team_a_color}
                strokeWidth={config.boostCircle.strokeWidth * 0.4}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * (config.boostCircle.size * 0.4 - config.boostCircle.strokeWidth * 0.4) / 2}
                strokeDashoffset={2 * Math.PI * (config.boostCircle.size * 0.4 - config.boostCircle.strokeWidth * 0.4) / 2 * (1 - targetPlayer.boost / 100)}
              />
            </svg>
            {config.boostCircle.showValue && (
              <span
                className="font-mono font-bold"
                style={{
                  fontSize: config.boostCircle.fontSize * 0.4,
                  color: config.boostCircle.textColor,
                }}
              >
                {targetPlayer.boost}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Player Stats */}
      {config.playerStats.visible && targetPlayer && (
        <div
          className={cn('absolute', getHighlightClass('playerStats'))}
          style={{
            left: `${config.playerStats.position.x}%`,
            top: `${config.playerStats.position.y}%`,
          }}
          onClick={(e) => { e.stopPropagation(); onSelectElement('playerStats'); }}
        >
          <div
            className="flex items-center gap-2 px-2 py-1"
            style={{
              backgroundColor: config.playerStats.backgroundColor,
              borderRadius: config.playerStats.borderRadius * 0.5,
              width: config.playerStats.width * 0.4,
            }}
          >
            <span 
              className="font-semibold truncate"
              style={{ 
                fontSize: config.playerStats.fontSize * 0.5,
                color: config.playerStats.textColor,
                maxWidth: 50,
              }}
            >
              {targetPlayer.name}
            </span>
            <div className="flex items-center gap-2" style={{ fontSize: config.playerStats.fontSize * 0.5 }}>
              {config.playerStats.showScore && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground">SCR</span>
                  <span className="font-mono" style={{ color: config.playerStats.textColor }}>{targetPlayer.score}</span>
                </div>
              )}
              {config.playerStats.showGoals && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground">G</span>
                  <span className="font-mono" style={{ color: config.playerStats.textColor }}>{targetPlayer.goals}</span>
                </div>
              )}
              {config.playerStats.showAssists && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground">A</span>
                  <span className="font-mono" style={{ color: config.playerStats.textColor }}>{targetPlayer.assists}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Kliknij element aby go edytować • Podgląd w skali 50%
      </div>
    </div>
  );
}
