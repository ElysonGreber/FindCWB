import { useState, useRef } from "react";
import type { Pt } from "@/types";

export function useSelectionManager(
  paths: any[],
  setPaths: React.Dispatch<React.SetStateAction<any[]>>,
  circles: any[],
  setCircles: React.Dispatch<React.SetStateAction<any[]>>,
  ellipses: any[],
  setEllipses: React.Dispatch<React.SetStateAction<any[]>>,
  polygons: any[],
  setPolygons: React.Dispatch<React.SetStateAction<any[]>>,
  points: any[],
  setPoints: React.Dispatch<React.SetStateAction<any[]>>
) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const startPt = useRef<Pt | null>(null);

  // ✅ Condições de tipos selecionáveis
  const [allowedTypes, setAllowedTypes] = useState({
    lines: true,
    polygons: true,
    circles: true,
    ellipses: true,
    points: true,
  });

  /** 🔍 Detecta se o clique foi em um elemento */
  function detectClickedElement(p: Pt): string | null {
    if (allowedTypes.lines || allowedTypes.polygons) {
      for (const group of [paths, polygons]) {
        for (const shape of group) {
          for (let i = 0; i < shape.points.length - 1; i++) {
            const A = shape.points[i];
            const B = shape.points[i + 1];
            const dist =
              Math.abs((B.y - A.y) * p.x - (B.x - A.x) * p.y + B.x * A.y - B.y * A.x) /
              Math.hypot(B.y - A.y, B.x - A.x);
            if (dist < 8) return shape.id;
          }
        }
      }
    }

    if (allowedTypes.circles) {
      for (const c of circles) {
        const d = Math.hypot(p.x - c.center.x, p.y - c.center.y);
        if (Math.abs(d - c.radius) < 8) return c.id;
      }
    }

    if (allowedTypes.ellipses) {
      for (const e of ellipses) {
        const dx = (p.x - e.center.x) / e.rx;
        const dy = (p.y - e.center.y) / e.ry;
        if (Math.abs(dx * dx + dy * dy - 1) < 0.08) return e.id;
      }
    }

    if (allowedTypes.points) {
      for (const pt of points) {
        const d = Math.hypot(p.x - pt.x, p.y - pt.y);
        if (d < 10) return pt.id;
      }
    }

    return null;
  }

  /** 🧭 Alterna seleção */
  function toggleSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /** 🧹 Exclui os elementos selecionados */
  function deleteSelected() {
    if (selectedIds.length === 0) return;

    setPaths((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    setCircles((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setEllipses((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
    setPolygons((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    setPoints((prev) => prev.filter((p) => !selectedIds.includes(p.id)));

    setSelectedIds([]);
  }

  /** 🟩 Inicia o arrasto do retângulo de seleção */
  function startSelectionBox(pt: Pt) {
    if (!selectionMode) return;
    startPt.current = pt;
    setSelectionRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
  }

  /** ✏️ Atualiza o retângulo durante o arrasto */
  function updateSelectionBox(pt: Pt) {
    if (!startPt.current) return;
    const x = Math.min(startPt.current.x, pt.x);
    const y = Math.min(startPt.current.y, pt.y);
    const w = Math.abs(startPt.current.x - pt.x);
    const h = Math.abs(startPt.current.y - pt.y);
    setSelectionRect({ x, y, w, h });
  }

  /** ✅ Finaliza a seleção por área */
  function finalizeSelectionBox() {
    if (!selectionRect) return;

    const selected: string[] = [];

    const insideRect = (x: number, y: number) =>
      x >= selectionRect.x &&
      x <= selectionRect.x + selectionRect.w &&
      y >= selectionRect.y &&
      y <= selectionRect.y + selectionRect.h;

    if (allowedTypes.lines || allowedTypes.polygons) {
      for (const group of [paths, polygons]) {
        for (const shape of group) {
          if (shape.points.some((p: Pt) => insideRect(p.x, p.y))) {
            selected.push(shape.id);
          }
        }
      }
    }

    if (allowedTypes.circles) {
      for (const c of circles) {
        const cx = c.center.x,
          cy = c.center.y;
        if (insideRect(cx, cy)) selected.push(c.id);
      }
    }

    if (allowedTypes.ellipses) {
      for (const e of ellipses) {
        const cx = e.center.x,
          cy = e.center.y;
        if (insideRect(cx, cy)) selected.push(e.id);
      }
    }

    if (allowedTypes.points) {
      for (const p of points) {
        if (insideRect(p.x, p.y)) selected.push(p.id);
      }
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...selected])));
    setSelectionRect(null);
    startPt.current = null;
  }

  return {
    selectionMode,
    setSelectionMode,
    selectedIds,
    toggleSelection,
    detectClickedElement,
    deleteSelected,
    selectionRect,
    startSelectionBox,
    updateSelectionBox,
    finalizeSelectionBox,
    allowedTypes,
    setAllowedTypes,
  };
}
