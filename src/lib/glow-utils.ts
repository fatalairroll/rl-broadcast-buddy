import type { GlowConfig } from '@/types/broadcast';

/**
 * Convert hex color to rgba with given opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Handle rgba format
  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
  }
  
  // Handle rgb format
  if (hex.startsWith('rgb')) {
    const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
  }

  // Handle hex format
  let hexColor = hex.replace('#', '');
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(59, 130, 246, ${opacity})`; // fallback to blue
  }
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate CSS box-shadow style from GlowConfig
 */
export function getGlowStyle(glow?: GlowConfig): React.CSSProperties {
  if (!glow?.enabled) return {};
  
  const { color, blur, spread, intensity } = glow;
  const rgba = hexToRgba(color, intensity);
  
  return {
    boxShadow: `0 0 ${blur}px ${spread}px ${rgba}`,
  };
}

/**
 * Create default glow configuration
 */
export function createDefaultGlow(): GlowConfig {
  return {
    enabled: false,
    color: '#3B82F6',
    blur: 10,
    spread: 2,
    intensity: 0.5,
  };
}
