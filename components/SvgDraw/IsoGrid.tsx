type Line = { A: { x: number; y: number }; B: { x: number; y: number } };

export function IsoGrid({ grid }: { grid: Line[] }) {
  return (
    <>
      {grid.map((ln, i) => (
        <line
          key={i}
          x1={ln.A.x}
          y1={ln.A.y}
          x2={ln.B.x}
          y2={ln.B.y}
          stroke="#333"
          strokeWidth={0.4}
        />
      ))}
    </>
  );
}
