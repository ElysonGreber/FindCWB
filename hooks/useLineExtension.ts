// 📁 src/hooks/useLineExtension.ts
import { useState, useMemo } from "react";
import type { Pt, Path } from "@/types";

/**
 * Hook de extensão de linha (modo CAD):
 * 1️⃣ Clicar em uma linha
 * 2️⃣ Escolher uma extremidade
 * 3️⃣ Clicar em outra linha → extensão automática
 */
export function useLineExtension(
  paths: Path[],
  setPaths: React.Dispatch<React.SetStateAction<Path[]>>
) {
  const [extendMode, setExtendMode] = useState(false);
  const [extendStart, setExtendStart] = useState<{ pathId: string; point: Pt } | null>(null);
  const [previewLine, setPreviewLine] = useState<{ A: Pt; B: Pt } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<1 | 2 | 3 | null>(null);

  // ========= Interseção entre duas linhas =========
  const getIntersection = (A1: Pt, B1: Pt, A2: Pt, B2: Pt): Pt | null => {
    const d = (A1.x - B1.x) * (A2.y - B2.y) - (A1.y - B1.y) * (A2.x - B2.x);
    if (Math.abs(d) < 1e-6) return null;
    const x =
      ((A1.x * B1.y - A1.y * B1.x) * (A2.x - B2.x) -
        (A1.x - B1.x) * (A2.x * B2.y - A2.y * B2.x)) /
      d;
    const y =
      ((A1.x * B1.y - A1.y * B1.x) * (A2.y - B2.y) -
        (A1.y - B1.y) * (A2.x * B2.y - A2.y * B2.x)) /
      d;
    return { x, y };
  };

  // ========= Distância ponto → linha =========
  const distancePointToLine = (pt: Pt, A: Pt, B: Pt): number => {
    const num = Math.abs((B.y - A.y) * pt.x - (B.x - A.x) * pt.y + B.x * A.y - B.y * A.x);
    const den = Math.hypot(B.y - A.y, B.x - A.x);
    return num / den;
  };

  // ========= Clique no modo extensão =========
  const handleExtendClick = (clickedPt: Pt) => {
    if (!extendMode) return;

    // 1️⃣ Selecionar linha
    if (!selectedId) {
      const hitPath = paths.find(
        (p) =>
          p.points.length > 1 &&
          distancePointToLine(clickedPt, p.points[0], p.points.at(-1)!) < 8
      );
      if (!hitPath) return;
      setSelectedId(hitPath.id);
      setPhase(2);
      return;
    }

    // 2️⃣ Escolher extremidade da linha selecionada
    if (selectedId && !extendStart) {
      const path = paths.find((p) => p.id === selectedId);
      if (!path) return;

      const startPoint =
        Math.hypot(clickedPt.x - path.points[0].x, clickedPt.y - path.points[0].y) <
        Math.hypot(clickedPt.x - path.points.at(-1)!.x, clickedPt.y - path.points.at(-1)!.y)
          ? path.points[0]
          : path.points.at(-1)!;

      setExtendStart({ pathId: path.id, point: startPoint });
      setPhase(3);
      return;
    }

    // 3️⃣ Escolher segunda linha para estender
    if (extendStart) {
      const targetPath = paths.find(
        (p) =>
          p.id !== extendStart.pathId &&
          p.points.length > 1 &&
          distancePointToLine(clickedPt, p.points[0], p.points.at(-1)!) < 8
      );
      if (!targetPath) return;

      const sourcePath = paths.find((p) => p.id === extendStart.pathId);
      if (!sourcePath) return;

      const A1 = sourcePath.points[0];
      const B1 = sourcePath.points.at(-1)!;
      const A2 = targetPath.points[0];
      const B2 = targetPath.points.at(-1)!;
      const inter = getIntersection(A1, B1, A2, B2);
      if (!inter) {
        console.warn("Sem interseção detectada");
        reset();
        return;
      }

      // Atualiza o path original
      const updated = paths.map((p) => {
        if (p.id === extendStart.pathId) {
          const distA = Math.hypot(
            extendStart.point.x - p.points[0].x,
            extendStart.point.y - p.points[0].y
          );
          const distB = Math.hypot(
            extendStart.point.x - p.points.at(-1)!.x,
            extendStart.point.y - p.points.at(-1)!.y
          );
          if (distA < distB) {
            return { ...p, points: [inter, ...p.points.slice(1)] };
          } else {
            return { ...p, points: [...p.points.slice(0, -1), inter] };
          }
        }
        return p;
      });

      setPaths(updated);
      reset();
    }
  };

  // ========= Hover → preview e highlight =========
  const handleHover = (hoverPt: Pt) => {
    if (!extendMode || !extendStart) return;

    const sourcePath = paths.find((p) => p.id === extendStart.pathId);
    if (!sourcePath) return;

    const A1 = sourcePath.points[0];
    const B1 = sourcePath.points.at(-1)!;

    const hovered = paths.find(
      (p) =>
        p.id !== extendStart.pathId &&
        p.points.length > 1 &&
        distancePointToLine(hoverPt, p.points[0], p.points.at(-1)!) < 8
    );

    if (!hovered) {
      setHoveredId(null);
      setPreviewLine(null);
      return;
    }

    setHoveredId(hovered.id);
    const A2 = hovered.points[0];
    const B2 = hovered.points.at(-1)!;
    const inter = getIntersection(A1, B1, A2, B2);

    setPreviewLine(inter ? { A: extendStart.point, B: inter } : null);
  };

  // ========= Reset =========
  const reset = () => {
    setExtendStart(null);
    setPreviewLine(null);
    setHoveredId(null);
    setSelectedId(null);
    setPhase(null);
    setExtendMode(false);
  };

  // ========= Mensagem automática da fase =========
  const phaseMessage = useMemo(() => {
    if (!extendMode) return null;
    switch (phase) {
      case null:
      case 1:
        return "Clique em uma linha para iniciar a extensão";
      case 2:
        return "Selecione uma extremidade (aresta) da linha";
      case 3:
        return "Clique em outra linha para finalizar a extensão";
      default:
        return null;
    }
  }, [extendMode, phase]);

  return {
    extendMode,
    setExtendMode,
    handleExtendClick,
    handleHover,
    extendStart,
    previewLine,
    hoveredId,
    selectedId,
    phaseMessage,
  };
}
