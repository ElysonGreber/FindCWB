import { useMemo } from "react";

export type Pt = { x: number; y: number };

/**
 * Retorna N pontos igualmente espaçados entre dois pontos A e B.
 *
 * @param A Ponto inicial
 * @param B Ponto final
 * @param n Quantidade de pontos intermediários (não inclui A e B)
 * @returns Array de pontos intermediários [{x, y}, ...]
 */
export function useIntermediatePoints(A: Pt, B: Pt, n: number): Pt[] {
  return useMemo(() => {
    if (n <= 0) return [];

    const points: Pt[] = [];

    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1); // fração entre A (t=0) e B (t=1)
      points.push({
        x: A.x + (B.x - A.x) * t,
        y: A.y + (B.y - A.y) * t,
      });
    }

    return points;
  }, [A, B, n]);
}
