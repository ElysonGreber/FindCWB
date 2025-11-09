"use client";

import { useRef, useState, useCallback } from "react";

export default function SvgLines() {
  const W = 1300;
  const H = 500;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const A = { x: 100, y: 250 };
  const B = { x: 1000, y: 250 };
  const [C1, setC1] = useState<{ x: number; y: number }>({ x: 400, y: 300 });
  const H1 = { x: C1.x, y: 100 };

  // proporção entre os pontos (0 = início, 1 = fim)
  const t = 0.5; // meio exato

  // pontos intermediários
  const C2 = { x: A.x + t * (C1.x - A.x), y: A.y + t * (C1.y - A.y) };
  const H2 = { x: A.x + t * (H1.x - A.x), y: A.y + t * (H1.y - A.y) };
  const C3 = { x: C1.x + t * (B.x - C1.x), y: C1.y + t * (B.y - C1.y) };
  const H3 = { x: H1.x + t * (B.x - H1.x), y: H1.y + t * (B.y - H1.y) };

  // ======================================================
  // ADIÇÃO: cálculos dos pontos de interseção
  // ======================================================
  function getIntersection(p1: any, p2: any, p3: any, p4: any) {
    const denom =
      (p1.x - p2.x) * (p3.y - p4.y) -
      (p1.y - p2.y) * (p3.x - p4.x);
    if (denom === 0) return null;
    const x =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
        (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) /
      denom;
    const y =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
        (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) /
      denom;
    return { x, y };
  }

  const C4 = getIntersection(C2, B, A, C3); // interseção entre C2–B e A–C3
  const H4 = getIntersection(H2, B, A, H3); // interseção entre H2–B e A–H3
  // ======================================================

  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x: Math.max(0, Math.min(W, x)), y: Math.max(0, Math.min(H, y)) };
  }, []);

  const radius = 10;

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number, clientY: number;
    if ("touches" in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else return;
    const p = toSvgPoint(clientX, clientY);
    const dist = Math.hypot(p.x - C1.x, p.y - C1.y);
    if (dist <= radius + 2) setDragging(true);
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    let clientX: number, clientY: number;
    if ("touches" in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else return;
    const p = toSvgPoint(clientX, clientY);
    setC1({ x: p.x, y: p.y });
  };

  const endDrag = () => setDragging(false);
  const fmt = (x: number, y: number) => `(${Math.round(x)}, ${Math.round(y)})`;

  return (
    <div
      style={{
        width: `${W}px`,
        height: `${H}px`,
        border: "1px solid #333",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={endDrag}
        style={{ display: "block" }}
      >
        {/* linha horizontal central */}
        {/* ************************ */}
        <line
          x1={0}
          y1={H / 2}
          x2={W}
          y2={H / 2}
          stroke="#fff"
          strokeWidth={2}
        />

        {/* Conexões principais */}
        <line x1={A.x} y1={A.y} x2={C1.x} y2={C1.y} stroke="#ff3333" strokeWidth={2} strokeDasharray="6 6" />
        <line x1={C1.x} y1={C1.y} x2={B.x} y2={B.y} stroke="#5a78e2" strokeWidth={2} strokeDasharray="6 6" />
        <line x1={B.x} y1={B.y} x2={H1.x} y2={H1.y} stroke="#5a78e2" strokeWidth={2} strokeDasharray="6 6" />
        <line x1={H1.x} y1={H1.y} x2={A.x} y2={A.y} stroke="#ff3333" strokeWidth={2} strokeDasharray="6 6" />

        {/* Linha C2–H2 */}
        <line x1={C2.x} y1={C2.y} x2={H2.x} y2={H2.y} stroke="#9dd926" strokeWidth={2} strokeDasharray="6 6" />

        {/* Linhas C2–B e H2–B */}
        <line x1={C2.x} y1={C2.y} x2={B.x} y2={B.y} stroke="#5a78e2" strokeWidth={2} strokeDasharray="6 6" />
        <line x1={H2.x} y1={H2.y} x2={B.x} y2={B.y} stroke="#5a78e2" strokeWidth={2} strokeDasharray="6 6" />

        {/* Linhas C3 e H3 */}
        <line x1={C3.x} y1={C3.y} x2={H3.x} y2={H3.y} stroke="#9dd926" strokeWidth={2} strokeDasharray="6 6" />
        {/* Linhas A e C3 */}
        <line x1={A.x} y1={A.y} x2={C3.x} y2={C3.y} stroke="#ff3333" strokeWidth={2} strokeDasharray="6 6" />
        {/* Linhas A e H3 */}
        <line x1={A.x} y1={A.y} x2={H3.x} y2={H3.y} stroke="#ff3333" strokeWidth={2} strokeDasharray="6 6" />

        {/* ======================================================
            ADIÇÃO: linha entre C4 e H4
        ======================================================= */}
        {C4 && H4 && (
          <line
            x1={C4.x}
            y1={C4.y}
            x2={H4.x}
            y2={H4.y}
            stroke="#9dd926"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        )}
        {/* ====================================================== */}

        {/* ======================================================
            ADIÇÃO: pontos de interseção
        ======================================================= */}
        {C4 && (
          <>
            <circle cx={C4.x} cy={C4.y} r={6} fill="#ff00ff" />
            <text x={C4.x + 10} y={C4.y - 30} fill="#ff00ff" fontSize="13px">
              {"C4"}
            </text>
            <text x={C4.x + 10} y={C4.y - 15} fill="#ff00ff" fontSize="13px">
              {fmt(C4.x, C4.y)}
            </text>
          </>
        )}

        {H4 && (
          <>
            <circle cx={H4.x} cy={H4.y} r={6} fill="#ff00ff" />
            <text x={H4.x + 10} y={H4.y - 30} fill="#ff00ff" fontSize="13px">
              {"H4"}
            </text>
            <text x={H4.x + 10} y={H4.y - 15} fill="#ff00ff" fontSize="13px">
              {fmt(H4.x, H4.y)}
            </text>
          </>
        )}
        {/* ====================================================== */}

        {/* resto do seu código original, inalterado */}
        {/* Ponto intermediário entre C1 e B */}
        <circle cx={C3.x} cy={C3.y} r={6} fill="#00ffff" />
        <text x={C3.x + 12} y={C3.y + 35} fill="#00ffff" fontSize="13px">
          {fmt(C3.x, C3.y)}
        </text>
        <text x={C3.x + 12} y={C3.y + 20} fill="#00ffff" fontSize="13px">
          {"C3"}
        </text>

        {/* Ponto intermediário entre H1 e B */}
        <circle cx={H3.x} cy={H3.y} r={6} fill="#00ffff" />
        <text x={H3.x + 12} y={H3.y - 10} fill="#00ffff" fontSize="13px">
          {fmt(H3.x, H3.y)}
        </text>
        <text x={H3.x + 12} y={H3.y - 25} fill="#00ffff" fontSize="13px">
          {"H3"}
        </text>

        {/* H1–C1 pontilhada */}
        <line x1={H1.x} y1={H1.y} x2={C1.x} y2={C1.y} stroke="#9dd926" strokeWidth={2} strokeDasharray="6 6" />

        {/* ponto A texto e coordenada */}
        <circle cx={A.x} cy={A.y} r={5} fill="#ff3333" />
        <text x={A.x - 52} y={A.y - 10} fill="#aaa" fontSize="14px">
          {fmt(A.x, A.y)}
        </text>
        <text x={A.x - 52} y={A.y - 25} fill="#aaa" fontSize="14px">
          {"PF A"}
        </text>

        {/* ponto B texto e coordenada */}
        <circle cx={B.x} cy={B.y} r={5} fill="#5a78e2" />
        <text x={B.x + 12} y={B.y - 10} fill="#aaa" fontSize="14px">
          {fmt(B.x, B.y)}
        </text>
        <text x={B.x + 12} y={B.y - 25} fill="#aaa" fontSize="14px">
          {"PF B"}
        </text>

        {/* ponto C1 texto e coordenada */}
        <circle cx={C1.x} cy={C1.y} r={5} fill="#ff3333" />
        <text x={C1.x + 12} y={C1.y + 35} fill="#aaa" fontSize="14px">
          {fmt(C1.x, C1.y)}
        </text>
        <text x={C1.x + 12} y={C1.y + 15} fill="#aaa" fontSize="14px">
          {"C1"}
        </text>

        {/* ponto H1 texto e coordenada */}
        <circle cx={H1.x} cy={H1.y} r={5} fill="#ff3333" />
        <text x={H1.x + 12} y={H1.y - 25} fill="#aaa" fontSize="14px">
          {"H1"}
        </text>
        <text x={H1.x + 12} y={H1.y - 10} fill="#aaa" fontSize="14px">
          {fmt(H1.x, H1.y)}
        </text>

        {/* ponto C2 texto e coordenada */}
        <circle cx={C2.x} cy={C2.y} r={6} fill="#00ffff" />
        <text x={C2.x - 15} y={C2.y + 25} fill="#00ffff" fontSize="13px">
          {"C2"}
        </text>
        <text x={C2.x - 52} y={C2.y + 40} fill="#00ffff" fontSize="13px">
          {fmt(C2.x, C2.y)}
        </text>

        {/* ponto H2 texto e coordenada */}
        <circle cx={H2.x} cy={H2.y} r={6} fill="#00ffff" />
        <text x={H2.x - 52} y={H2.y - 10} fill="#00ffff" fontSize="13px">
          {fmt(H2.x, H2.y)}
        </text>
        <text x={H2.x - 15} y={H2.y - 25} fill="#00ffff" fontSize="13px">
          {"H2"}
        </text>
      </svg>
    </div>
  );
}
