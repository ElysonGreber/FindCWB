"use client";

import { useRef, useState, useCallback } from "react";

export default function SvgLines() {
  const W = 1500;
  const H = 1000;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);

  // alvo do drag
  const [dragTarget, setDragTarget] = useState<null | "A" | "B" | "C1" | "H1">(
    null
  );

  // estados móveis
  const [A, setA] = useState({ x: 100, y: 500 });
  const [B, setB] = useState({ x: 1400, y: 500 });
  const [horizonY, setHorizonY] = useState(500);

  const [C1, setC1] = useState<{ x: number; y: number }>({ x: 700, y: 780 });

  // ⬇️ NOVO: H1 tem y independente em estado; x SEMPRE = C1.x
  const [H1Y, setH1Y] = useState(200);
  const H1 = { x: C1.x, y: H1Y };

  // proporção entre os pontos (0 = início, 1 = fim)
  const t = 0.5;

  // Parametrizacao de atributos
  const rp = 3;
  const lpw = 1;
  const stkop = 0.5;
  const stkdsh = "5 10";

  // pontos intermediários
  const C2 = { x: A.x + t * (C1.x - A.x), y: A.y + t * (C1.y - A.y) };
  const H2 = { x: A.x + t * (H1.x - A.x), y: A.y + t * (H1.y - A.y) };
  const C3 = { x: C1.x + t * (B.x - C1.x), y: C1.y + t * (B.y - C1.y) };
  const H3 = { x: H1.x + t * (B.x - H1.x), y: H1.y + t * (B.y - H1.y) };
  const Hmid1 = { x: C1.x + t * (H1.x - C1.x), y: C1.y + t * (H1.y - C1.y) };
  const Cmid1 = { x: C2.x + t * (H2.x - C2.x), y: C2.y + t * (H2.y - C2.y) };
  // ======================================================
  // cálculos dos pontos de interseção
  // ======================================================
  function getIntersection(p1: any, p2: any, p3: any, p4: any) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
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
  function projMidB(p1: any, p2: any, p3: any, p4: any) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (denom === 0) return null;
    const x =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
        (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) /
      denom;
    const y =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
        (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) /
        denom +
      500;
    return { x, y };
  }
  function projMidT(p1: any, p2: any, p3: any, p4: any) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (denom === 0) return null;
    const x =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
        (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) /
      denom;
    const y =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
        (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) /
        denom -
      500;
    return { x, y };
  }
  const C4 = getIntersection(C2, B, A, C3);
  const H4 = getIntersection(H2, B, A, H3);
  const MidF1 = getIntersection(H1, C2, H2, C1);
  const MidF1Top = projMidT(H1, C2, H2, C1);
  const MidF1Bot = projMidB(H1, C2, H2, C1);
  const Ptop = getIntersection(H2, H1, MidF1Top, MidF1Bot);
  const PBot = getIntersection(C2, C1, MidF1Top, MidF1Bot);
  // ======================================================
//======================================================
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

    const distA = Math.hypot(p.x - A.x, p.y - A.y);
    const distB = Math.hypot(p.x - B.x, p.y - B.y);
    const distC1 = Math.hypot(p.x - C1.x, p.y - C1.y);
    const distH1 = Math.hypot(p.x - H1.x, p.y - H1.y);

    if (distA <= radius + 2) {
      setDragging(true);
      setDragTarget("A");
    } else if (distB <= radius + 2) {
      setDragging(true);
      setDragTarget("B");
    } else if (distC1 <= radius + 2) {
      setDragging(true);
      setDragTarget("C1");
    } else if (distH1 <= radius + 2) {
      setDragging(true);
      setDragTarget("H1");
    }
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging || !dragTarget) return;

    let clientX: number, clientY: number;
    if ("touches" in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else return;

    const p = toSvgPoint(clientX, clientY);

    if (dragTarget === "A") {
      // mantém sua lógica original
      setA({ x: p.x, y: horizonY });
      setHorizonY(p.y);
      setA({ x: p.x, y: p.y });
      setB((b) => ({ ...b, y: p.y }));
    } else if (dragTarget === "B") {
      // mantém sua lógica original
      setB({ x: p.x, y: horizonY });
      setHorizonY(p.y);
      setB({ x: p.x, y: p.y });
      setA((a) => ({ ...a, y: p.y }));
    } else if (dragTarget === "C1") {
      // C1 move livre em X e Y; H1.x acompanha automaticamente (derivado de C1.x)
      setC1({ x: p.x, y: p.y });
      // H1Y permanece independente (sem alteração aqui)
    } else if (dragTarget === "H1") {
      // H1 move em Y livremente e força C1.x = H1.x (mesmo X)
      setH1Y(p.y);
      setC1((c) => ({ x: p.x, y: c.y })); // sincroniza X
    }
  };

  const endDrag = () => {
    setDragging(false);
    setDragTarget(null);
  };

  const fmt = (x: number, y: number) => `(${Math.round(x)}, ${Math.round(y)})`;
  const shouldRenderPolygon = H4 && H4.y > A.y;
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
        <line
          x1={0}
          y1={horizonY}
          x2={W}
          y2={horizonY}
          stroke="#fff"
          strokeWidth={0.5}
        />

        {/* Conexões principais */}
        <line
          x1={A.x}
          y1={A.y}
          x2={C1.x}
          y2={C1.y}
          strokeOpacity={stkop}
          stroke="#ff3333"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />
        <line
          x1={C1.x}
          y1={C1.y}
          x2={B.x}
          y2={B.y}
          strokeOpacity={stkop}
          stroke="#5a78e2"
          strokeWidth={lpw}
          strokeDasharray="6 6"
        />
        <line
          x1={B.x}
          y1={B.y}
          x2={H1.x}
          y2={H1.y}
          strokeOpacity={stkop}
          stroke="#5a78e2"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />
        <line
          x1={H1.x}
          y1={H1.y}
          x2={A.x}
          y2={A.y}
          strokeOpacity={stkop}
          stroke="#ff3333"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />

        {/* Linha C2–H2 */}
        <line
          x1={C2.x}
          y1={C2.y}
          x2={H2.x}
          y2={H2.y}
          strokeOpacity={stkop}
          stroke="#9dd926"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />

        {/* Linhas C2–B e H2–B */}
        <line
          x1={C2.x}
          y1={C2.y}
          x2={B.x}
          y2={B.y}
          strokeOpacity={stkop}
          stroke="#5a78e2"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />
        <line
          x1={H2.x}
          y1={H2.y}
          x2={B.x}
          y2={B.y}
          strokeOpacity={stkop}
          stroke="#5a78e2"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />

        {/* Linhas C3 e H3 */}
        <line
          x1={C3.x}
          y1={C3.y}
          x2={H3.x}
          y2={H3.y}
          strokeOpacity={stkop}
          stroke="#9dd926"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />
        {/* Linhas A e C3 */}
        <line
          x1={A.x}
          y1={A.y}
          x2={C3.x}
          y2={C3.y}
          strokeOpacity={stkop}
          stroke="#ff3333"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />
        {/* Linhas A e H3 */}
        <line
          x1={A.x}
          y1={A.y}
          x2={H3.x}
          y2={H3.y}
          strokeOpacity={stkop}
          stroke="#ff3333"
          strokeWidth={lpw}
          strokeDasharray={stkdsh}
        />

        {/* linha entre C4 e H4 */}
        {C4 && H4 && (
          <line
            x1={C4.x}
            y1={C4.y}
            x2={H4.x}
            y2={H4.y}
            strokeOpacity={0.1}
            stroke="#9dd926"
            strokeWidth={lpw}
            strokeDasharray={stkdsh}
          />
        )}

        <polygon
          points={`${C1.x},${C1.y} ${H1.x},${H1.y} ${H2.x},${H2.y} ${C2.x},${C2.y}`}
          fill="#ffffff"
          fillOpacity={0.1}
          stroke="#ffffff"
          strokeWidth={2}
        />
        <polygon
          points={`${C1.x},${C1.y} ${H1.x},${H1.y} ${H3.x},${H3.y} ${C3.x},${C3.y}`}
          fill="#ffffff"
          fillOpacity={0.1}
          stroke="#ffffff"
          strokeWidth={2}
        />

        {H4 && H4.y > A.y && (
          <polygon
            points={`${H1.x},${H1.y} ${H3.x},${H3.y} ${H4.x},${H4.y} ${H2.x},${H2.y}`}
            fill="#ffffff"
            fillOpacity={0.2}
            stroke="#ffffff"
            strokeWidth={2}
          />
        )}
        {C4 && C4.y < A.y && (
          <polygon
            points={`${C1.x},${C1.y} ${C3.x},${C3.y} ${C4.x},${C4.y} ${C2.x},${C2.y}`}
            fill="#ffffff"
            fillOpacity={0.2}
            stroke="#ffffff"
            strokeWidth={2}
          />
        )}
        {/* pontos de interseção */}
        {C4 && (
          <>
            <circle cx={C4.x} cy={C4.y} r={rp} fill="#ff00ff" />
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
            <circle cx={H4.x} cy={H4.y} r={rp} fill="#ff00ff" />

            <text x={H4.x + 10} y={H4.y - 30} fill="#ff00ff" fontSize="13px">
              {"H4"}
            </text>
            <text x={H4.x + 10} y={H4.y - 15} fill="#ff00ff" fontSize="13px">
              {fmt(H4.x, H4.y)}
            </text>
          </>
        )}
        {/* Proj Marcadores de Centro da Face */}
        <line
          x1={C2.x}
          y1={C2.y}
          x2={H1.x}
          y2={H1.y}
          strokeOpacity={stkop}
          stroke="#fff"
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />

        <line
          x1={H2.x}
          y1={H2.y}
          x2={C1.x}
          y2={C1.y}
          strokeOpacity={stkop}
          stroke="#fff"
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />
        <line
          x1={H3.x}
          y1={H3.y}
          x2={C1.x}
          y2={C1.y}
          strokeOpacity={stkop}
          stroke="#fff"
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />
        <line
          x1={C3.x}
          y1={C3.y}
          x2={H1.x}
          y2={H1.y}
          strokeOpacity={stkop}
          stroke="#fff"
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />
        {/* Proj Marcadores de Centro Horizontal */}
        <line
          x1={Hmid1.x}
          y1={Hmid1.y}
          x2={Cmid1.x}
          y2={Cmid1.y}
          strokeOpacity={stkop}
          stroke="#fff"
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />

        {/* Ponto intermediário entre C1 e B */}
        <circle cx={C3.x} cy={C3.y} r={rp} fill="#00ffff" />
        <text x={C3.x + 12} y={C3.y + 35} fill="#00ffff" fontSize="13px">
          {fmt(C3.x, C3.y)}
        </text>
        <text x={C3.x + 12} y={C3.y + 20} fill="#00ffff" fontSize="13px">
          {"C3"}
        </text>

        {/* Ponto intermediário entre H1 e B */}
        <circle cx={H3.x} cy={H3.y} r={rp} fill="#00ffff" />
        <text x={H3.x + 12} y={H3.y - 10} fill="#00ffff" fontSize="13px">
          {fmt(H3.x, H3.y)}
        </text>
        <text x={H3.x + 12} y={H3.y - 25} fill="#00ffff" fontSize="13px">
          {"H3"}
        </text>

        {/* H1–C1 pontilhada */}
        <line
          x1={H1.x}
          y1={H1.y}
          x2={C1.x}
          y2={C1.y}
          stroke="#9dd926"
          strokeWidth={lpw}
          strokeDasharray="6 6"
        />

        {/* ponto A */}
        <circle cx={A.x} cy={A.y} r={rp} fill="#ff3333" />
        <text x={A.x - 52} y={A.y - 10} fill="#aaa" fontSize="14px">
          {fmt(A.x, A.y)}
        </text>
        <text x={A.x - 52} y={A.y - 25} fill="#aaa" fontSize="14px">
          {"PF A"}
        </text>

        {/* ponto B */}
        <circle cx={B.x} cy={B.y} r={rp} fill="#5a78e2" />
        <text x={B.x + 12} y={B.y - 10} fill="#aaa" fontSize="14px">
          {fmt(B.x, B.y)}
        </text>
        <text x={B.x + 12} y={B.y - 25} fill="#aaa" fontSize="14px">
          {"PF B"}
        </text>

        {/* ponto C1 */}
        <circle cx={C1.x} cy={C1.y} r={rp} fill="#ff3333" />
        <text x={C1.x + 12} y={C1.y + 35} fill="#aaa" fontSize="14px">
          {fmt(C1.x, C1.y)}
        </text>
        <text x={C1.x + 12} y={C1.y + 15} fill="#aaa" fontSize="14px">
          {"C1"}
        </text>

        {/* ponto H1 */}
        <circle cx={H1.x} cy={H1.y} r={rp} fill="#ff3333" />
        <text x={H1.x + 12} y={H1.y - 25} fill="#aaa" fontSize="14px">
          {"H1"}
        </text>
        <text x={H1.x + 12} y={H1.y - 10} fill="#aaa" fontSize="14px">
          {fmt(H1.x, H1.y)}
        </text>

        {/* ponto C2 */}
        <circle cx={C2.x} cy={C2.y} r={rp} fill="#00ffff" />
        <text x={C2.x - 15} y={C2.y + 25} fill="#00ffff" fontSize="13px">
          {"C2"}
        </text>
        <text x={C2.x - 52} y={C2.y + 40} fill="#00ffff" fontSize="13px">
          {fmt(C2.x, C2.y)}
        </text>

        {/* ponto H2 */}
        <circle cx={H2.x} cy={H2.y} r={rp} fill="#00ffff" />
        <text x={H2.x - 52} y={H2.y - 10} fill="#00ffff" fontSize="13px">
          {fmt(H2.x, H2.y)}
        </text>
        <text x={H2.x - 15} y={H2.y - 25} fill="#00ffff" fontSize="13px">
          {"H2"}
        </text>
        {MidF1 && Ptop && PBot && (
          <>
            {" "}
            <circle cx={Hmid1.x} cy={Hmid1.y} r={rp} fill="#00ffff" />
            <circle cx={Cmid1.x} cy={Cmid1.y} r={rp} fill="#00ffff" />
            <circle cx={MidF1.x} cy={MidF1.y} r={rp} fill="#00ffff" />
            <circle cx={Ptop.x} cy={Ptop.y} r={rp} fill="#00ffff" />
            <circle cx={PBot.x} cy={PBot.y} r={rp} fill="#00ffff" />
            <line
              x1={Ptop.x}
              y1={Ptop.y}
              x2={PBot.x}
              y2={PBot.y}
              stroke="#9dd926"
              strokeWidth={lpw}
              strokeDasharray="6 6"
            />
            <text
              x={Hmid1.x - 52}
              y={Hmid1.y - 10}
              fill="#00ffff"
              fontSize="13px"
            >
              {"Mid R F1"}
            </text>
             <text
              x={PBot.x - 72}
              y={PBot.y + 20}
              fill="#00ffff"
              fontSize="13px"
            >
              {"Mid Bot Face 1"}
            </text>
             <text
              x={Cmid1.x - 62}
              y={Cmid1.y }
              fill="#00ffff"
              fontSize="13px"
            >
              {"Mid L F1"}
            </text>
            <text
              x={Ptop.x - 72}
              y={Ptop.y - 20}
              fill="#00ffff"
              fontSize="13px"
            >
              {"Mid Top Face 1"}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
