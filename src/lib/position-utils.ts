import type { CSSProperties } from 'react';
import type { PositionV2 } from '@/types/overlayV2';

const STAGE_W = 1920;
const STAGE_H = 1080;

/**
 * Convert a PositionV2 anchor + offset into absolute-positioning CSS.
 * The element MUST be `position: absolute` inside a 1920x1080 stage.
 *
 * SEMANTICS: offsetX / offsetY are ALWAYS relative to the SCREEN CENTER
 * (960, 540). The anchor selects which point of the ELEMENT is glued to
 * that screen-center-relative point:
 *   anchorH=left   → element's LEFT edge   sits at (960 + offsetX)
 *   anchorH=center → element's CENTER      sits at (960 + offsetX)
 *   anchorH=right  → element's RIGHT edge  sits at (960 + offsetX)
 *   anchorV=top    → element's TOP edge    sits at (540 + offsetY)
 *   anchorV=middle → element's MIDDLE      sits at (540 + offsetY)
 *   anchorV=bottom → element's BOTTOM edge sits at (540 + offsetY)
 *
 * Therefore (anchor=center/middle, 0, 0) puts the element's center at
 * the screen center, regardless of the element's own size.
 */
export function positionToStyle(pos: PositionV2): CSSProperties {
  const style: CSSProperties = { position: 'absolute' };
  const tx: string[] = [];

  // Horizontal: always position via `left` from screen center, then translate
  // the element by 0 / -50% / -100% of its own width depending on anchor.
  style.left = STAGE_W / 2 + pos.offsetX;
  if (pos.anchorH === 'center') tx.push('translateX(-50%)');
  else if (pos.anchorH === 'right') tx.push('translateX(-100%)');

  // Vertical: same pattern.
  style.top = STAGE_H / 2 + pos.offsetY;
  if (pos.anchorV === 'middle') tx.push('translateY(-50%)');
  else if (pos.anchorV === 'bottom') tx.push('translateY(-100%)');

  if (tx.length) style.transform = tx.join(' ');
  return style;
}
