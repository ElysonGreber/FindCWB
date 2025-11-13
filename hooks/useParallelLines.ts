import { useMemo } from "react";

export type Pt = { x: number; y: number };
export type Line = { A: Pt; B: Pt };

/**
 * Gera N linhas paralelas igualmente espaçadas entre duas linhas base.
 */
export function useParallelLines(lineA: Line, lineB: Line, n: number): Line[] {
  return useMemo(() => {
    if (n <= 0) return [];

    const lines: Line[] = [];
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      const A = {
        x: lineA.A.x + (lineB.A.x - lineA.A.x) * t,
        y: lineA.A.y + (lineB.A.y - lineA.A.y) * t,
      };
      const B = {
        x: lineA.B.x + (lineB.B.x - lineA.B.x) * t,
        y: lineA.B.y + (lineB.B.y - lineA.B.y) * t,
      };
      lines.push({ A, B });
    }
    return lines;
  }, [lineA, lineB, n]);
}
