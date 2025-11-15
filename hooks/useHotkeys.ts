import { useEffect } from "react";

export function useHotkeys({
  colors,
  setSelectedColor,
  finalizePath,
  undoLastPath,
  toggleDashed,
}: {
  colors: string[];
  setSelectedColor: (c: string) => void;
  finalizePath: () => void;
  undoLastPath: () => void;
  toggleDashed: () => void;
}) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4"].includes(e.key)) {
        setSelectedColor(colors[parseInt(e.key, 10) - 1]);
      }
      if (e.key === "Enter") finalizePath();
      if (e.key.toLowerCase() === "z" && e.ctrlKey) undoLastPath();
      if (e.key.toLowerCase() === "d") toggleDashed();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [colors, setSelectedColor, finalizePath, undoLastPath, toggleDashed]);
}
