import { useState } from "react";

export function usePathsManager() {
  const [paths, setPaths] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [ellipses, setEllipses] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [activePath, setActivePath] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [color, setColor] = useState("cyan");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dashed, setDashed] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  const colors = ["cyan", "orange", "magenta", "lime"];

  function getNextLabel(index: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (index < 26) return alphabet[index];
    const first = Math.floor(index / 26) - 1;
    const second = index % 26;
    return alphabet[first] + alphabet[second];
  }

  // === PATH ===
  function addPath(newPath: any) {
    setPaths((prev) => [...prev, newPath]);
    setHistory((prev) => [...prev, { type: "path" }]);
  }

  function finalizePath() {
    if (activePath && activePath.points.length > 1) {
      const newPath = { ...activePath, id: crypto.randomUUID() };
      addPath(newPath);
      setActivePath(null);
    }
  }

  // === CÍRCULO ===
  function addCircle(c: any) {
    const newCircle = { ...c, id: crypto.randomUUID() };
    setCircles((prev) => [...prev, newCircle]);
    setHistory((prev) => [...prev, { type: "circle" }]);
  }

  // === ELIPSE ===
  function addEllipse(e: any) {
    const newEllipse = { ...e, id: crypto.randomUUID() };
    setEllipses((prev) => [...prev, newEllipse]);
    setHistory((prev) => [...prev, { type: "ellipse" }]);
  }

  // === PONTO ===
  function addPoint(p: any) {
    const newPoint = { ...p, id: crypto.randomUUID() };
    setPoints((prev) => [...prev, newPoint]);
    setHistory((prev) => [...prev, { type: "point" }]);
  }

  // === POLÍGONO ===
  function registerPolygon() {
    setHistory((prev) => [...prev, { type: "polygon" }]);
  }

  // === DESFAZER ===
  function undoLast(external?: {
    polygons?: any[];
    setPolygons?: React.Dispatch<React.SetStateAction<any[]>>;
  }) {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = prev.slice(0, -1);

      switch (last.type) {
        case "path":
          setPaths((p) => p.slice(0, -1));
          break;
        case "circle":
          setCircles((c) => c.slice(0, -1));
          break;
        case "ellipse":
          setEllipses((e) => e.slice(0, -1));
          break;
        case "point":
          setPoints((p) => p.slice(0, -1));
          break;
        case "polygon":
          if (external?.setPolygons) external.setPolygons((p) => p.slice(0, -1));
          break;
      }

      return updated;
    });
  }

  // === LIMPAR ===
  function clear(external?: { setPolygons?: React.Dispatch<React.SetStateAction<any[]>> }) {
    setPaths([]);
    setCircles([]);
    setEllipses([]);
    setPoints([]);
    setActivePath(null);
    setHistory([]);
    setPointCount(0);
    if (external?.setPolygons) external.setPolygons([]);
  }

  return {
    paths,
    setPaths,
    setCircles,
    setPoints,
    setEllipses,
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
  };
}
