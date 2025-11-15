import { useState } from "react";

export function usePathsManager() {
  const [paths, setPaths] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [activePath, setActivePath] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [color, setColor] = useState("cyan");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dashed, setDashed] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  const colors = ["cyan", "orange", "magenta", "lime"];

  /** Gera rótulos automáticos (A, B, C...) */
  function getNextLabel(index: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (index < 26) return alphabet[index];
    const first = Math.floor(index / 26) - 1;
    const second = index % 26;
    return alphabet[first] + alphabet[second];
  }

  /** Finaliza um path ativo */
  function finalizePath() {
    if (activePath && activePath.points.length > 1) {
      const newPath = { ...activePath, id: crypto.randomUUID() };
      setPaths((prev) => [...prev, newPath]);
      setHistory((prev) => [...prev, { type: "path" }]);
      setActivePath(null);
    }
  }

  /** Adiciona um círculo */
  function addCircle(c: any) {
    const newCircle = { ...c, id: crypto.randomUUID() };
    setCircles((prev) => [...prev, newCircle]);
    setHistory((prev) => [...prev, { type: "circle" }]);
  }

  /**
   * 🔁 Desfaz última ação
   * Pode receber um `external` com os setters e arrays dos polígonos
   * vindos do usePolygonManager
   */
  function undoLast(external?: {
    polygons?: any[];
    setPolygons?: React.Dispatch<React.SetStateAction<any[]>>;
  }) {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = prev.slice(0, -1);

      if (last.type === "path") setPaths((p) => p.slice(0, -1));
      if (last.type === "circle") setCircles((c) => c.slice(0, -1));

      // ✅ Integrado com usePolygonManager
      if (last.type === "polygon" && external?.setPolygons) {
        external.setPolygons((p) => p.slice(0, -1));
      }

      return updated;
    });
  }

  /** Limpa tudo */
  function clear(external?: { setPolygons?: React.Dispatch<React.SetStateAction<any[]>> }) {
    setPaths([]);
    setCircles([]);
    setActivePath(null);
    setHistory([]);
    setPointCount(0);

    // limpa polígonos externos
    if (external?.setPolygons) external.setPolygons([]);
  }

  return {
    paths,
    setPaths,
    activePath,
    setActivePath,
    circles,
    addCircle,
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
  };
}
