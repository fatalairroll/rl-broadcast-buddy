import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { OverlayConfig, EditableElement, GameState, ElementShape, GradientConfig } from '@/types/broadcast';
import { getShapeStyle } from '@/components/ui/shape-picker';
import { getBackgroundStyle } from '@/lib/gradient-utils';
import { getGlowStyle } from '@/lib/glow-utils';

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

function getShapeStyleForScoreboard(shape: ElementShape, borderRadius: number): React.CSSProperties {
  switch (shape) {
    case 'skewed':
      return { 
        clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
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
        clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
        borderRadius: 0,
      };
    case 'rounded':
    default:
      return { borderRadius };
  }
}

// Mock data for preview
const mockGameState: GameState = {
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

  const getSeriesDotsCount = () => {
    switch (mockSession.series_type) {
      case 'bo1': return 0;
      case 'bo3': return 2;
      case 'bo5': return 3;
      case 'bo7': return 4;
      default: return 3;
    }
  };

  const teamAWins = mockSession.team_a_series_score;
  const teamBWins = mockSession.team_b_series_score;
  const seriesDotsCount = getSeriesDotsCount();

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border border-border/50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Main Scoreboard - Professional Layout */}
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
            className="flex items-center justify-center"
            style={{
              position: 'relative',
              width: config.scoreboard.width * 0.4,
              minWidth: config.scoreboard.width * 0.4,
              ...getBackgroundStyle(config.scoreboard.backgroundColor, config.scoreboard.backgroundGradient),
              border: `${config.scoreboard.borderWidth}px solid ${config.scoreboard.borderColor}`,
              ...getShapeStyleForScoreboard(config.scoreboard.shape, config.scoreboard.borderRadius * 0.5),
              ...getGlowStyle(config.scoreboard.glow),
              opacity: config.scoreboard.opacity,
              padding: '4px 0',
            }}
          >
            {/* Team A Detached Box */}
            {config.teamAName.visible && config.teamAName.detached && (
              <div
                className={getHighlightClass('teamAName')}
                onClick={(e) => { e.stopPropagation(); onSelectElement('teamAName'); }}
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '50%',
                  transform: `translateY(-50%) translate(${-(config.teamAName.boxOffsetX ?? 0) * 0.4}px, ${(config.teamAName.boxOffsetY ?? 0) * 0.4}px)`,
                  width: (config.teamAName.boxWidth ?? 200) * 0.4,
                  height: (config.teamAName.boxHeight ?? 40) * 0.4,
                  backgroundColor: config.teamAName.boxBackgroundColor ?? mockSession.team_a_color,
                  borderRadius: (config.teamAName.boxBorderRadius ?? 4) * 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '0 4px',
                }}
              >
                {config.teamAName.showLogo && (
                  <div className="flex items-center justify-center font-bold" style={{ width: config.teamAName.logoSize * 0.35, height: config.teamAName.logoSize * 0.35, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, fontSize: 5 }}>BD</div>
                )}
                <span className="font-bold uppercase tracking-wide" style={{ color: config.teamAName.textColor, fontSize: config.teamAName.fontSize * 0.4, whiteSpace: 'nowrap' }}>
                  {mockSession.team_a_name}
                </span>
              </div>
            )}

            {/* Team B Detached Box */}
            {config.teamBName.visible && config.teamBName.detached && (
              <div
                className={getHighlightClass('teamBName')}
                onClick={(e) => { e.stopPropagation(); onSelectElement('teamBName'); }}
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: `translateY(-50%) translate(${(config.teamBName.boxOffsetX ?? 0) * 0.4}px, ${(config.teamBName.boxOffsetY ?? 0) * 0.4}px)`,
                  width: (config.teamBName.boxWidth ?? 200) * 0.4,
                  height: (config.teamBName.boxHeight ?? 40) * 0.4,
                  backgroundColor: config.teamBName.boxBackgroundColor ?? mockSession.team_b_color,
                  borderRadius: (config.teamBName.boxBorderRadius ?? 4) * 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '0 4px',
                }}
              >
                <span className="font-bold uppercase tracking-wide" style={{ color: config.teamBName.textColor, fontSize: config.teamBName.fontSize * 0.4, whiteSpace: 'nowrap' }}>
                  {mockSession.team_b_name}
                </span>
                {config.teamBName.showLogo && (
                  <div className="flex items-center justify-center font-bold" style={{ width: config.teamBName.logoSize * 0.35, height: config.teamBName.logoSize * 0.35, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, fontSize: 5 }}>OP</div>
                )}
              </div>
            )}

            {/* Team A: Logo + Name + Score */}
            <div className="flex items-center">
              {/* Team A Logo */}
              {config.teamAName.visible && config.teamAName.showLogo && !config.teamAName.detached && (
                <div
                  className={cn('flex items-center justify-center px-2', getHighlightClass('teamAName'))}
                  onClick={(e) => { e.stopPropagation(); onSelectElement('teamAName'); }}
                >
                  <div 
                    className="flex items-center justify-center font-bold"
                    style={{ 
                      width: config.teamAName.logoSize * 0.35, 
                      height: config.teamAName.logoSize * 0.35,
                      backgroundColor: `${mockSession.team_a_color}33`,
                      color: mockSession.team_a_color,
                      fontSize: 6,
                      ...getShapeStyleForScoreboard(config.scoreboard.shape, 4),
                    }}
                  >
                    BD
                  </div>
                </div>
              )}

              {/* Team A Name */}
              {config.teamAName.visible && !config.teamAName.detached && (
                <div className="flex flex-col items-end pr-1"
                  style={{ transform: `translate(${-config.teamAName.offsetX * 0.4}px, ${config.teamAName.offsetY * 0.4}px)` }}
                >
                  <span
                    className="font-bold uppercase tracking-wide flex flex-col items-end"
                    style={{ 
                      color: config.teamAName.textColor,
                      fontSize: config.teamAName.fontSize * 0.4,
                      whiteSpace: config.teamAName.maxCharsPerLine <= 0 ? 'nowrap' : 'normal',
                    }}
                  >
                    {splitTeamName(mockSession.team_a_name, config.teamAName.maxCharsPerLine).map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </span>
                  {/* Team A Series dots */}
                  {config.seriesDisplay.visible && seriesDotsCount > 0 && (
                    <div 
                      className={cn('flex items-center gap-0.5 mt-0.5', getHighlightClass('seriesDisplay'))}
                      onClick={(e) => { e.stopPropagation(); onSelectElement('seriesDisplay'); }}
                      style={{
                        flexDirection: config.seriesDisplay.orientation === 'vertical' ? 'column' : 'row',
                        transform: `translate(${-config.seriesDisplay.offsetX * 0.4}px, ${config.seriesDisplay.offsetY * 0.4}px)`,
                      }}
                    >
                      {Array.from({ length: seriesDotsCount }).map((_, i) => (
                        <div
                          key={`a-${i}`}
                          className="rounded-full"
                          style={{
                            width: config.seriesDisplay.dotSize * 0.4,
                            height: config.seriesDisplay.dotSize * 0.4,
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
                <div
                  className={cn('flex items-center justify-center font-bold', getHighlightClass('scoreDisplay'))}
                  onClick={(e) => { e.stopPropagation(); onSelectElement('scoreDisplay'); }}
                  style={{
                    backgroundColor: mockSession.team_a_color,
                    color: '#ffffff',
                    fontSize: config.scoreDisplay.fontSize * 0.4,
                    minWidth: config.scoreDisplay.fontSize * 0.7,
                    height: config.scoreDisplay.fontSize * 0.65,
                    opacity: config.scoreDisplay.opacity,
                    ...getShapeStyleForScoreboard(config.scoreboard.shape, config.scoreDisplay.borderRadius * 0.5),
                    ...getGlowStyle(config.scoreDisplay.glow),
                    transform: `translate(${-config.scoreDisplay.offsetX * 0.4}px, ${config.scoreDisplay.offsetY * 0.4}px)`,
                  }}
                >
                  {mockGameState.teams.blue.score}
                </div>
              )}
            </div>

            {/* Timer in center */}
            {config.timerDisplay.visible && (
              <div 
                className={cn('flex items-center justify-center mx-1', getHighlightClass('timerDisplay'))}
                onClick={(e) => { e.stopPropagation(); onSelectElement('timerDisplay'); }}
                style={{
                  backgroundColor: config.timerDisplay.backgroundColor,
                  padding: `${config.timerDisplay.padding * 0.3}px ${config.timerDisplay.padding * 0.6}px`,
                  ...getShapeStyleForScoreboard(config.scoreboard.shape, config.timerDisplay.borderRadius * 0.5),
                  ...getGlowStyle(config.timerDisplay.glow),
                  opacity: config.timerDisplay.opacity,
                   minWidth: 35,
                   transform: `translate(${config.timerDisplay.offsetX * 0.4}px, ${config.timerDisplay.offsetY * 0.4}px)`,
                 }}
              >
                <span 
                  className="font-mono font-bold"
                  style={{ 
                    color: config.timerDisplay.textColor,
                    fontSize: config.timerDisplay.fontSize * 0.45,
                  }}
                >
                  {formatTime(mockGameState.game.time)}
                </span>
              </div>
            )}

            {/* Team B: Score + Name + Logo */}
            <div className="flex items-center">
              {/* Team B Score */}
              {config.scoreDisplay.visible && (
                <div
                  className="flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: mockSession.team_b_color,
                    color: '#ffffff',
                    fontSize: config.scoreDisplay.fontSize * 0.4,
                    minWidth: config.scoreDisplay.fontSize * 0.7,
                    height: config.scoreDisplay.fontSize * 0.65,
                    opacity: config.scoreDisplay.opacity,
                    ...getShapeStyleForScoreboard(config.scoreboard.shape, config.scoreDisplay.borderRadius * 0.5),
                    ...getGlowStyle(config.scoreDisplay.glow),
                    transform: `translate(${config.scoreDisplay.offsetX * 0.4}px, ${config.scoreDisplay.offsetY * 0.4}px)`,
                  }}
                >
                  {mockGameState.teams.orange.score}
                </div>
              )}

              {/* Team B Name */}
              {config.teamBName.visible && !config.teamBName.detached && (
                <div
                  className={cn('flex flex-col items-start pl-1', getHighlightClass('teamBName'))}
                  onClick={(e) => { e.stopPropagation(); onSelectElement('teamBName'); }}
                  style={{ transform: `translate(${config.teamBName.offsetX * 0.4}px, ${config.teamBName.offsetY * 0.4}px)` }}
                >
                  <span
                    className="font-bold uppercase tracking-wide flex flex-col items-start"
                    style={{ 
                      color: config.teamBName.textColor,
                      fontSize: config.teamBName.fontSize * 0.4,
                      whiteSpace: config.teamBName.maxCharsPerLine <= 0 ? 'nowrap' : 'normal',
                    }}
                  >
                    {splitTeamName(mockSession.team_b_name, config.teamBName.maxCharsPerLine).map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </span>
                  {/* Team B Series dots */}
                  {config.seriesDisplay.visible && seriesDotsCount > 0 && (
                    <div 
                      className="flex items-center gap-0.5 mt-0.5"
                      style={{
                        flexDirection: config.seriesDisplay.orientation === 'vertical' ? 'column' : 'row',
                        transform: `translate(${config.seriesDisplay.offsetX * 0.4}px, ${config.seriesDisplay.offsetY * 0.4}px)`,
                      }}
                    >
                      {Array.from({ length: seriesDotsCount }).map((_, i) => (
                        <div
                          key={`b-${i}`}
                          className="rounded-full"
                          style={{
                            width: config.seriesDisplay.dotSize * 0.4,
                            height: config.seriesDisplay.dotSize * 0.4,
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
              {config.teamBName.visible && config.teamBName.showLogo && !config.teamBName.detached && (
                <div className="flex items-center justify-center px-2">
                  <div 
                    className="flex items-center justify-center font-bold"
                    style={{ 
                      width: config.teamBName.logoSize * 0.35, 
                      height: config.teamBName.logoSize * 0.35,
                      backgroundColor: `${mockSession.team_b_color}33`,
                      color: mockSession.team_b_color,
                      fontSize: 6,
                      ...getShapeStyleForScoreboard(config.scoreboard.shape, 4),
                    }}
                  >
                    OP
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blue Team Boost Bars (Left) - at verticalPosition% */}
      {config.boostBars.visible && (
        <div
          className={cn('absolute space-y-0.5', getHighlightClass('boostBars'))}
          style={{ 
            width: config.boostBars.width * 0.35,
            left: config.boostBars.horizontalPadding * 0.3,
            top: `${config.boostBars.verticalPosition}%`,
            transform: 'translateY(-50%)',
          }}
          onClick={(e) => { e.stopPropagation(); onSelectElement('boostBars'); }}
        >
          {blueTeamPlayers.map((player) => {
            const shapeStyles = getShapeStyle(config.boostBars.shape, config.boostBars.borderRadius * 0.4);
            const barShapeStyles = getShapeStyle(config.boostBars.shape, config.boostBars.barHeight * 0.2);
            return (
              <div
                key={player.id}
                className="flex items-center gap-1 px-1.5 py-0.5"
                style={{
                  ...getBackgroundStyle(config.boostBars.backgroundColor, config.boostBars.backgroundGradient),
                  ...shapeStyles,
                  ...getGlowStyle(config.boostBars.glow),
                  opacity: config.boostBars.opacity,
                  fontSize: config.boostBars.fontSize * 0.4,
                }}
              >
                {/* Player name - flex container */}
                {config.boostBars.showPlayerNames && (
                  <div className="flex-1 min-w-0">
                    <span className="text-white truncate uppercase font-semibold block" style={{ fontSize: 5 }}>
                      {player.name}
                    </span>
                  </div>
                )}
                {/* Boost bar - fixed width */}
                <div 
                  className="flex-shrink-0 overflow-hidden"
                  style={{
                    width: config.boostBars.boostBarWidth * 0.35,
                    height: config.boostBars.barHeight * 0.4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    ...barShapeStyles,
                  }}
                >
                  <div
                    className="h-full"
                    style={{ 
                      width: `${normalizeBoost(player.boost)}%`, 
                      backgroundColor: config.boostBars.teamAColor,
                      ...barShapeStyles,
                    }}
                  />
                </div>
                {config.boostBars.showBoostValue && (
                  <span className="font-mono text-white w-3 text-center font-bold flex-shrink-0" style={{ fontSize: 5 }}>
                    {normalizeBoost(player.boost)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Orange Team Boost Bars (Right) - at verticalPosition% */}
      {config.boostBars.visible && (
        <div
          className="absolute space-y-0.5"
          style={{ 
            width: config.boostBars.width * 0.35,
            right: config.boostBars.horizontalPadding * 0.3,
            top: `${config.boostBars.verticalPosition}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {orangeTeamPlayers.map((player) => {
            const shapeStyles = getShapeStyle(config.boostBars.shape, config.boostBars.borderRadius * 0.4);
            const barShapeStyles = getShapeStyle(config.boostBars.shape, config.boostBars.barHeight * 0.2);
            return (
              <div
                key={player.id}
                className="flex items-center gap-1 px-1.5 py-0.5 flex-row-reverse"
                style={{
                  ...getBackgroundStyle(config.boostBars.backgroundColor, config.boostBars.backgroundGradient),
                  ...shapeStyles,
                  ...getGlowStyle(config.boostBars.glow),
                  opacity: config.boostBars.opacity,
                  fontSize: config.boostBars.fontSize * 0.4,
                }}
              >
                {/* Player name - flex container */}
                {config.boostBars.showPlayerNames && (
                  <div className="flex-1 min-w-0">
                    <span className="text-white truncate uppercase font-semibold block" style={{ fontSize: 5, textAlign: 'right' }}>
                      {player.name}
                    </span>
                  </div>
                )}
                {/* Boost bar - fixed width */}
                <div 
                  className="flex-shrink-0 overflow-hidden"
                  style={{
                    width: config.boostBars.boostBarWidth * 0.35,
                    height: config.boostBars.barHeight * 0.4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    ...barShapeStyles,
                  }}
                >
                  <div
                    className="h-full"
                    style={{ 
                      width: `${normalizeBoost(player.boost)}%`, 
                      backgroundColor: config.boostBars.teamBColor,
                      ...barShapeStyles,
                    }}
                  />
                </div>
                {config.boostBars.showBoostValue && (
                  <span className="font-mono text-white w-3 text-center font-bold flex-shrink-0" style={{ fontSize: 5 }}>
                    {normalizeBoost(player.boost)}
                  </span>
                )}
              </div>
            );
          })}
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
              opacity: config.boostCircle.opacity,
              ...getGlowStyle(config.boostCircle.glow),
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
                strokeDashoffset={2 * Math.PI * (config.boostCircle.size * 0.4 - config.boostCircle.strokeWidth * 0.4) / 2 * (1 - normalizeBoost(targetPlayer.boost) / 100)}
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
                {normalizeBoost(targetPlayer.boost)}
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
              opacity: config.playerStats.opacity,
              ...getGlowStyle(config.playerStats.glow),
            }}
          >
            <span 
              className="font-semibold truncate"
              style={{ 
                fontSize: config.playerStats.fontSize * 0.5,
                maxWidth: 40,
              }}
            >
              {targetPlayer.name}
            </span>
            <div className="flex items-center gap-1">
              {config.playerStats.showScore && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 5 }}>SCR</span>
                  <span className="font-mono font-medium" style={{ fontSize: 5 }}>{targetPlayer.score}</span>
                </div>
              )}
              {config.playerStats.showGoals && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 5 }}>G</span>
                  <span className="font-mono font-medium" style={{ fontSize: 5 }}>{targetPlayer.goals}</span>
                </div>
              )}
              {config.playerStats.showAssists && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 5 }}>A</span>
                  <span className="font-mono font-medium" style={{ fontSize: 5 }}>{targetPlayer.assists}</span>
                </div>
              )}
              {config.playerStats.showSaves && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 5 }}>SV</span>
                  <span className="font-mono font-medium" style={{ fontSize: 5 }}>{targetPlayer.saves}</span>
                </div>
              )}
              {config.playerStats.showShots && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 5 }}>SH</span>
                  <span className="font-mono font-medium" style={{ fontSize: 5 }}>{targetPlayer.shots}</span>
                </div>
              )}
              {config.playerStats.showDemos && (
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground" style={{ fontSize: 5 }}>DEM</span>
                  <span className="font-mono font-medium" style={{ fontSize: 5 }}>{targetPlayer.demos}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
