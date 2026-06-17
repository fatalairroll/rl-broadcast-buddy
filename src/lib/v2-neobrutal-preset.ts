import { defaultOverlayV2Config, type OverlayV2Config } from '@/types/overlayV2';
import type { OverlayV2Preset } from '@/hooks/useOverlayV2Config';

export const NEOBRUTAL_PRESET_NAME = 'NEO-BRUTALISM';
export const NEOBRUTAL_PRESET_VERSION = 1;

export const NEOBRUTAL_OVERLAY_CONFIG: OverlayV2Config = {
  ...defaultOverlayV2Config,
  scoreboard: {
    ...defaultOverlayV2Config.scoreboard,
    // anchorV:'top' + offsetY:-540 → top edge at y=0 (same semantics as Y2K).
    position: { anchorH: 'center', anchorV: 'top', offsetX: 0, offsetY: -540 },
    coverWidth: 760,
    coverHeight: 78,
  },
  seriesScore: { ...defaultOverlayV2Config.seriesScore, visible: false },
  teamNameBlue: { ...defaultOverlayV2Config.teamNameBlue, visible: false },
  teamNameOrange: { ...defaultOverlayV2Config.teamNameOrange, visible: false },
  boostBar: {
    ...defaultOverlayV2Config.boostBar,
    // Hug screen edges, below scorebar.
    positionLeft: { anchorH: 'left', anchorV: 'top', offsetX: -936, offsetY: -300 },
    positionRight: { anchorH: 'right', anchorV: 'top', offsetX: 936, offsetY: -300 },
  },
  playerCard: {
    ...defaultOverlayV2Config.playerCard,
    position: { anchorH: 'left', anchorV: 'bottom', offsetX: 24, offsetY: 64 },
    rankIconSize: 52,
    rankOffsetX: 0,
    rankOffsetY: 0,
  },
  boostGauge: {
    ...defaultOverlayV2Config.boostGauge,
    visible: true,
    size: 230,
    position: { anchorH: 'right', anchorV: 'bottom', offsetX: -936, offsetY: 424 },
  },
  general: { ...defaultOverlayV2Config.general, theme: 'neobrutal', presetVersion: NEOBRUTAL_PRESET_VERSION },
};

/** Ensure NEO-BRUTALISM systemowy preset is present and up-to-date. */
export async function ensureNeobrutalPreset(
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
  const existing = presets.find((p) => p.name === NEOBRUTAL_PRESET_NAME);
  if (!existing) {
    await createPreset(
      NEOBRUTAL_PRESET_NAME,
      NEOBRUTAL_OVERLAY_CONFIG,
      'Neo-brutalism HUD — płaskie bloki, grube obrysy, twarde cienie.',
    );
    return;
  }
  if (!updatePreset) return;
  const currentVersion = existing.config.general?.presetVersion ?? 0;
  if (currentVersion >= NEOBRUTAL_PRESET_VERSION) return;
  await updatePreset(existing.id, {
    config: NEOBRUTAL_OVERLAY_CONFIG,
    description: 'Neo-brutalism HUD — płaskie bloki, grube obrysy, twarde cienie.',
  });
}