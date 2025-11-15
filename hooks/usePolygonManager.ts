import { useState } from "react";
import type { Pt } from "@/types";

export type Polygon = {
  id: string;
  points: Pt[];
  color: string;
  opacity: number;
};

export function usePolygonManager() {
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [activePolygon, setActivePolygon] = useState<Polygon | null>(null);
  const [polygonMode, setPolygonMode] = useState(false);
  const [fillColor, setFillColor] = useState("rgba(0, 255, 255, 0.4)");
  const [fillOpacity, setFillOpacity] = useState(0.4);

  // === Adiciona ponto ===
  const addPolygonPoint = (pt: Pt) => {
    if (!polygonMode) return;

    setActivePolygon((prev) => {
      if (!prev) {
        const newPoly: Polygon = {
          id: crypto.randomUUID(),
          points: [pt],
          color: fillColor,
          opacity: fillOpacity,
        };
        return newPoly;
      } else {
        return { ...prev, points: [...prev.points, pt] };
      }
    });
  };

  // === Finaliza o polígono (Enter) ===
  const finalizePolygon = () => {
    if (activePolygon && activePolygon.points.length > 2) {
      setPolygons((prev) => [...prev, activePolygon]);
      setActivePolygon(null);
    }
  };

  // === Limpar tudo ===
  const clearPolygons = () => {
    setPolygons([]);
    setActivePolygon(null);
  };

  return {
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
  };
}
