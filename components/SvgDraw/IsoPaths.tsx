//components/SvgDraw/IsoPaths.tsx
import type { Path } from "@/types";

export interface IsoPathsProps {
  paths: Path[];
  hoveredId?: string | null;
  selectedId?: string | null;
}

/**
 * Renderiza paths com destaque visual (hover/seleção) e coordenadas
 * - Linhas selecionadas brilham com drop-shadow
 * - Linhas em hover ficam em azul claro
 */
export function IsoPaths({ paths, hoveredId, selectedId }: IsoPathsProps) {
  return (
    <>
      {paths.map((p, idx) => {
        const isHovered = p.id === hoveredId;
        const isSelected = p.id === selectedId;

        // Cor e espessura adaptadas
        const strokeColor = isSelected
          ? "#00ffff" // Ciano brilhante para seleção
          : isHovered
          ? "#00aaff" // Azul claro para hover
          : p.color;

        const strokeWidth = isSelected
          ? p.strokeWidth + 2
          : isHovered
          ? p.strokeWidth + 1.5
          : p.strokeWidth;

        const filter = isSelected ? "url(#glowEffect)" : "none";

        return (
          <g key={`path-${p.id}-${idx}`} style={{ pointerEvents: "visibleStroke" }}>
            {/* Linha principal */}
            <polyline
              points={p.points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={p.dashed ? "6 6" : undefined}
              opacity={isHovered || isSelected ? 0.95 : 1}
              filter={filter}
              cursor="pointer"
            />

            {/* Pontos e coordenadas */}
            {p.points.map((pt, i) => (
              <g key={`pt-${p.id}-${idx}-${i}`}>
                <circle cx={pt.x} cy={pt.y} r={4} fill={p.color} />
                <text
                  x={pt.x + 10}
                  y={pt.y - 10}
                  fill={p.color}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {pt.label} ({Math.round(pt.x)}, {Math.round(pt.y)})
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {/* 🔹 Filtro SVG global para efeito de brilho */}
      <defs>
        <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00ffff" floodOpacity="1" />
        </filter>
      </defs>
    </>
  );
}
