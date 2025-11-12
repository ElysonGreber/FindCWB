import { useCallback } from "react";

export type Pt = { x: number; y: number };

export function useDistance() {
  const getDistance = useCallback((p1: Pt, p2: Pt): number => {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }, []);
  return { getDistance };
  
}
