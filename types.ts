// =============================
// 📘 Tipos Globais do Projeto
// =============================

// 🔹 Ponto 2D com rótulo opcional
export type Pt = {
  x: number;
  y: number;
  label?: string; // ex: "A", "B", "C"
};

// 🔹 Linha (duas extremidades)
export type Line = {
  A: Pt;
  B: Pt;
};

// 🔹 Caminho (Path) — usado para desenhar shapes
export type Path = {
  id: string; // ✅ UUID único
  points: Pt[];
  color: string;
  strokeWidth: number;
  dashed: boolean;
};

// 🔹 Tipos auxiliares para grid ou geometrias futuras
export type IsoGridLine = Line; // alias semântico

// 🔹 Tipo para seleção de objetos no canvas
export type Selection = {
  id: string;          // ID do path selecionado
  type: "path" | "point" | "line"; // tipo de seleção
  pointIndex?: number; // usado se type === "point"
};