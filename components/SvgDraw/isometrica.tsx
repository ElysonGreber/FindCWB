"use client";

import { useState, useRef, useMemo } from "react";
import { useIsoGrid } from "@/hooks/useIsometricGrid";

type Pt = { x: number; y: number };
type Path = { id: number; points: Pt[]; color: string };

export function useIGrid(width = 1500, height = 1500, spacing = 80) {
  const grid = useIsoGrid(width, height, spacing);
  return { grid };
}

export default function Isometric() {
  const W = 1500;
  const H = 1500;
  const spacing = 80;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const { grid } = useIGrid(W, H, spacing);

  const [paths, setPaths] = useState<Path[]>([]);
  const [activePath, setActivePath] = useState<Path | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("cyan");

  // === Calcula interseções da grid ===
  const intersections = useMemo(() => {
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
  }, [grid]);

  // === Converte clique para coordenadas SVG ===
  const toSvgCoords = (e: React.MouseEvent<SVGSVGElement>): Pt => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x, y };
  };

  // === Pega a interseção mais próxima ===
  const getClosestIntersection = (p: Pt, tolerance = 10): Pt | null => {
    let closest: Pt | null = null;
    let minDist = Infinity;
    intersections.forEach((iPt) => {
      const d = Math.hypot(iPt.x - p.x, iPt.y - p.y);
      if (d < minDist && d <= tolerance) {
        closest = iPt;
        minDist = d;
      }
    });
    return closest;
  };

  // === Clicar adiciona ponto ao path ativo ===
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const raw = toSvgCoords(e);
    const nearest = getClosestIntersection(raw);
    if (!nearest) return; // só aceita cliques nas interseções

    setActivePath((prev) => {
      if (!prev) {
        const newPath: Path = { id: Date.now(), points: [nearest], color: selectedColor };
        return newPath;
      } else {
        return { ...prev, points: [...prev.points, nearest] };
      }
    });
  };

  // === Finaliza path atual ===
  const finalizePath = () => {
    if (activePath && activePath.points.length > 1) {
      setPaths((prev) => [...prev, activePath]);
      setActivePath(null);
    }
  };

  // === Exportar JSON ===
  const exportJSON = () => {
    const data = JSON.stringify(paths, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "isometric_paths.json";
    a.click();
  };

  // === Exportar SVG ===
  const exportSVG = () => {
    const pathElements = paths
      .map((p) => {
        const d = p.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
        return `<polyline points="${d}" fill="none" stroke="${p.color}" stroke-width="2"/>`;
      })
      .join("\n");
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
${pathElements}
</svg>`;
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "isometric_paths.svg";
    a.click();
  };

  const clearAll = () => {
    setPaths([]);
    setActivePath(null);
  };

  // === Cores disponíveis ===
  const colors = ["cyan", "orange", "magenta", "lime"];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
      <div className="mb-4 space-x-3 flex items-center">
        <button
          onClick={finalizePath}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Novo Path
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
        >
          Limpar Tudo
        </button>
        <button
          onClick={exportJSON}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
        >
          Exportar JSON
        </button>
        <button
          onClick={exportSVG}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700"
        >
          Exportar SVG
        </button>

        {/* === Seletor de cor === */}
        <div className="flex items-center space-x-2 ml-6">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${
                selectedColor === c ? "border-white" : "border-gray-600"
              }`}
              style={{ backgroundColor: c }}
              title={`Selecionar ${c}`}
            />
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onClick={handleClick}
        className="cursor-crosshair select-none bg-neutral-900"
      >
        {/* === Grade Isométrica === */}
        {grid.map((ln, i) => (
          <line
            key={i}
            x1={ln.A.x}
            y1={ln.A.y}
            x2={ln.B.x}
            y2={ln.B.y}
            stroke="#333"
            strokeWidth={0.4}
          />
        ))}

        {/* === Paths existentes === */}
        {paths.map((p) => (
          <g key={p.id}>
            <polyline
              points={p.points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
              fill="none"
              stroke={p.color}
              strokeWidth={2}
            />
            {p.points.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={4} fill={p.color} />
                <text
                  x={pt.x + 10}
                  y={pt.y - 10}
                  fill={p.color}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  ({Math.round(pt.x)}, {Math.round(pt.y)})
                </text>
              </g>
            ))}
          </g>
        ))}

        {/* === Path ativo === */}
        {activePath && activePath.points.length > 1 && (
          <polyline
            points={activePath.points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
            fill="none"
            stroke={activePath.color}
            strokeWidth={2}
          />
        )}

        {/* === Pontos ativos === */}
        {activePath &&
          activePath.points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill={activePath.color} />
              <text
                x={p.x + 10}
                y={p.y - 10}
                fill={activePath.color}
                fontSize="12"
                fontFamily="monospace"
              >
                ({Math.round(p.x)}, {Math.round(p.y)})
              </text>
            </g>
          ))}
      </svg>
    </div>
  );
}
