// hooks/useLineExtend.ts
export type Pt = { x: number; y: number };

export function useLineExtend() {
  // Calcula interseção entre duas linhas
  const getIntersection = (A1: Pt, B1: Pt, A2: Pt, B2: Pt): Pt | null => {
    const x1 = A1.x, y1 = A1.y, x2 = B1.x, y2 = B1.y;
    const x3 = A2.x, y3 = A2.y, x4 = B2.x, y4 = B2.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-6) return null;

    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) -
        (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denom;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) -
        (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denom;

    return { x: px, y: py };
  };

  // Estende a primeira linha até interseção
  const extendLine = (
    line1: { A: Pt; B: Pt },
    line2: { A: Pt; B: Pt }
  ): { A: Pt; B: Pt } | null => {
    const inter = getIntersection(line1.A, line1.B, line2.A, line2.B);
    if (!inter) return null;
    return { A: line1.A, B: inter };
  };

  return { getIntersection, extendLine };
}
