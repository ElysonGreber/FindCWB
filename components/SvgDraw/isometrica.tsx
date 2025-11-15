//components/SvgDraw/isometrica.tsx
"use client";

import { useRef, useState } from "react";
import { useIsoGrid } from "@/hooks/useIsometricGrid";
import { useGridIntersections } from "@/hooks/useGridIntersections";
import { usePathsManager } from "@/hooks/usePathsManager";
import { useHotkeys } from "@/hooks/useHotkeys";
import { IsoGrid } from "@/components/SvgDraw/IsoGrid";
import { IsoPaths } from "@/components/SvgDraw/IsoPaths";
import { IsoToolbar } from "@/components/SvgDraw/IsoToolbar";
import { useLineExtension } from "@/hooks/useLineExtension";
import { usePolygonManager } from "@/hooks/usePolygonManager";
import type { Pt } from "@/types";

export default function Isometric() {
  const W = 1500;
  const H = 1500;
  const spacing = 60;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const grid = useIsoGrid(W, H, spacing);
  const intersections = useGridIntersections(grid, W, H);
  const [pointMode, setPointMode] = useState(false);
  const [ellipseMode, setEllipseMode] = useState(false);
  const [ellipsePoints, setEllipsePoints] = useState<Pt[]>([]);
  const [previewEllipse, setPreviewEllipse] = useState<{
    center: Pt;
    rx: number;
    ry: number;
  } | null>(null);

  // === PATHS (LINHAS) ===
  const {
    paths,
    setPaths,
    circles,
    ellipses,
    points,
    addPath,
    addCircle,
    addEllipse,
    addPoint,
    activePath,
    setActivePath,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    dashed,
    setDashed,
    colors,
    pointCount,
    setPointCount,
    finalizePath,
    undoLast,
    clear,
    getNextLabel,
    registerPolygon,
  } = usePathsManager();
  const {
    polygonMode,
    setPolygons,
    setPolygonMode,
    polygons,
    activePolygon,
    fillColor,
    setFillColor,
    fillOpacity,
    setFillOpacity,
    addPolygonPoint,
    finalizePolygon,
  } = usePolygonManager(registerPolygon);

  // === FUNÇÃO AUXILIAR: ativa apenas um modo por vez ===
  const activateMode = (
    mode: "line" | "polygon" | "circle" | "point" | "ellipse" | "none"
  ) => {
    setLineMode(false);
    setPolygonMode(false);
    setCircleMode(false);
    setPointMode(false);
    setEllipseMode(false);

    switch (mode) {
      case "line":
        setLineMode(true);
        break;
      case "polygon":
        setPolygonMode(true);
        break;
      case "circle":
        setCircleMode(true);
        break;
      case "point":
        setPointMode(true);
        break;
      case "ellipse":
        setEllipseMode(true);
        break;
      case "none":
        // nenhum ativo
        break;
    }
  };
  // === MODO DE FERRAMENTA ===
  const [lineMode, setLineMode] = useState(true);
  const [polygonInProgress, setPolygonInProgress] = useState(false);
  const [circleMode, setCircleMode] = useState(false);

  // === CÍRCULO ATIVO ===
  const [circlePoints, setCirclePoints] = useState<Pt[]>([]);
  const [previewCircle, setPreviewCircle] = useState<{
    center: Pt;
    radius: number;
  } | null>(null);

  // === EXTENSÃO ===
  const {
    extendMode,
    setExtendMode,
    handleExtendClick,
    handleHover,
    extendStart,
    previewLine,
    hoveredId,
    selectedId,
    phaseMessage,
  } = useLineExtension(paths, setPaths);

  // === EXPORTAÇÃO ===
  const exportJSON = () => {
    const data = JSON.stringify({ paths, circles, polygons }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "isometric_design.json";
    a.click();
  };

  const exportSVG = () => {
    const pathElements = paths
      .map((p) => {
        const d = p.points
          .map((pt: { x: any; y: any }) => `${pt.x},${pt.y}`)
          .join(" ");
        const dash = p.dashed ? `stroke-dasharray="6 6"` : "";
        return `<polyline points="${d}" fill="none" stroke="${p.color}" stroke-width="${p.strokeWidth}" ${dash}/>`;
      })
      .join("\n");

    const circleElements = circles
      .map(
        (c) =>
          `<circle cx="${c.center.x}" cy="${c.center.y}" r="${
            c.radius
          }" stroke="${c.color}" stroke-width="${c.strokeWidth}" fill="none" ${
            c.dashed ? `stroke-dasharray="6 6"` : ""
          } />`
      )
      .join("\n");

    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
${pathElements}
${circleElements}
</svg>`;
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "isometric_design.svg";
    a.click();
  };

  // === HOTKEYS ===
  useHotkeys({
    colors,
    setSelectedColor: setColor,
    finalizePath,
    undoLastPath: undoLast,
    toggleDashed: () => setDashed((d) => !d),
  });

  // === CONVERSÃO DE COORDENADAS ===
  const toSvgCoords = (e: React.MouseEvent<SVGSVGElement>): Pt => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

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
  // 🔍 Retorna ponto existente se o clique for próximo o suficiente
  const getClosestPoint = (p: Pt, tolerance = 12): any | null => {
    if (!points || points.length === 0) return null;
    let closest: any | null = null;
    let minDist = Infinity;
    points.forEach((pt) => {
      const d = Math.hypot(pt.x - p.x, pt.y - p.y);
      if (d < minDist && d <= tolerance) {
        closest = pt;
        minDist = d;
      }
    });
    return closest;
  };
  // 🔍 Busca por ponto válido (ponto existente, extremidade de linha ou interseção)
const getNearestSnapPoint = (p: Pt, tolerance = 12): Pt | null => {
  let candidates: Pt[] = [];

  // 1️⃣ Adiciona pontos já criados manualmente
  if (points && points.length > 0) {
    candidates.push(...points);
  }

  // 2️⃣ Adiciona extremidades de linhas (paths existentes)
  paths.forEach((path) => {
    if (path.points.length > 0) {
      const first = path.points[0];
      const last = path.points[path.points.length - 1];
      candidates.push(first, last);
    }
  });

  // 3️⃣ Adiciona interseções da grade (opcional)
  candidates.push(...intersections);

  // 4️⃣ Encontra o mais próximo do clique dentro do raio de tolerância
  let nearest: Pt | null = null;
  let minDist = Infinity;

  for (const c of candidates) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < minDist && d <= tolerance) {
      nearest = c;
      minDist = d;
    }
  }

  return nearest;
};

  // === CLICK PRINCIPAL ===
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const raw = toSvgCoords(e);

if (extendMode) {
  handleExtendClick(raw);
  return;
}

// 🧲 Busca ponto mais próximo (ponto, extremidade ou interseção)
const nearest = getNearestSnapPoint(raw);
if (!nearest) return;


    // 🔵 CÍRCULO
    if (circleMode) {
      if (circlePoints.length === 0) {
        setCirclePoints([nearest]);
      } else if (circlePoints.length === 1) {
        const center = circlePoints[0];
        const dx = nearest.x - center.x;
        const dy = nearest.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        addCircle({ center, radius, color, strokeWidth, dashed });
        setCirclePoints([]);
        setPreviewCircle(null);
      }
      return;
    }

    // 🔷 POLÍGONO
    if (polygonMode) {
      setPolygonInProgress(true);
      addPolygonPoint(nearest);
      return;
    }
    // 🟢 PONTO
    if (pointMode) {
      const label = getNextLabel(pointCount);
      setPointCount((n) => n + 1);
      addPoint({ ...nearest, label, color });
      return;
    }

    // 🟣 ELIPSE
    if (ellipseMode) {
      const nearest = getClosestIntersection(raw);
      if (!nearest) return;
      if (ellipsePoints.length === 0) {
        setEllipsePoints([nearest]);
      } else if (ellipsePoints.length === 1) {
        const center = ellipsePoints[0];
        const rx = Math.abs(nearest.x - center.x);
        const ry = Math.abs(nearest.y - center.y);
        addEllipse({ center, rx, ry, color, strokeWidth, dashed });
        setEllipsePoints([]);
        setPreviewEllipse(null);
      }
      return;
    }
    // 🔹 LINHA NORMAL
    const label = getNextLabel(pointCount);
    setPointCount((p) => p + 1);
    const labeledPoint = { ...nearest, label };

    setActivePath((prev: any) => {
      if (!prev) {
        const newPath = {
          id: crypto.randomUUID(),
          points: [labeledPoint],
          color,
          strokeWidth,
          dashed,
        };
        return newPath;
      } else {
        const updated = { ...prev, points: [...prev.points, labeledPoint] };
        if (updated.points.length > 1) {
          addPath(updated); // ✅ registra no histórico
          return null;
        }

        return updated;
      }
    });
  };

  // === MOVIMENTO DO MOUSE ===
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const raw = toSvgCoords(e);
    handleHover(raw);
    if (ellipseMode && ellipsePoints.length === 1) {
      const center = ellipsePoints[0];
      const rx = Math.abs(raw.x - center.x);
      const ry = Math.abs(raw.y - center.y);
      setPreviewEllipse({ center, rx, ry });
    }
    // Preview do círculo enquanto desenha
    if (circleMode && circlePoints.length === 1) {
      const center = circlePoints[0];
      const dx = raw.x - center.x;
      const dy = raw.y - center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setPreviewCircle({ center, radius });
    }
  };

  // === FINALIZAR POLÍGONO ===
  const handleFinalizePolygon = () => {
    finalizePolygon();
    setPolygonInProgress(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
      {/* === TOOLBAR === */}
      <IsoToolbar
        colors={colors}
        selectedColor={color}
        setSelectedColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        dashed={dashed}
        setDashed={setDashed}
        onUndo={() => undoLast({ polygons, setPolygons })}
        onClear={() => clear({ setPolygons })}
        onExportJSON={exportJSON}
        onExportSVG={exportSVG}
        polygonMode={polygonMode}
        setPolygonMode={setPolygonMode}
        polygonInProgress={polygonInProgress}
        fillColor={fillColor}
        setFillColor={setFillColor}
        fillOpacity={fillOpacity}
        setFillOpacity={setFillOpacity}
        onFinalizePolygon={handleFinalizePolygon}
        lineMode={lineMode}
        setLineMode={setLineMode}
        circleMode={circleMode}
        setCircleMode={setCircleMode}
        extendMode={extendMode}
        setExtendMode={setExtendMode}
        setPointMode={setPointMode}
        pointMode={pointMode}
        setEllipseMode={setEllipseMode}
        ellipseMode={ellipseMode}
      />

      {/* === DIALOGO DE AJUDA === */}
      {extendMode && (
        <div className="fixed bottom-6 right-6 bg-amber-700 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-sm z-50">
          {phaseMessage || "Clique sobre uma linha para iniciar a extensão."}
        </div>
      )}

      {/* === SVG === */}
      {/* === SVG === */}
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className="cursor-crosshair select-none bg-neutral-900"
      >
        {/* === GRID === */}
        <IsoGrid grid={grid} />

        {/* === POLÍGONOS EXISTENTES === */}
        {polygons.map((poly) => (
          <polygon
            key={poly.id}
            points={poly.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={poly.color}
            fillOpacity={poly.opacity}
            stroke={poly.color}
            strokeWidth={1}
          />
        ))}

        {/* === POLÍGONO EM CONSTRUÇÃO === */}
        {polygonMode && activePolygon && activePolygon.points.length > 1 && (
          <polygon
            points={activePolygon.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={fillColor}
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}
        {/* === PONTOS === */}
        {points.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={5} fill={p.color} />
            <text
              x={p.x + 10}
              y={p.y - 10}
              fill={p.color}
              fontSize="12"
              fontFamily="monospace"
            >
              {p.label} ({Math.round(p.x)}, {Math.round(p.y)})
            </text>
          </g>
        ))}

        {/* === ELIPSES === */}
        {ellipses.map((e, i) => (
          <g key={i}>
            <ellipse
              cx={e.center.x}
              cy={e.center.y}
              rx={e.rx}
              ry={e.ry}
              stroke={e.color}
              strokeWidth={e.strokeWidth}
              strokeDasharray={e.dashed ? "6,6" : ""}
              fill="none"
            />
            <text
              x={e.center.x + e.rx + 10}
              y={e.center.y}
              fill={e.color}
              fontSize="12"
              fontFamily="monospace"
            >
              Elipse ({Math.round(e.center.x)}, {Math.round(e.center.y)})
            </text>
          </g>
        ))}

        {/* === ELIPSE EM PRÉVIA === */}
        {previewEllipse && (
          <ellipse
            cx={previewEllipse.center.x}
            cy={previewEllipse.center.y}
            rx={previewEllipse.rx}
            ry={previewEllipse.ry}
            stroke="yellow"
            strokeWidth={2}
            strokeDasharray="4 2"
            fill="none"
          />
        )}

        {/* === PATHS === */}
        <IsoPaths
          paths={paths.map((p) => {
            // 🔸 MODO EXTENSÃO VISUAL
            if (extendMode) {
              // Linha sob o mouse = leve destaque (branco / ciano)
              if (p.id === hoveredId && p.id !== selectedId) {
                return {
                  ...p,
                  color: "#00FFFF", // ciano leve para highlight
                  strokeWidth: p.strokeWidth * 1.4,
                };
              }

              // Linha selecionada = destaque fixo (amarelo)
              if (p.id === selectedId) {
                return {
                  ...p,
                  color: "#d97a26", // amarelo ouro
                  strokeWidth: p.strokeWidth * 1.8,
                };
              }
            }

            // Linhas normais (fora do modo extensão)
            return p;
          })}
        />

        {/* Path ativo (sendo criado) */}
        {activePath && <IsoPaths paths={[activePath]} />}

        {/* === CÍRCULOS === */}
        {circles.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.center.x}
              cy={c.center.y}
              r={c.radius}
              stroke={c.color}
              strokeWidth={c.strokeWidth}
              strokeDasharray={c.dashed ? "5,5" : ""}
              fill="none"
            />
            <text
              x={c.center.x + c.radius + 10}
              y={c.center.y}
              fill={c.color}
              fontSize="12"
              fontFamily="monospace"
            >
              Círculo ({Math.round(c.center.x)}, {Math.round(c.center.y)})
            </text>
          </g>
        ))}

        {/* === CÍRCULO EM PRÉVIA === */}
        {previewCircle && (
          <circle
            cx={previewCircle.center.x}
            cy={previewCircle.center.y}
            r={previewCircle.radius}
            stroke="yellow"
            strokeWidth={2}
            strokeDasharray="4 2"
            fill="none"
          />
        )}

        {/* === PRÉVIA DE EXTENSÃO === */}
        {previewLine && (
          <line
            x1={previewLine.A.x}
            y1={previewLine.A.y}
            x2={previewLine.B.x}
            y2={previewLine.B.y}
            stroke="yellow"
            strokeWidth={2}
            strokeDasharray="4 2"
            opacity={0.8}
          />
        )}
        
      </svg>
    </div>
  );
}
