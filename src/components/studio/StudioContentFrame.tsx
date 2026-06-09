import type { CSSProperties, ReactNode } from 'react';
import {
  STUDIO_CAMERA_SAFE_RIGHT,
  STUDIO_PADDING_TOP,
  STUDIO_PADDING_BOTTOM,
  STUDIO_SIDEBAR_WIDTH,
  STUDIO_MAX_WIDTH_DEFAULT,
} from '@/lib/studio-layout';

interface Props {
  children: ReactNode;
  obs: boolean;
  maxWidth?: number;
  style?: CSSProperties;
}

export function StudioContentFrame({
  children,
  obs,
  maxWidth = STUDIO_MAX_WIDTH_DEFAULT,
  style,
}: Props) {
  return (
    <div
      className="relative w-full min-h-screen flex flex-col"
      style={{
        background: 'transparent',
        paddingLeft: 0,
        paddingRight: STUDIO_CAMERA_SAFE_RIGHT,
        paddingTop: STUDIO_PADDING_TOP,
        paddingBottom: STUDIO_PADDING_BOTTOM,
        marginLeft: obs ? 0 : STUDIO_SIDEBAR_WIDTH,
        alignItems: 'center',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

export default StudioContentFrame;