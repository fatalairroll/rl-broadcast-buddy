import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import type { OverlayV2Preset } from '@/hooks/useOverlayV2Config';

export const Y2K_PRESET_NAME = 'Y2K CHROME';
export const Y2K_PRESET_VERSION = 2;

export const Y2K_OVERLAY_CONFIG: OverlayV2Config = {
  ...defaultOverlayV2Config,
  scoreboard: {
    ...defaultOverlayV2Config.scoreboard,
    // anchorV:'top' + offsetY:-540 → top edge at y=0 regardless of coverHeight.
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -540 },
    coverWidth: 740,
    coverHeight: 76,
  },
  seriesScore: { ...defaultOverlayV2Config.seriesScore, visible: false },
  teamNameBlue: { ...defaultOverlayV2Config.teamNameBlue, visible: false },
  teamNameOrange: { ...defaultOverlayV2Config.teamNameOrange, visible: false },
  boostBar: {
    ...defaultOverlayV2Config.boostBar,
    // Boost rows are 230×32 with 6px gap; 3 rows ≈ 108px tall.
    // Place hugging the edges of the play area, vertically centered-ish below scorebar.
    // anchorH:'left'/'right', offsetX = ±(960-24) puts the box 24px from screen edge.
    positionLeft: { anchorH: 'left', anchorV: 'top', offsetX: -936, offsetY: -300 },
    positionRight: { anchorH: 'right', anchorV: 'top', offsetX: 936, offsetY: -300 },
  },
  playerCard: {
    ...defaultOverlayV2Config.playerCard,
    position: { anchorH: 'left', anchorV: 'bottom', offsetX: 24, offsetY: 64 },
    rankIconSize: 48,
    rankOffsetX: 0,
    rankOffsetY: 0,
  },
  boostGauge: {
    ...defaultOverlayV2Config.boostGauge,
    visible: true,
    size: 230,
    position: { anchorH: 'right', anchorV: 'bottom', offsetX: -936, offsetY: 424 },
  },
  general: { ...defaultOverlayV2Config.general, theme: 'y2k', presetVersion: Y2K_PRESET_VERSION },
};

/**
 * Ensure the Y2K CHROME systemowy preset is present and up-to-date.
 * Mirrors ensureGlassPreset semantics.
 */
export async function ensureY2kPreset(
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
  const existing = presets.find((p) => p.name === Y2K_PRESET_NAME);
  if (!existing) {
    await createPreset(
      Y2K_PRESET_NAME,
      Y2K_OVERLAY_CONFIG,
      'Chromowany Y2K HUD (drugi systemowy motyw obok GLASS OVERLAY).',
    );
    return;
  }
  if (!updatePreset) return;
  const currentVersion = existing.config.general?.presetVersion ?? 0;
  if (currentVersion >= Y2K_PRESET_VERSION) return;
  await updatePreset(existing.id, {
    config: Y2K_OVERLAY_CONFIG,
    description: 'Chromowany Y2K HUD (drugi systemowy motyw obok GLASS OVERLAY).',
  });
}