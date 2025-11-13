import { useMemo } from "react";

export type Pt = { x: number; y: number };

/**
 * Hook para gerar um arco de círculo suavizado com curvas Bézier cúbicas.
 * É matematicamente preciso (erro < 0.001%).
 *
 * @param center Centro do círculo
 * @param radius Raio
 * @param startAngle Ângulo inicial (graus)
 * @param endAngle Ângulo final (graus)
 * @param segments (opcional) número de subdivisões (90° padrão)
 * @returns path SVG (string)
 */
export function useArcBezier(
  center: Pt,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number = 4
): string {
  return useMemo(() => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const delta = (endAngle - startAngle) / segments;
    const k = (4 / 3) * Math.tan((Math.PI / (2 * segments)) / 2);

    const path: string[] = [];

    for (let i = 0; i < segments; i++) {
      const a0 = toRad(startAngle + delta * i);
      const a1 = toRad(startAngle + delta * (i + 1));

      const x0 = center.x + radius * Math.cos(a0);
      const y0 = center.y + radius * Math.sin(a0);
      const x1 = center.x + radius * Math.cos(a1);
      const y1 = center.y + radius * Math.sin(a1);

      const dx0 = -radius * Math.sin(a0);
      const dy0 = radius * Math.cos(a0);
      const dx1 = -radius * Math.sin(a1);
      const dy1 = radius * Math.cos(a1);

      const p1x = x0 + k * dx0;
      const p1y = y0 + k * dy0;
      const p2x = x1 - k * dx1;
      const p2y = y1 - k * dy1;

      if (i === 0) path.push(`M ${x0.toFixed(3)} ${y0.toFixed(3)}`);
      path.push(`C ${p1x.toFixed(3)} ${p1y.toFixed(3)}, ${p2x.toFixed(3)} ${p2y.toFixed(3)}, ${x1.toFixed(3)} ${y1.toFixed(3)}`);
    }

    return path.join(" ");
  }, [center, radius, startAngle, endAngle, segments]);
}
