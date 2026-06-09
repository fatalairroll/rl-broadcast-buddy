import type { ReactNode } from 'react';
import {
  STUDIO_CONTENT_MAX_WIDTH,
  studioContentStyle,
} from '@/lib/studio-layout';

interface Props {
  children: ReactNode;
  obs: boolean;
}

export function StudioContentFrame({ children, obs }: Props) {
  return (
    <div style={studioContentStyle(obs)}>
      <div style={{ width: '100%', maxWidth: STUDIO_CONTENT_MAX_WIDTH, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

export default StudioContentFrame;