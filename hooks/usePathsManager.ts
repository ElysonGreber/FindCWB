import { useState } from "react";

export function usePathsManager() {
  const [paths, setPaths] = useState<any[]>([]);
  const [activePath, setActivePath] = useState<any | null>(null);
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

  function finalizePath() {
    if (activePath && activePath.points.length > 1) {
      setPaths((p) => [...p, activePath]);
      setActivePath(null);
    }
  }

  function undoLast() {
    setPaths((p) => p.slice(0, -1));
  }

  function clear() {
    setPaths([]);
    setActivePath(null);
    setPointCount(0);
  }

  return {
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
  };
}
