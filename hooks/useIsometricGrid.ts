// 📁 src/hooks/useTrueIsometricPerspectiveGrid.ts
import { useMemo } from "react";

export type Pt = { x: number; y: number };
export type Line = { A: Pt; B: Pt };

export function useIsoGrid(
  width = 1500,
  height = 1500,
  spacing = 60
): Line[] {
  return useMemo(() => {
    const lines: Line[] = [];
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    // Parâmetros da projeção isométrica
    const angle = toRad(30);
    const cos30 = Math.cos(angle);
    const sin30 = Math.sin(angle);

    // Conversão 3D → 2D
    const project = (x: number, y: number, z: number): Pt => ({
      x: (x - y) * cos30 + width / 2,
      y: (x + y) * sin30 - z + height / 2,
    });

    const gridSize = 20; // número de células
    const max = gridSize * spacing;

    // 🔹 Linhas do eixo X
    for (let y = 0; y <= max; y += spacing) {
      for (let z = 0; z <= max; z += spacing) {
        const A = project(0, y, z);
        const B = project(max, y, z);
        lines.push({ A, B });
      }
    }

    // 🔹 Linhas do eixo Y
    for (let x = 0; x <= max; x += spacing) {
      for (let z = 0; z <= max; z += spacing) {
        const A = project(x, 0, z);
        const B = project(x, max, z);
        lines.push({ A, B });
      }
    }

    // 🔹 Linhas do eixo Z (VERTICAIS) — CORRIGIDAS
    for (let x = 0; x <= max; x += spacing) {
      for (let y = 0; y <= max; y += spacing) {
        const A = project(x, y, 0);
        const B = project(x, y, max);
        lines.push({ A, B });
      }
    }

    return lines;
  }, [width, height, spacing]);
}
