"use client";

import { useRef, useState, useCallback } from "react";
const COLORS = {
  background: "bg-gray-900",
  lRed: "stroke-red-500",
  lMain: "stroke-secondary-foreground ",
  lineSecondary: "stroke-blue-400",
  structure: "stroke-lime-400",
  intersection: "stroke-fuchsia-400 fill-fuchsia-400",
  helper: "stroke-white/50",
  faceFill: "stroke-secondary-foreground fill-secondary-foreground",
  text: "fill-secondary-foreground",
  pointMain: "fill-red-500",
  pointSecondary: "fill-cyan-400",
  pointHighlight: "fill-yellow-400",
};
// ======================================================================
// 1) TIPOS E UTILITÁRIOS GERAIS (UNIFICADOS)
// ======================================================================
type Pt = { x: number; y: number };
type Mat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

function solveHomography(src: Pt[], dst: Pt[]): Mat3 | null {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const n = b.length;
  for (let i = 0; i < n; i++) A[i].push(b[i]);
  for (let col = 0; col < 8; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-12) return null;
    [A[col], A[piv]] = [A[piv], A[col]];
    const div = A[col][col];
    for (let j = col; j <= 8; j++) A[col][j] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = A[r][col];
      for (let j = col; j <= 8; j++) A[r][j] -= factor * A[col][j];
    }
  }
  const h = A.map((row) => row[8]);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

function matInv3(m: Mat3): Mat3 | null {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h,
    B = -(d * i - f * g),
    C = d * h - e * g;
  const D = -(b * i - c * h),
    E = a * i - c * g,
    F = -(a * h - b * g);
  const G = b * f - c * e,
    Hc = -(a * f - c * d),
    I = a * e - b * d;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  return [
    A * inv,
    D * inv,
    G * inv,
    B * inv,
    E * inv,
    Hc * inv,
    C * inv,
    F * inv,
    I * inv,
  ];
}

function applyH(H: Mat3, p: Pt): Pt {
  const X = H[0] * p.x + H[1] * p.y + H[2];
  const Y = H[3] * p.x + H[4] * p.y + H[5];
  const W = H[6] * p.x + H[7] * p.y + H[8];
  return { x: X / W, y: Y / W };
}

// Função genérica para interseção de retas paramétricas
function lineIntersection(p1: Pt, d1: Pt, p2: Pt, d2: Pt): Pt | null {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-9) return null; // linhas paralelas
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / denom;
  return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
}

// Utilitário modular para projetar círculo em uma face via homografia
export function projectedCircleInFace(face: Pt[]) {
  const dstQuad = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  const Hf = solveHomography(face, dstQuad);
  const Hinverse = Hf ? matInv3(Hf) : null;
  if (!Hinverse) return null;

  const uc = 0.5,
    vc = 0.5,
    r = 0.5;
  const N = 160;
  const pts: Pt[] = [];
  for (let k = 0; k < N; k++) {
    const t = (2 * Math.PI * k) / N;
    pts.push(
      applyH(Hinverse, { x: uc + r * Math.cos(t), y: vc + r * Math.sin(t) })
    );
  }
  const pathD =
    `M ${pts[0].x},${pts[0].y} ` +
    pts
      .slice(1)
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ") +
    " Z";
  const cx = applyH(Hinverse, { x: uc, y: vc });
  const rx1 = applyH(Hinverse, { x: uc - r, y: vc });
  const rx2 = applyH(Hinverse, { x: uc + r, y: vc });
  const ry1 = applyH(Hinverse, { x: uc, y: vc - r });
  const ry2 = applyH(Hinverse, { x: uc, y: vc + r });
  return { pathD, center: cx, axes: { rx1, rx2, ry1, ry2 } };
}

// ======================================================================
// 2) COMPONENTE PRINCIPAL
// ======================================================================
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

  // H1 tem y independente em estado; x SEMPRE = C1.x
  const [H1Y, setH1Y] = useState(200);
  const H1 = { x: C1.x, y: H1Y };

  // proporção entre os pontos (0 = início, 1 = fim)
  const t = 0.5;

  // Parametrizacao de atributos
  const rp = 3;
  const lpw = 1;
  const stkop = 0.5;
  const stkdsh = "5 10";

  // ======================================================================
  // 3) PONTOS INTERMEDIÁRIOS E INTERSEÇÕES
  // ======================================================================
  // pontos intermediários
  const C2 = { x: A.x + t * (C1.x - A.x), y: A.y + t * (C1.y - A.y) };
  const H2 = { x: A.x + t * (H1.x - A.x), y: A.y + t * (H1.y - A.y) };
  const C3 = { x: C1.x + t * (B.x - C1.x), y: C1.y + t * (B.y - C1.y) };
  const H3 = { x: H1.x + t * (B.x - H1.x), y: H1.y + t * (B.y - H1.y) };
  const Hmid1 = { x: C1.x + t * (H1.x - C1.x), y: C1.y + t * (H1.y - C1.y) };
  const Cmid1 = { x: C2.x + t * (H2.x - C2.x), y: C2.y + t * (H2.y - C2.y) };

  // cálculos dos pontos de interseção
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

  // ======================================================================
  // 4) ARCO DE CÍRCULO TANGENTE ÀS RETAS L1(H1–H2) E L2(H2–C2)
  //    QUE PASSA PELOS PONTOS DE TANGÊNCIA Cmid1 e Ptop
  // ======================================================================
  // Variáveis de saída
  let arcCircle: { cx: number; cy: number; r: number } | null = null;
  let arcMid: { x: number; y: number } | null = null;

  // Garantir que os pontos existem
  if (Cmid1 && Ptop) {
    // Direções das linhas base
    const v1 = { x: H2.x - H1.x, y: H2.y - H1.y }; // L1 = H1→H2
    const v2 = { x: C2.x - H2.x, y: C2.y - H2.y }; // L2 = H2→C2

    // Normais (perpendiculares às linhas)
    // 🔄 inverter uma delas para garantir o lado certo do arco
    const n1 = { x: -v1.y, y: v1.x };
    const n2 = { x: v2.y, y: -v2.x };

    // Interseção das perpendiculares (centro do círculo)
    const center = lineIntersection(Cmid1, n1, Ptop, n2);

    if (center) {
      // Raio = distância do centro até o ponto de tangência
      const r = Math.hypot(center.x - Cmid1.x, center.y - Cmid1.y);
      arcCircle = { cx: center.x, cy: center.y, r };

      // Ponto médio do raio (entre o centro e o ponto de tangência esquerdo)
      arcMid = {
        x: (center.x + Cmid1.x) / 2,
        y: (center.y + Cmid1.y) / 2,
      };
    }
  }

  // ======================================================================
  // 5) PERSPECTIVA: CÍRCULO → ELIPSE (via HOMOGRAFIA) — BLOCO ORIGINAL
  // 
  // ======================================================================
  // --------- Configuração das correspondências ---------
  // Fonte: sua face (ordem ao redor do polígono)
  const srcQuad: Pt[] = [C1, H1, H3, C3];

  // Alvo: quadrado unidade (ajuste a ordem se necessário)
  const dstQuad: Pt[] = [
    { x: 0, y: 0 }, // C1
    { x: 1, y: 0 }, // H1
    { x: 1, y: 1 }, // H3
    { x: 0, y: 1 }, // C3
  ];

  // Homografia da face para o quadrado
  const H_face_to_unit = solveHomography(srcQuad, dstQuad);
  // Inversa (quadrado -> face)
  const H_unit_to_face = H_face_to_unit ? matInv3(H_face_to_unit) : null;

  // --------- Geração do arco/“elipse” projetiva ---------
  let ellipsePathD: string | null = null;
  let ellipseCenter: Pt | null = null;

  if (H_unit_to_face) {
    // Centro do círculo no quadrado e raio
    const uc = 0.5,
      vc = 0.5,
      r = 0.5;

    // Centro projetado de volta (apenas para marcar)
    ellipseCenter = applyH(H_unit_to_face, { x: uc, y: vc });

    const N = 160; // amostragem suave
    const pts: Pt[] = [];
    for (let k = 0; k < N; k++) {
      const t = (2 * Math.PI * k) / N;
      const u = uc + r * Math.cos(t);
      const v = vc + r * Math.sin(t);
      pts.push(applyH(H_unit_to_face, { x: u, y: v }));
    }
    // monta d do path
    if (pts.length) {
      ellipsePathD =
        `M ${pts[0].x},${pts[0].y} ` +
        pts
          .slice(1)
          .map((p) => `L ${p.x},${p.y}`)
          .join(" ") +
        " Z";
    }
  }

  // ======================================================================
  // 6) INTERAÇÃO (DRAG)
  // ======================================================================
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

  // ======================================================================
  // 7) CÍRCULOS EM PERSPECTIVA NAS DUAS FACES (FUNÇÃO REUTILIZÁVEL)
  // ======================================================================
  const circleFace1 = projectedCircleInFace([C1, H1, H3, C3]);
  const circleFace2 = projectedCircleInFace([C1, H1, H2, C2]);

  // ======================================================================
  // 8) RENDERIZAÇÃO
  // ======================================================================
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
          className={COLORS.lMain}
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
           className={COLORS.lRed}
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
            <text x={H4.x + 10} y={H4.y - 30} className={COLORS.text} fontSize="13px">
              {"H4"}
            </text>
            <text x={H4.x + 10} y={H4.y - 15} className={COLORS.text} fontSize="13px">
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
          className={COLORS.lMain}
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
          className={COLORS.lMain}
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />
        <line
          x1={C3.x}
          y1={C3.y}
          x2={H1.x}
          y2={H1.y}
          strokeOpacity={stkop}
          className={COLORS.lMain}
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
          className={COLORS.lMain}
          strokeWidth={lpw}
          strokeDasharray="2 8"
        />

        {/* Ponto intermediário entre C1 e B */}
        <circle cx={C3.x} cy={C3.y} r={rp} fill="#00ffff" />
        <text x={C3.x + 12} y={C3.y + 35} className={COLORS.text} fontSize="13px">
          {fmt(C3.x, C3.y)}
        </text>
        <text x={C3.x + 12} y={C3.y + 20} className={COLORS.text} fontSize="13px">
          {"C3"}
        </text>

        {/* Ponto intermediário entre H1 e B */}
        <circle cx={H3.x} cy={H3.y} r={rp} fill="#00ffff" />
        <text x={H3.x + 12} y={H3.y - 10} className={COLORS.text} fontSize="13px">
          {fmt(H3.x, H3.y)}
        </text>
        <text x={H3.x + 12} y={H3.y - 25} className={COLORS.text} fontSize="13px">
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
              className={COLORS.text}
              fontSize="13px"
            >
              {"Mid R F1"}
            </text>
            <text
              x={PBot.x - 72}
              y={PBot.y + 20}
              className={COLORS.text}
              fontSize="13px"
            >
              {"Mid Bot Face 1"}
            </text>
            <text x={Cmid1.x - 62} y={Cmid1.y} className={COLORS.text} fontSize="13px">
              {"Mid L F1"}
            </text>
            <text
              x={Ptop.x - 72}
              y={Ptop.y - 20}
              className={COLORS.text}
              fontSize="13px"
            >
              {"Mid Top Face 1"}
            </text>
          </>
        )}

        {/* FACE 1 */}
        <polygon
          points={`${C1.x},${C1.y} ${H1.x},${H1.y} ${H3.x},${H3.y} ${C3.x},${C3.y}`}
          fill="#ffffff"
          fillOpacity={0.1}
          className={COLORS.faceFill}
          strokeWidth={3}
        />
        {circleFace1 && (
          <>
            {/* Elipse */}
            <path
              d={circleFace1.pathD}
              className={COLORS.lMain}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <circle
              cx={circleFace1.center.x}
              cy={circleFace1.center.y}
              r={3}
              fill="#fff"
              strokeDasharray="4 4"
            />
            {/* Eixos */}
            <line
              x1={circleFace1.axes.rx1.x}
              y1={circleFace1.axes.rx1.y}
              x2={circleFace1.axes.rx2.x}
              y2={circleFace1.axes.rx2.y}
              className={COLORS.lMain}
              strokeDasharray="4 4"
            />

            <line
              x1={circleFace1.axes.ry1.x}
              y1={circleFace1.axes.ry1.y}
              x2={circleFace1.axes.ry2.x}
              y2={circleFace1.axes.ry2.y}
              className={COLORS.lMain}
              strokeDasharray="4 4"
            />
          </>
        )}

        {/* FACE 2 */}
        <polygon
          points={`${C1.x},${C1.y} ${H1.x},${H1.y} ${H2.x},${H2.y} ${C2.x},${C2.y}`}
          fill="#ffffff"
          fillOpacity={0.1}
          className={COLORS.faceFill}
          strokeWidth={3}
        />
        {circleFace2 && (
          <>
            <path
              d={circleFace2.pathD}
              className={COLORS.lMain}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <circle
              cx={circleFace2.center.x}
              cy={circleFace2.center.y}
              r={3}
              fill="#ffcc00"
            />
            <line
              x1={circleFace2.axes.rx1.x}
              y1={circleFace2.axes.rx1.y}
              x2={circleFace2.axes.rx2.x}
              y2={circleFace2.axes.rx2.y}
              className={COLORS.lMain}
              strokeDasharray="4 4"
            />
            <line
              x1={circleFace2.axes.ry1.x}
              y1={circleFace2.axes.ry1.y}
              x2={circleFace2.axes.ry2.x}
              y2={circleFace2.axes.ry2.y}
                        className={COLORS.lMain}

              strokeDasharray="4 4"
            />
          </>
        )}
        {/* ponto A */}
        <circle cx={A.x} cy={A.y} r={rp} fill="#ff3333" />
        <text x={A.x - 52} y={A.y - 10} className={COLORS.text} fontSize="14px">
          {fmt(A.x, A.y)}
        </text>
        <text x={A.x - 52} y={A.y - 25} className={COLORS.text} >
          {"PF A"}
        </text>

        {/* ponto B */}
        <circle cx={B.x} cy={B.y} r={rp} fill="#5a78e2" />
        <text x={B.x + 12} y={B.y - 10} className={COLORS.text} fontSize="14px">
          {fmt(B.x, B.y)}
        </text>
        <text x={B.x + 12} y={B.y - 25} className={COLORS.text} fontSize="14px">
          {"PF B"}
        </text>

        {/* ponto C1 */}
        <circle cx={C1.x} cy={C1.y} r={rp} fill="#ff3333" />
        <text x={C1.x + 12} y={C1.y + 35} className={COLORS.text} fontSize="14px">
          {fmt(C1.x, C1.y)}
        </text>
        <text x={C1.x + 12} y={C1.y + 15} className={COLORS.text} fontSize="14px">
          {"C1"}
        </text>

        {/* ponto H1 */}
        <circle cx={H1.x} cy={H1.y} r={rp} fill="#ff3333" />
        <text x={H1.x + 12} y={H1.y - 25} className={COLORS.text} fontSize="14px">
          {"H1"}
        </text>
        <text x={H1.x + 12} y={H1.y - 10} className={COLORS.text} fontSize="14px">
          {fmt(H1.x, H1.y)}
        </text>

        {/* ponto C2 */}
        <circle cx={C2.x} cy={C2.y} r={rp} fill="#00ffff" />
        <text x={C2.x - 15} y={C2.y + 25} className={COLORS.text} fontSize="13px">
          {"C2"}
        </text>
        <text x={C2.x - 52} y={C2.y + 40} className={COLORS.text} fontSize="13px">
          {fmt(C2.x, C2.y)}
        </text>

        {/* ponto H2 */}
        <circle cx={H2.x} cy={H2.y} r={rp} fill="#00ffff" />
        <text x={H2.x - 52} y={H2.y - 10} className={COLORS.text} fontSize="13px">
          {fmt(H2.x, H2.y)}
        </text>
        <text x={H2.x - 15} y={H2.y - 25} className={COLORS.text} fontSize="13px">
          {"H2"}
        </text>

      </svg>
    </div>
  );
}
