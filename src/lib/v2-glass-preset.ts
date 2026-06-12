import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import type { OverlayV2Preset } from '@/hooks/useOverlayV2Config';

export const GLASS_PRESET_NAME = 'GLASS OVERLAY';
export const GLASS_PRESET_VERSION = 5;

export const GLASS_OVERLAY_CONFIG: OverlayV2Config = {
  ...defaultOverlayV2Config,
  scoreboard: {
    ...defaultOverlayV2Config.scoreboard,
    // anchorV:'top' + offsetY:-540 → top edge sits at y=0 (canvas top).
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -540 },
    coverWidth: 620,
    coverHeight: 104,
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
    position: { anchorH: 'left', anchorV: 'bottom', offsetX: 24, offsetY: 64 },
  },
  boostGauge: {
    visible: true,
    size: 230,
    position: { anchorH: 'right', anchorV: 'bottom', offsetX: 936, offsetY: 424 },
  },
  general: { ...defaultOverlayV2Config.general, theme: 'glass', presetVersion: GLASS_PRESET_VERSION },
};

/**
 * Ensure the systemowy GLASS OVERLAY preset is present AND up to date.
 * - missing → create
 * - present with older general.presetVersion (or missing) → overwrite config in place
 * User presets/scenes with other names are never touched.
 */
export async function ensureGlassPreset(
  presets: OverlayV2Preset[],
  createPreset: (
    name: string,
    config: OverlayV2Config,
    description?: string,
  ) => Promise<{ data: OverlayV2Preset | null; error: unknown }>,
  updatePreset?: (
    id: string,
    updates: { name?: string; description?: string | null; config?: OverlayV2Config },
  ) => Promise<{ error: unknown }>,
): Promise<void> {
  const existing = presets.find((p) => p.name === GLASS_PRESET_NAME);
  if (!existing) {
    await createPreset(
      GLASS_PRESET_NAME,
      GLASS_OVERLAY_CONFIG,
      'Preset szklanego HUD-a (sharp-glass) zsynchronizowany ze Studio.',
    );
    return;
  }
  if (!updatePreset) return;
  const currentVersion = existing.config.general?.presetVersion ?? 0;
  if (currentVersion >= GLASS_PRESET_VERSION) return;
  await updatePreset(existing.id, {
    config: GLASS_OVERLAY_CONFIG,
    description: 'Preset szklanego HUD-a (sharp-glass) zsynchronizowany ze Studio.',
  });
}