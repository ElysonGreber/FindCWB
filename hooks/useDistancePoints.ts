import { useMemo } from "react";

export type Pt = { x: number; y: number };

/**
 * Retorna a distância entre dois pontos (A e B).
 * Atualiza automaticamente quando A ou B mudam.
 */
export function useDistancePoints(A: Pt, B: Pt): number {
  return useMemo(() => {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [A, B]);
}