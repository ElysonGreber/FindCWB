import React from "react";

type Point = { x: number; y: number };

interface PolygonProps {
  points: Point[];
  className?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
}

/**
 * Componente SVG para desenhar polígonos a partir de N pontos.
 * Fecha automaticamente o caminho.
 */
export function Polygon({
  points,
  className = "stroke-black",
  strokeWidth = 1,
  strokeDasharray,
  fill = "transparent",
}: PolygonProps) {
  if (!points || points.length < 3) return null;

  // Converte a lista de pontos em string: "x1,y1 x2,y2 x3,y3 ..."
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <polygon
      points={pointsAttr}
      className={className}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      fill={fill}
    />
  );
}