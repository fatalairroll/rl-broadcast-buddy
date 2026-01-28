import type { GradientConfig } from '@/types/broadcast';

/**
 * Generates CSS background style from gradient config or solid color
 */
export function getBackgroundStyle(
  backgroundColor: string,
  gradient?: GradientConfig
): React.CSSProperties {
  if (!gradient?.enabled || !gradient.stops || gradient.stops.length === 0) {
    return { backgroundColor };
  }

  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsString = sortedStops
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');

  if (gradient.type === 'linear') {
    return {
      background: `linear-gradient(${gradient.angle}deg, ${stopsString})`,
    };
  }

  return {
    background: `radial-gradient(circle, ${stopsString})`,
  };
}

/**
 * Creates a default gradient config
 */
export function createDefaultGradient(baseColor: string = '#3B82F6'): GradientConfig {
  return {
    enabled: false,
    type: 'linear',
    angle: 135,
    stops: [
      { color: baseColor, position: 0 },
      { color: '#8B5CF6', position: 100 },
    ],
  };
}
