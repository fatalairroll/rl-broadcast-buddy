import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import type { OverlayV2Preset } from '@/hooks/useOverlayV2Config';

export const GLASS_PRESET_NAME = 'GLASS OVERLAY';

export const GLASS_OVERLAY_CONFIG: OverlayV2Config = {
  ...defaultOverlayV2Config,
  scoreboard: {
    ...defaultOverlayV2Config.scoreboard,
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -518 },
  },
  seriesScore: {
    ...defaultOverlayV2Config.seriesScore,
    visible: false, // pigułki renderowane wewnątrz GlassScorebar
  },
  teamNameBlue: { ...defaultOverlayV2Config.teamNameBlue, visible: false },
  teamNameOrange: { ...defaultOverlayV2Config.teamNameOrange, visible: false },
  boostBar: {
    ...defaultOverlayV2Config.boostBar,
    positionLeft: { anchorH: 'left', anchorV: 'top', offsetX: -942, offsetY: -340 },
    positionRight: { anchorH: 'right', anchorV: 'top', offsetX: 942, offsetY: -340 },
  },
  playerCard: {
    ...defaultOverlayV2Config.playerCard,
    position: { anchorH: 'center', anchorV: 'bottom', offsetX: 0, offsetY: 420 },
  },
  general: { ...defaultOverlayV2Config.general, theme: 'glass' },
};

/**
 * Insert the GLASS OVERLAY preset once (by name) if it's not yet in the DB.
 * Idempotent — safe to call on every Creator mount.
 */
export async function ensureGlassPreset(
  presets: OverlayV2Preset[],
  createPreset: (
    name: string,
    config: OverlayV2Config,
    description?: string,
  ) => Promise<{ data: OverlayV2Preset | null; error: unknown }>,
): Promise<void> {
  if (presets.some((p) => p.name === GLASS_PRESET_NAME)) return;
  await createPreset(
    GLASS_PRESET_NAME,
    GLASS_OVERLAY_CONFIG,
    'Preset szklanego HUD-a (sharp-glass) zsynchronizowany ze Studio.',
  );
}