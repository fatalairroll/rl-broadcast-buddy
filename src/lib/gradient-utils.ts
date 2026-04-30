export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  enabled: boolean;
  type: 'linear' | 'radial';
  angle: number; // deg, only for linear
  stops: GradientStop[];
}

export const defaultGradient = (from: string, to: string, angle = 135): GradientConfig => ({
  enabled: true,
  type: 'linear',
  angle,
  stops: [
    { color: from, position: 0 },
    { color: to, position: 100 },
  ],
});

export function gradientToCss(g?: GradientConfig | null, fallback?: string): string | undefined {
  if (!g || !g.enabled || g.stops.length < 2) return fallback;
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ');
  if (g.type === 'radial') return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}
