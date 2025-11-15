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

  // === POLÍGONOS ===
  const {
    polygonMode,
    setPolygonMode,
    polygons,
    activePolygon,
    fillColor,
    setFillColor,
    fillOpacity,
    setFillOpacity,
    addPolygonPoint,
    finalizePolygon,
    clearPolygons,
  } = usePolygonManager();

  // === PATHS (LINHAS) ===
  const {
    paths,
    setPaths,
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
  } = usePathsManager();

  // === MODO LINHA E POLÍGONO ===
  const [lineMode, setLineMode] = useState(true);
  const [polygonInProgress, setPolygonInProgress] = useState(false);

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
    const data = JSON.stringify(paths, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "isometric_paths.json";
    a.click();
  };

  const exportSVG = () => {
    const pathElements = paths
      .map((p) => {
        const d = p.points.map((pt: { x: any; y: any }) => `${pt.x},${pt.y}`).join(" ");
        const dash = p.dashed ? `stroke-dasharray="6 6"` : "";
        return `<polyline points="${d}" fill="none" stroke="${p.color}" stroke-width="${p.strokeWidth}" ${dash}/>`;
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

  // === HOTKEYS ===
  useHotkeys({
    colors,
    setSelectedColor: setColor,
    finalizePath,
    undoLastPath: undoLast,
    toggleDashed: () => setDashed((d) => !d),
  });

  // === FUNÇÕES AUXILIARES ===
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

  // === CLICK ===
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const raw = toSvgCoords(e);

    // 🔷 MODO POLÍGONO
    if (polygonMode) {
      const nearest = getClosestIntersection(raw);
      if (!nearest) return;
      setPolygonInProgress(true);
      addPolygonPoint(nearest);
      return;
    }

    // 🔶 MODO EXTENSÃO
    if (extendMode) {
      handleExtendClick(raw);
      return;
    }

    // 🔹 MODO LINHA NORMAL
    const nearest = getClosestIntersection(raw);
    if (!nearest) return;

    const label = getNextLabel(pointCount);
    setPointCount((prev) => prev + 1);
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
          setPaths((prevPaths) => [...prevPaths, updated]);
          return null;
        }
        return updated;
      }
    });
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
        onFinalize={finalizePath}
        onUndo={undoLast}
        onClear={clear}
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
      />

      {/* === BOTÃO DE EXTENSÃO === */}
      <button
        onClick={() => setExtendMode((p) => !p)}
        className={`mt-2 px-4 py-2 rounded ${
          extendMode ? "bg-amber-600" : "bg-gray-700"
        } text-white`}
      >
        {extendMode ? "Modo Extensão Ativo" : "Ativar Modo Extensão"}
      </button>

      {extendMode && (
        <div className="fixed bottom-6 right-6 bg-amber-700 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-sm">
          {phaseMessage}
        </div>
      )}

      {/* === SVG === */}
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onClick={handleClick}
        onMouseMove={(e) => handleHover(toSvgCoords(e))}
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

        {/* === POLÍGONO EM CRIAÇÃO === */}
        {activePolygon && activePolygon.points.length > 1 && (
          <polygon
            points={activePolygon.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={fillColor}
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}

        {/* === PATHS EXISTENTES === */}
        <IsoPaths paths={paths} hoveredId={hoveredId} selectedId={selectedId} />

        {/* === PATH ATIVO === */}
        {activePath && <IsoPaths paths={[activePath]} />}

        {/* === PRÉVIA DA EXTENSÃO === */}
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

        {/* === PONTO INICIAL DA EXTENSÃO === */}
        {extendStart && (
          <circle
            cx={extendStart.point.x}
            cy={extendStart.point.y}
            r={6}
            fill="yellow"
            stroke="white"
            strokeWidth={1}
          />
        )}
      </svg>
    </div>
  );
}
