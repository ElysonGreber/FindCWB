import { useMemo } from "react";
import type { Pt } from "@/types";

export function useGridIntersections(grid: { A: Pt; B: Pt }[], W: number, H: number) {
  return useMemo(() => {
    const pts: Pt[] = [];
    const seen = new Set<string>();

    grid.forEach((lnA) => {
      grid.forEach((lnB) => {
        const denom =
          (lnA.A.x - lnA.B.x) * (lnB.A.y - lnB.B.y) -
          (lnA.A.y - lnA.B.y) * (lnB.A.x - lnB.B.x);
        if (Math.abs(denom) < 1e-6) return;
        const px =
          ((lnA.A.x * lnA.B.y - lnA.A.y * lnA.B.x) * (lnB.A.x - lnB.B.x) -
            (lnA.A.x - lnA.B.x) *
              (lnB.A.x * lnB.B.y - lnB.A.y * lnB.B.x)) /
          denom;
        const py =
          ((lnA.A.x * lnA.B.y - lnA.A.y * lnA.B.x) * (lnB.A.y - lnB.B.y) -
            (lnA.A.y - lnA.B.y) *
              (lnB.A.x * lnB.B.y - lnB.A.y * lnB.B.x)) /
          denom;

        if (px >= 0 && px <= W && py >= 0 && py <= H) {
          const key = `${Math.round(px)},${Math.round(py)}`;
          if (!seen.has(key)) {
            seen.add(key);
            pts.push({ x: px, y: py });
          }
        }
      });
    });
    return pts;
  }, [grid, W, H]);
}
