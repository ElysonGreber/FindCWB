import { useState } from "react";

export function usePathsManager() {
  const [paths, setPaths] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [activePath, setActivePath] = useState<any | null>(null);
  const [color, setColor] = useState("cyan");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dashed, setDashed] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  // Histórico global (novo)
  const [history, setHistory] = useState<{ type: "path" | "line" | "circle"; id: number }[]>([]);

  const colors = ["cyan", "orange", "magenta", "lime"];

  // === Gerador de rótulos (A, B, C...) ===
  function getNextLabel(index: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (index < 26) return alphabet[index];
    const first = Math.floor(index / 26) - 1;
    const second = index % 26;
    return alphabet[first] + alphabet[second];
  }

  // === Finalizar Path ===
  function finalizePath() {
    if (activePath && activePath.points.length > 1) {
      const newPath = { ...activePath, id: Date.now() };
      setPaths((p) => [...p, newPath]);
      setHistory((h) => [...h, { type: "path", id: newPath.id }]);
      setActivePath(null);
    }
  }

  // === Adicionar Linha ===
  function addLine(line: any) {
    const newLine = { ...line, id: Date.now() };
    setLines((l) => [...l, newLine]);
    setHistory((h) => [...h, { type: "line", id: newLine.id }]);
  }

  // === Adicionar Círculo ===
  function addCircle(circle: any) {
    const newCircle = { ...circle, id: Date.now() };
    setCircles((c) => [...c, newCircle]);
    setHistory((h) => [...h, { type: "circle", id: newCircle.id }]);
  }

  // === Desfazer última ação (global) ===
  function undoLast() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));

    switch (last.type) {
      case "path":
        setPaths((p) => p.filter((path) => path.id !== last.id));
        break;
      case "line":
        setLines((l) => l.filter((line) => line.id !== last.id));
        break;
      case "circle":
        setCircles((c) => c.filter((circle) => circle.id !== last.id));
        break;
    }
  }

  // === Limpar tudo ===
  function clear() {
    setPaths([]);
    setLines([]);
    setCircles([]);
    setActivePath(null);
    setPointCount(0);
    setHistory([]);
  }

  return {
    // === Objetos ===
    paths,
    setPaths,
    lines,
    setLines,
    circles,
    setCircles,

    // === Path ativo ===
    activePath,
    setActivePath,

    // === Aparência ===
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    dashed,
    setDashed,
    colors,

    // === Controle ===
    pointCount,
    setPointCount,
    finalizePath,
    addLine,
    addCircle,
    undoLast,
    clear,
    getNextLabel,
  };
}
