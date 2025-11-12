import { useCallback } from "react";

export type Pt = { x: number; y: number };

/**
 * Hook para calcular a interseção entre duas linhas.
 * Cada linha é definida por dois pontos: (p1,p2) e (p3,p4)
 *
 * Retorna:
 *  - { x, y } se houver interseção
 *  - null se forem paralelas ou coincidentes
 */
export function useLineIntersection() {
  const getIntersection = useCallback(
    (p1: Pt, p2: Pt, p3: Pt, p4: Pt): Pt | null => {
      const denom =
        (p1.x - p2.x) * (p3.y - p4.y) -
        (p1.y - p2.y) * (p3.x - p4.x);

      if (denom === 0) return null; // Linhas paralelas ou coincidentes

      const x =
        ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
          (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) /
        denom;

      const y =
        ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
          (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) /
        denom;

      return { x, y };
    },
    []
  );

  return { getIntersection };
}
