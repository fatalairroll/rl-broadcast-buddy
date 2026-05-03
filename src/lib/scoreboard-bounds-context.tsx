import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Bounding box of the scoreboard tiles (Blue + Timer + Orange) in stage px,
 * relative to the 1920x1080 stage origin (top-left). */
export interface ScoreboardBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

interface Ctx {
  bounds: ScoreboardBounds | null;
  setBounds: (b: ScoreboardBounds | null) => void;
}

const ScoreboardBoundsContext = createContext<Ctx>({
  bounds: null,
  setBounds: () => {},
});

export function ScoreboardBoundsProvider({ children }: { children: ReactNode }) {
  const [bounds, setBounds] = useState<ScoreboardBounds | null>(null);
  const value = useMemo(() => ({ bounds, setBounds }), [bounds]);
  return (
    <ScoreboardBoundsContext.Provider value={value}>{children}</ScoreboardBoundsContext.Provider>
  );
}

export function useScoreboardBounds() {
  return useContext(ScoreboardBoundsContext);
}