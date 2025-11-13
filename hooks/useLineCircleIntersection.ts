import { useMemo } from "react";

export type Pt = { x: number; y: number };

export interface Circle {
  center: Pt;
  radius: number;
}

/**
 * Calcula os pontos de interseção entre uma linha (definida por A e B)
 * e um círculo (definido por centro e raio).
 *
 * Retorna um array com 0, 1 ou 2 pontos [{x, y}, ...]
 */
export function useLineCircleIntersection(
  A: Pt,
  B: Pt,
  circle: Circle
): Pt[] {
  return useMemo(() => {
    const { center, radius } = circle;

    // Vetor da linha
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    // Translada para que o círculo esteja na origem
    const fx = A.x - center.x;
    const fy = A.y - center.y;

    // Coeficientes da equação quadrática
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;

    // Nenhuma interseção
    if (discriminant < 0) return [];

    // Uma interseção (tangente)
    if (Math.abs(discriminant) < 1e-6) {
      const t = -b / (2 * a);
      return [{ x: A.x + t * dx, y: A.y + t * dy }];
    }

    // Duas interseções
    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b + sqrtDisc) / (2 * a);
    const t2 = (-b - sqrtDisc) / (2 * a);

    return [
      { x: A.x + t1 * dx, y: A.y + t1 * dy },
      { x: A.x + t2 * dx, y: A.y + t2 * dy },
    ];
  }, [A, B, circle]);
}
