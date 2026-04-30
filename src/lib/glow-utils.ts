export interface GlowConfig {
  enabled: boolean;
  color: string;
  blur: number;
  spread: number;
  intensity: number; // 0-1
}

export const defaultGlow: GlowConfig = {
  enabled: false,
  color: 'hsl(217 91% 60%)',
  blur: 16,
  spread: 0,
  intensity: 0.6,
};

export function glowToBoxShadow(g?: GlowConfig | null): string | undefined {
  if (!g || !g.enabled) return undefined;
  const alpha = Math.max(0, Math.min(1, g.intensity));
  return `0 0 ${g.blur}px ${g.spread}px ${withAlpha(g.color, alpha)}`;
}

export function glowToTextShadow(g?: GlowConfig | null): string | undefined {
  if (!g || !g.enabled) return undefined;
  const alpha = Math.max(0, Math.min(1, g.intensity));
  return `0 0 ${Math.round(g.blur * 0.6)}px ${withAlpha(g.color, alpha)}`;
}

function withAlpha(color: string, alpha: number): string {
  // Accepts hsl(...) or hsla(...) or #hex or rgb/rgba — try simple cases
  if (color.startsWith('hsl(')) return color.replace('hsl(', 'hsla(').replace(')', ` / ${alpha})`);
  if (color.startsWith('hsla(')) return color;
  if (color.startsWith('#')) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${color}${a}`;
  }
  return color;
}
