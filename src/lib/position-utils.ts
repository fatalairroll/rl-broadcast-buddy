import type { CSSProperties } from 'react';
import type { PositionV2 } from '@/types/overlayV2';

/**
 * Convert a PositionV2 anchor + offset into absolute-positioning CSS.
 * The element MUST be `position: absolute` inside a 1920x1080 stage.
 * For center/middle anchors we use translate(-50%) so offsets remain
 * relative to the element's own center.
 */
export function positionToStyle(pos: PositionV2): CSSProperties {
  const style: CSSProperties = { position: 'absolute' };
  const tx: string[] = [];

  if (pos.anchorH === 'left') {
    style.left = pos.offsetX;
  } else if (pos.anchorH === 'right') {
    style.right = pos.offsetX;
  } else {
    style.left = '50%';
    tx.push(`translateX(calc(-50% + ${pos.offsetX}px))`);
  }

  if (pos.anchorV === 'top') {
    style.top = pos.offsetY;
  } else if (pos.anchorV === 'bottom') {
    style.bottom = pos.offsetY;
  } else {
    style.top = '50%';
    tx.push(`translateY(calc(-50% + ${pos.offsetY}px))`);
  }

  if (tx.length) style.transform = tx.join(' ');
  return style;
}
