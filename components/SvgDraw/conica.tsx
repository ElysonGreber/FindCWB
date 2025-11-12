"use client";

import { useState, useRef } from "react";
import { useLineIntersection } from "@/hooks/useLineIntersection";
import { useDistance } from "@/hooks/useDistance";
import { availableMemory } from "process";
import { any } from "zod";

type Pt = { x: number; y: number };

export default function Quadrantes() {
  const W = 1700;
  const H = 1500;
  const CX = W / 2;
  const CY = (H -200) / 2;
  const AbeturaV = 200;
  const quadY = 1100
  const { getIntersection } = useLineIntersection();
  const { getDistance } = useDistance();
  const Hobservador = 180;
  const obsvcoord = { x: CX +450, y: 1397 };
  const HobCoordY = CY - Hobservador;
  const Hgeometria = 400;
  const HgCoordY = CY - Hgeometria;
  const LH = { x1: 0, y1: HobCoordY, x2: W, y2: HobCoordY };
  // =========================
  // ESTADOS
  // =========================
  const [points, setPoints] = useState<Pt[]>([]);
  const [FC, setFC] = useState<Pt>({ x: 1145, y: 970 }); // centro do quadrado
  const [angle, setAngle] = useState(0); // ângulo de rotação do quadrado
  const [dragging, setDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<null | "SQUARE" | "ROTATOR">(
    null
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  // =========================
  // CONSTANTES
  // =========================
  const SQ_SIZE = 150;
  const SQ_HALF = SQ_SIZE / 2;
  const RADIUS = 100; // raio do círculo de rotação

  // =========================
  // CONVERSÃO DE COORDENADAS
  // =========================
  const toSvgCoords = (clientX: number, clientY: number): Pt => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x, y };
  };

  // ================================================================
  // EVENTOS DE CLIQUE E DRAG
  // ================================================================
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragTarget) return; // evita adicionar ponto durante o drag
    const { clientX, clientY } = e;
    const p = toSvgCoords(clientX, clientY);
    setPoints((prev) => [...prev, p]);
  };

  const onDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const { clientX, clientY } = e;
    const p = toSvgCoords(clientX, clientY);

    // Detecta clique no ponto de rotação
    const PR = {
      x: FC.x + RADIUS * Math.cos(angle),
      y: FC.y + RADIUS * Math.sin(angle),
    };
    const distPR = Math.hypot(p.x - PR.x, p.y - PR.y);

    // Checa se clique ocorreu dentro do quadrado
    const inSquare =
      p.x >= FC.x - SQ_HALF &&
      p.x <= FC.x + SQ_HALF &&
      p.y >= FC.y - SQ_HALF &&
      p.y <= FC.y + SQ_HALF;

    if (distPR < 12) {
      setDragging(true);
      setDragTarget("ROTATOR");
    } else if (inSquare) {
      setDragging(true);
      setDragTarget("SQUARE");
    }
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !dragTarget) return;
    const { clientX, clientY } = e;
    const p = toSvgCoords(clientX, clientY);

    if (dragTarget === "SQUARE") {
      setFC({ x: p.x, y: p.y });
    } else if (dragTarget === "ROTATOR") {
      const dx = p.x - FC.x;
      const dy = p.y - FC.y;
      setAngle(Math.atan2(dy, dx));
    }
  };

  const onUp = () => {
    setDragging(false);
    setDragTarget(null);
  };

  // ================================================================
  // FUNÇÃO DE ROTAÇÃO
  // ================================================================
  const rotate = (x: number, y: number, a: number): Pt => ({
    x: x * Math.cos(a) - y * Math.sin(a),
    y: x * Math.sin(a) + y * Math.cos(a),
  });

  // ================================================================
  // PONTOS DO QUADRADO ROTACIONADO
  // ================================================================
  const square = {
    A: rotate(-SQ_HALF, -SQ_HALF, angle),
    B: rotate(SQ_HALF, -SQ_HALF, angle),
    C: rotate(SQ_HALF, SQ_HALF, angle),
    D: rotate(-SQ_HALF, SQ_HALF, angle),
  };

  // Translada para o centro FC
  for (const k in square) {
    square[k as keyof typeof square].x += FC.x;
    square[k as keyof typeof square].y += FC.y;
  }

  // ================================================================
  // CÍRCULO DE ROTAÇÃO + PONTO DE CONTROLE (PR)
  // ================================================================
  const PR = {
    x: FC.x + RADIUS * Math.cos(angle),
    y: FC.y + RADIUS * Math.sin(angle),
  };

  // ================================================================
  // Observador Vertical
  // ================================================================
function safeIntersection(
  line1: { x1: number; y1: number; x2: number; y2: number } | null,
  line2: { x1: number; y1: number; x2: number; y2: number },
  getIntersection: (
    p1: Pt,
    p2: Pt,
    p3: Pt,
    p4: Pt
  ) => Pt | null
): Pt | null {
  if (!line1) return null;
  return getIntersection(
    { x: line1.x1, y: line1.y1 },
    { x: line1.x2, y: line1.y2 },
    { x: line2.x1, y: line2.y1 },
    { x: line2.x2, y: line2.y2 }
  );
}
  // ================================================================
  // Linhas entre observador e pontos da forma
  // ================================================================
  const obp = { x: obsvcoord.x, y: obsvcoord.y }; // Observador
  const lpa = { x1: square.A.x, y1: square.A.y, x2: obp.x, y2: obp.y };
  const lpb = { x1: square.B.x, y1: square.B.y, x2: obp.x, y2: obp.y };
  const lpc = { x1: square.C.x, y1: square.C.y, x2: obp.x, y2: obp.y };
  const lpd = { x1: square.D.x, y1: square.D.y, x2: obp.x, y2: obp.y };

  const lobp = { x1: CX, y1: quadY, x2: W, y2: quadY };
  // ================================================================
  // INTERSEÇÕES DAS LINHAS COM O PLANO (lobp)
  // ================================================================
  const ppA = getIntersection(
    { x: lpa.x1, y: lpa.y1 },
    { x: lpa.x2, y: lpa.y2 },
    { x: lobp.x1, y: lobp.y1 },
    { x: lobp.x2, y: lobp.y2 }
  );

  const ppB = getIntersection(
    { x: lpb.x1, y: lpb.y1 },
    { x: lpb.x2, y: lpb.y2 },
    { x: lobp.x1, y: lobp.y1 },
    { x: lobp.x2, y: lobp.y2 }
  );
  const ppC = getIntersection(
    { x: lpc.x1, y: lpc.y1 },
    { x: lpc.x2, y: lpc.y2 },
    { x: lobp.x1, y: lobp.y1 },
    { x: lobp.x2, y: lobp.y2 }
  );
  const ppD = getIntersection(
    { x: lpd.x1, y: lpd.y1 },
    { x: lpd.x2, y: lpd.y2 },
    { x: lobp.x1, y: lobp.y1 },
    { x: lobp.x2, y: lobp.y2 }
  );

  //=== Proj quadro plano
  const pqP = getIntersection(
    { x: CX, y: 0 },
    { x: CX, y: H },
    { x: lobp.x1, y: lobp.y1 },
    { x: lobp.x2, y: lobp.y2 }
  );
  let rProjQ = 0;
  if (pqP) {
    rProjQ = getDistance({ x: pqP.x, y: pqP.y }, { x: CX, y: CY });
  }

  let ppAp = { x: 0, y: 0 };
  if (ppA) {
    ppAp = { x: ppA.x, y: CY };
  }

  let ppBp = { x: 0, y: 0 };
  if (ppB) {
    ppBp = { x: ppB.x, y: CY };
  }

  let ppCp = { x: 0, y: 0 };
  if (ppC) {
    ppCp = { x: ppC.x, y: CY };
  }

  let ppDp = { x: 0, y: 0 };
  if (ppD) {
    ppDp = { x: ppD.x, y: CY };
  }

  const pobpY = { x: CX, y: 1397 };
  //=== Distancia Pontos Geometria entre C dos quadros =================
  let rProjA = getDistance({ x: CX, y: square.A.y }, { x: CX, y: CY });
  let rProjB = getDistance({ x: CX, y: square.B.y }, { x: CX, y: CY });
  let rProjC = getDistance({ x: CX, y: square.C.y }, { x: CX, y: CY });
  let rProjD = getDistance({ x: CX, y: square.D.y }, { x: CX, y: CY });
  let rpobpY = getDistance({ x: CX, y: pobpY.y }, { x: CX, y: CY });
  // ================================================================

  let obsv = { x: 0, y: 0 };
  if (rpobpY) {
    obsv = { x: CX - rpobpY, y: HobCoordY };
  }
  // === Funcao Arcos ===============================================
  // ================================================================
  function getArcPath(r: number): string {
    const startAngle = Math.PI; // 180°
    const endAngle = 0.5 * Math.PI; // 90°
    const start = {
      x: CX + r * Math.cos(startAngle),
      y: CY + r * Math.sin(startAngle),
    };
    const end = {
      x: CX + r * Math.cos(endAngle),
      y: CY + r * Math.sin(endAngle),
    };
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 0 ${end.x} ${end.y}`;
  }
  // ================================================================
  // ================================================================

  const lQvl = { x1: CX - rProjQ, y1: CY, x2: CX - rProjQ, y2: 0 };
  const ppAv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjA, y: HgCoordY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  const ppBv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjB, y: HgCoordY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  const ppCv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjC, y: HgCoordY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  const ppDv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjD, y: HgCoordY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );

  const ppAbv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjA, y: CY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  const ppBbv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjB, y: CY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  const ppCbv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjC, y: CY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  const ppDbv = getIntersection(
    { x: obsv.x, y: obsv.y },
    { x: CX - rProjD, y: CY },
    { x: lQvl.x1, y: lQvl.y1 },
    { x: lQvl.x2, y: lQvl.y2 }
  );
  let lqha1 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppAv) {
    lqha1 = { x1: ppAv.x, y1: ppAv.y, x2: W, y2: ppAv.y };
  }
  let lqha2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppAbv) {
    lqha2 = { x1: ppAbv.x, y1: ppAbv.y, x2: W, y2: ppAbv.y };
  }
  let lqhb1 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppBv) {
    lqhb1 = { x1: ppBv.x, y1: ppBv.y, x2: W, y2: ppBv.y };
  }
  let lqhb2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppBbv) {
    lqhb2 = { x1: ppBbv.x, y1: ppBbv.y, x2: W, y2: ppBbv.y };
  }
  let lqhc1 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppCv) {
    lqhc1 = { x1: ppCv.x, y1: ppCv.y, x2: W, y2: ppCv.y };
  }
  let lqhc2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppCbv) {
    lqhc2 = { x1: ppCbv.x, y1: ppCbv.y, x2: W, y2: ppCbv.y };
  }

  let lqhd1 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppDv) {
    lqhd1 = { x1: ppDv.x, y1: ppDv.y, x2: W, y2: ppDv.y };
  }
  let lqhd2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
  if (ppDbv) {
    lqhd2 = { x1: ppDbv.x, y1: ppDbv.y, x2: W, y2: ppDbv.y };
  }
  //--------------------
function createVerticalLine(p?: { x: number; y: number } | null) {
  if (!p) return null;
  return { x1: p.x, y1: p.y, x2: p.x, y2: 0 };
}


const lav = createVerticalLine(ppA);
const lbv = createVerticalLine(ppB);
const lcv = createVerticalLine(ppC);
const ldv = createVerticalLine(ppD);
  // let lav = { x1: 0, y1: 0, x2: 0, y2: 0 };
  // if (ppA) {
  //   lav = { x1: ppA.x, y1: ppA.y, x2: ppA.x, y2: 0 };
  // }

  // let lbv = { x1: 0, y1: 0, x2: 0, y2: 0 };
  // if (ppB) {
  //   lbv = { x1: ppB.x, y1: ppB.y, x2: ppB.x, y2: 0 };
  // }

  // let lcv = { x1: 0, y1: 0, x2: 0, y2: 0 };
  // if (ppC) {
  //   lcv = { x1: ppC.x, y1: ppC.y, x2: ppC.x, y2: 0 };
  // }

  // let ldv = { x1: 0, y1: 0, x2: 0, y2: 0 };
  // if (ppD) {
  //   ldv = { x1: ppD.x, y1: ppD.y, x2: ppD.x, y2: 0 };
  // }

 const pahav1 = safeIntersection(lav, lqha1, getIntersection);
 const pahav2 = safeIntersection(lav, lqha2, getIntersection);
  const pahbv1 = safeIntersection(lbv, lqhb1, getIntersection);
   const pahbv2 = safeIntersection(lbv, lqhb2, getIntersection);
 const pahcv1 = safeIntersection(lcv, lqhc1, getIntersection);
   const pahcv2 = safeIntersection(lcv, lqhc2, getIntersection);
 const pahdv1 = safeIntersection(ldv, lqhd1, getIntersection);
   const pahdv2 = safeIntersection(ldv, lqhd2, getIntersection);
 

 

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onClick={handleClick}
        className="border border-gray-700 bg-gray-800 cursor-crosshair"
      >
        {/* ===== LH ===== */}
        <line
          x1={LH.x1}
          y1={LH.y1}
          x2={LH.x2}
          y2={LH.y2}
          className="stroke-blue-100"
          strokeWidth={1}
        />
        {/* ===== Linhas Observador e Forma - Plano ===== */}
        <line
          x1={lpa.x1}
          y1={lpa.y1}
          x2={lpa.x2}
          y2={lpa.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lpb.x1}
          y1={lpb.y1}
          x2={lpb.x2}
          y2={lpb.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lpc.x1}
          y1={lpc.y1}
          x2={lpc.x2}
          y2={lpc.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lpd.x1}
          y1={lpd.y1}
          x2={lpd.x2}
          y2={lpd.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />

        {/* ===== Linhas centrais ===== */}
        <line
          x1={0}
          y1={CY}
          x2={W}
          y2={CY}
          className="stroke-blue-400"
          strokeWidth={2}
        />
        <line
          x1={CX}
          y1={0}
          x2={CX}
          y2={H}
          className="stroke-red-400"
          strokeWidth={2}
        />

        {/* ===== Centro principal ===== */}
        <circle cx={CX} cy={CY} r={8} className="fill-pink-500" />
        <text
          x={CX + 10}
          y={CY - 10}
          className="fill-gray-200 text-sm select-none"
        >
          Centro ({CX}, {CY})
        </text>

        {/* ===== Círculo de rotação ===== */}
        <circle
          cx={FC.x}
          cy={FC.y}
          r={RADIUS}
          className="stroke-purple-400"
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 6"
        />

        {/* Ponto de rotação (PR) */}
        <line
          x1={FC.x}
          y1={FC.y}
          x2={PR.x}
          y2={PR.y}
          className="stroke-purple-300"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
        <circle
          cx={PR.x}
          cy={PR.y}
          r={10}
          className="fill-indigo-400 cursor-pointer"
        />
        <text
          x={PR.x + 12}
          y={PR.y - 10}
          className="fill-indigo-300 text-sm select-none"
        >
          PR
        </text>

        {/* Ângulo atual */}
        <text
          x={FC.x + 120}
          y={FC.y - 20}
          className="fill-gray-300 text-sm select-none"
        >
          Ângulo: {((angle * 180) / Math.PI).toFixed(1)}°
        </text>

        {/* ===== Pontos criados pelo usuário ===== */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} className="fill-cyan-400" />
            <text
              x={p.x + 10}
              y={p.y - 10}
              className="fill-cyan-200 text-xs select-none"
            >
              ({Math.round(p.x)}, {Math.round(p.y)})
            </text>
          </g>
        ))}

        {/* Observador */}
        <circle
          cx={obsvcoord.x}
          cy={obsvcoord.y}
          r={6}
          className="fill-yellow-300"
        />
        {/* ===== Linha Quadro observador no Plano ===== */}
        <line
          x1={lobp.x1}
          y1={lobp.y1}
          x2={lobp.x2}
          y2={lobp.y2}
          className="stroke-emerald-400"
          strokeWidth={2}
        />

        <circle
          cx={obsvcoord.x - AbeturaV}
          cy={lobp.y1}
          r={6}
          className="fill-red-300"
        />
        <circle
          cx={obsvcoord.x + AbeturaV}
          cy={lobp.y1}
          r={6}
          className="fill-red-300"
        />
        <line
          x1={obsvcoord.x + AbeturaV}
          y1={lobp.y1}
          x2={obsvcoord.x}
          y2={obsvcoord.y}
          className="stroke-emerald-400"
          strokeWidth={2}
        />
        <line
          x1={obsvcoord.x - AbeturaV}
          y1={lobp.y1}
          x2={obsvcoord.x}
          y2={obsvcoord.y}
          className="stroke-emerald-400"
          strokeWidth={2}
        />

        <line
          x1={obsvcoord.x - AbeturaV}
          y1={lobp.y1}
          x2={obsvcoord.x - AbeturaV}
          y2={HobCoordY}
          className="stroke-emerald-400"
          strokeWidth={1}
          strokeDasharray="2 6"
        />

        <line
          x1={obsvcoord.x + AbeturaV}
          y1={lobp.y1}
          x2={obsvcoord.x + AbeturaV}
          y2={HobCoordY}
          className="stroke-emerald-400"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
       
        {/* ===== Pontos de projeção (interseções com lobp) ===== */}
        {[
          { p: ppA, name: "ppA", color: "fill-pink-400" },
          { p: ppB, name: "ppB", color: "fill-green-400" },
          { p: ppC, name: "ppC", color: "fill-blue-400" },
          { p: ppD, name: "ppD", color: "fill-purple-400" },
        ].map(({ p, name, color }) =>
          p ? (
            <g key={name}>
              <circle cx={p.x} cy={p.y} r={5} className={color} />
              <text
                x={p.x + 8}
                y={p.y - 8}
                className="fill-gray-200 text-xs select-none"
              >
                {name} ({Math.round(p.x)}, {Math.round(p.y)})
              </text>
            </g>
          ) : null
        )}
        {/* ===== PontoObservador Vista Lateral ===== */}
        {/* ===== ============================= ===== */}
        <circle
          cx={obsv.x}
          cy={obsv.y}
          r={10}
          className="fill-indigo-400 cursor-pointer"
        />
        {/* ===== Marcadores Proj do Observador e Pontos Geometria no Eixo Y inferior ===== */}
        {/* ===== =================================================================== ===== */}
        <g>
          <circle
            cx={CX}
            cy={pobpY.y}
            r={5}
            className="stroke-muted-foreground"
            fill="none"
          />
          <circle
            cx={CX}
            cy={square.A.y}
            r={5}
            className="stroke-muted-foreground cursor-pointer"
            fill="none"
          />
          <circle
            cx={CX}
            cy={square.B.y}
            r={5}
            className="stroke-muted-foreground cursor-pointer"
            fill="none"
          />
          <circle
            cx={CX}
            cy={square.C.y}
            r={5}
            className="stroke-muted-foreground cursor-pointer"
            fill="none"
          />
          <circle
            cx={CX}
            cy={square.D.y}
            r={5}
            className="stroke-muted-foreground cursor-pointer"
            fill="none"
          />
          <line
            x1={obp.x}
            y1={obp.y}
            x2={CX}
            y2={pobpY.y}
            className="stroke-emerald-400"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <line
            x1={square.A.x}
            y1={square.A.y}
            x2={CX}
            y2={square.A.y}
            className="stroke-pink-400"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <line
            x1={square.B.x}
            y1={square.B.y}
            x2={CX}
            y2={square.B.y}
            className="stroke-emerald-400"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <line
            x1={square.C.x}
            y1={square.C.y}
            x2={CX}
            y2={square.C.y}
            className="stroke-emerald-400"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <line
            x1={square.D.x}
            y1={square.D.y}
            x2={CX}
            y2={square.D.y}
            className="stroke-emerald-400"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        </g>
        {/* ===== Marcadores Proj Geometria no quadro Vertical inferior em Y ===== */}
        <circle
          cx={CX - rProjQ}
          cy={CY}
          r={5}
          className="stroke-muted-foreground cursor-pointer"
          fill="none"
        />
        <circle
          cx={CX - rProjA}
          cy={CY}
          r={5}
          className="stroke-muted-foreground fill-pink-400"
        />
        <circle
          cx={CX - rProjB}
          cy={CY}
          r={5}
          className="stroke-muted-foreground cursor-pointer"
          fill="none"
        />
        <circle
          cx={CX - rProjC}
          cy={CY}
          r={5}
          className="stroke-muted-foreground cursor-pointer"
          fill="none"
        />
        <circle
          cx={CX - rProjD}
          cy={CY}
          r={5}
          className="stroke-muted-foreground cursor-pointer"
          fill="none"
        />

        {pqP && (
          <>
            <circle
              cx={pqP.x}
              cy={pqP.y}
              r={10}
              className="fill-indigo-400 cursor-pointer"
            />
          </>
        )}

        {/* ===== Linhas e Pontos Geometria vista lateral ===== */}
        {/* =================================================== */}
        {/* ===== Linhas ===== */}
        <g>
          <line
            x1={CX - rProjA}
            y1={CY}
            x2={CX - rProjA}
            y2={HgCoordY}
            className="stroke-secondary-foreground "
            strokeWidth={2}
          />
          <line
            x1={CX - rProjB}
            y1={CY}
            x2={CX - rProjB}
            y2={HgCoordY}
            className="stroke-secondary-foreground "
            strokeWidth={2}
          />
          <line
            x1={CX - rProjC}
            y1={CY}
            x2={CX - rProjC}
            y2={HgCoordY}
            className="stroke-secondary-foreground "
            strokeWidth={2}
          />
          <line
            x1={lQvl.x1}
            y1={lQvl.y1}
            x2={lQvl.x2}
            y2={lQvl.y2}
            className="stroke-secondary-foreground "
            strokeWidth={2}
          />
          <line
            x1={CX - rProjD}
            y1={CY}
            x2={CX - rProjD}
            y2={HgCoordY}
            className="stroke-secondary-foreground "
            strokeWidth={2}
          />

          {/* ===== Circulos ===== */}
          <circle
            cx={CX - rProjA}
            cy={HgCoordY}
            r={5}
            className="stroke-muted-foreground fill-pink-400"
            fill="none"
          />
          <circle
            cx={CX - rProjB}
            cy={HgCoordY}
            r={5}
            className="stroke-muted-foreground fill-orange-400"
            fill="none"
          />
          <circle
            cx={CX - rProjC}
            cy={HgCoordY}
            r={5}
            className="stroke-muted-foreground fill-orange-400"
            fill="none"
          />
          <circle
            cx={CX - rProjD}
            cy={HgCoordY}
            r={5}
            className="stroke-muted-foreground fill-orange-400"
            fill="none"
          />
          {/* ===== Textos ===== */}
          <text
            x={CX - rProjA - 3}
            y={HgCoordY - 10}
            className="fill-orange-200 text-sm select-none"
          >
            A
          </text>
          <text
            x={CX - rProjB - 3}
            y={HgCoordY - 10}
            className="fill-orange-200 text-sm select-none"
          >
            B
          </text>
          <text
            x={CX - rProjC - 3}
            y={HgCoordY - 10}
            className="fill-orange-200 text-sm select-none"
          >
            C
          </text>
          <text
            x={CX - rProjD - 3}
            y={HgCoordY - 10}
            className="fill-orange-200 text-sm select-none"
          >
            D
          </text>
        </g>
        {/* ============Linha Proj Observador Lateral e Pontos Geometria ======================== */}
        <g>
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjA}
            y2={HgCoordY}
            className="stroke-pink-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjB}
            y2={HgCoordY}
            className="stroke-blue-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjC}
            y2={HgCoordY}
            className="stroke-blue-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjD}
            y2={HgCoordY}
            className="stroke-blue-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjA}
            y2={CY}
            className="stroke-pink-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjB}
            y2={CY}
            className="stroke-blue-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjC}
            y2={CY}
            className="stroke-blue-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <line
            x1={obsv.x}
            y1={obsv.y}
            x2={CX - rProjD}
            y2={CY}
            className="stroke-blue-400"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
        </g>
        {ppAv && ppBv && ppCv && ppDv && ppAbv && ppBbv && ppCbv && ppDbv && (
          <>
            <circle
              cx={ppAv.x}
              cy={ppAv.y}
              r={5}
              className="stroke-muted-foreground fill-pink-400"
            />
            <circle
              cx={ppBv.x}
              cy={ppBv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
            <circle
              cx={ppCv.x}
              cy={ppCv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
            <circle
              cx={ppDv.x}
              cy={ppDv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
            <circle
              cx={ppAbv.x}
              cy={ppAbv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
            <circle
              cx={ppBbv.x}
              cy={ppBbv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
            <circle
              cx={ppCbv.x}
              cy={ppCbv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
            <circle
              cx={ppDbv.x}
              cy={ppDbv.y}
              r={5}
              className="stroke-muted-foreground fill-orange-400"
              fill="none"
            />
          </>
        )}
        <line
          x1={lqha1.x1}
          y1={lqha1.y1}
          x2={lqha1.x2}
          y2={lqha1.y2}
          className="stroke-pink-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lqha2.x1}
          y1={lqha2.y1}
          x2={lqha2.x2}
          y2={lqha2.y2}
          className="stroke-pink-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        {lav &&
       ( <line
          x1={lav.x1}
          y1={lav.y1}
          x2={lav.x2}
          y2={lav.y2}
          className="stroke-pink-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />)
        }
        <line
          x1={lqhb1.x1}
          y1={lqhb1.y1}
          x2={lqhb1.x2}
          y2={lqhb1.y2}
          className="stroke-yellow-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lqhb2.x1}
          y1={lqhb2.y1}
          x2={lqhb2.x2}
          y2={lqhb2.y2}
          className="stroke-yellow-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lqhc1.x1}
          y1={lqhc1.y1}
          x2={lqhc1.x2}
          y2={lqhc1.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lqhc2.x1}
          y1={lqhc2.y1}
          x2={lqhc2.x2}
          y2={lqhc2.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lqhd1.x1}
          y1={lqhd1.y1}
          x2={lqhd1.x2}
          y2={lqhd1.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <line
          x1={lqhd2.x1}
          y1={lqhd2.y1}
          x2={lqhd2.x2}
          y2={lqhd2.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />

        {lbv &&(<line
          x1={lbv.x1}
          y1={lbv.y1}
          x2={lbv.x2}
          y2={lbv.y2}
          className="stroke-yellow-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />)}
        {lcv &&(<line
          x1={lcv.x1}
          y1={lcv.y1}
          x2={lcv.x2}
          y2={lcv.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />)}
        {ldv &&(<line
          x1={ldv.x1}
          y1={ldv.y1}
          x2={ldv.x2}
          y2={ldv.y2}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />)}
        {pahav1 && pahbv1 && pahcv1 && pahdv1 && pahav2 && pahbv2 && pahcv2 && pahdv2 &&(<>          
            <circle
            cx={pahav1.x}
            cy={pahav1.y}
            r={5}
            className="fill-pink-400 cursor-pointer"
          />
            <circle
            cx={pahbv1.x}
            cy={pahbv1.y}
            r={5}
            className="fill-yellow-400 cursor-pointer"
          />
           <circle
            cx={pahcv1.x}
            cy={pahcv1.y}
            r={5}
            className="fill-blue-400 cursor-pointer"
          />
          <circle
            cx={pahdv1.x}
            cy={pahdv1.y}
            r={5}
            className="fill-red-400 cursor-pointer"
          />
           <circle
            cx={pahav2.x}
            cy={pahav2.y}
            r={5}
            className="fill-pink-400 cursor-pointer"
          />
  <circle
            cx={pahbv2.x}
            cy={pahbv2.y}
            r={5}
            className="fill-yellow-400 cursor-pointer"
          />
<circle
            cx={pahcv2.x}
            cy={pahcv2.y}
            r={5}
            className="fill-blue-400 cursor-pointer"
          />
<circle
            cx={pahdv2.x}
            cy={pahdv2.y}
            r={5}
            className="fill-red-400 cursor-pointer"
          />
           <line
          x1={pahav1.x}
          y1={pahav1.y}
          x2={pahbv1.x}
          y2={pahbv1.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahav1.x}
          y1={pahav1.y}
          x2={pahdv1.x}
          y2={pahdv1.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahbv1.x}
          y1={pahbv1.y}
          x2={pahcv1.x}
          y2={pahcv1.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahdv1.x}
          y1={pahdv1.y}
          x2={pahcv1.x}
          y2={pahcv1.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
        

         <line
          x1={pahav2.x}
          y1={pahav2.y}
          x2={pahbv2.x}
          y2={pahbv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahav2.x}
          y1={pahav2.y}
          x2={pahdv2.x}
          y2={pahdv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahbv2.x}
          y1={pahbv2.y}
          x2={pahcv2.x}
          y2={pahcv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahdv2.x}
          y1={pahdv2.y}
          x2={pahcv2.x}
          y2={pahcv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />

        <line
          x1={pahav1.x}
          y1={pahav1.y}
          x2={pahav2.x}
          y2={pahav2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
         <line
          x1={pahbv1.x}
          y1={pahbv1.y}
          x2={pahbv2.x}
          y2={pahbv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
        <line
          x1={pahcv1.x}
          y1={pahcv1.y}
          x2={pahcv2.x}
          y2={pahcv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
        <line
          x1={pahdv1.x}
          y1={pahdv1.y}
          x2={pahdv2.x}
          y2={pahdv2.y}
          className="stroke-blue-400"
          strokeWidth={1}
          
        />
        <line
          x1={obsvcoord.x-AbeturaV}
          y1={HobCoordY}
          x2={pahav1.x}
          y2={pahav1.y}
          className="stroke-blue-400"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
          
        </>

        )}
        
        {/* ============================================================== */}
        {/* ===== Marcadores Proj Geometria do quadro na linha do Q4 ===== */}
        {/* ============================================================== */}
        <circle
          cx={ppAp.x}
          cy={ppAp.y}
          r={5}
          className="fill-indigo-400 cursor-pointer"
        />
        <circle
          cx={ppBp.x}
          cy={ppBp.y}
          r={5}
          className="fill-indigo-400 cursor-pointer"
        />
        <circle
          cx={ppCp.x}
          cy={ppCp.y}
          r={5}
          className="fill-indigo-400 cursor-pointer"
        />
        <circle
          cx={ppDp.x}
          cy={ppDp.y}
          r={5}
          className="fill-indigo-400 cursor-pointer"
        />
        {/* ============================================================== */}
        <path
          d={getArcPath(rProjA)}
          strokeWidth={1}
          fill="none"
          strokeDasharray="6 6"
          className="stroke-pink-400 cursor-pointer"
        />
        <path
          d={getArcPath(rProjB)}
          stroke="#f0f"
          strokeWidth={1}
          fill="none"
          strokeDasharray="6 6"
        />
        <path
          d={getArcPath(rProjC)}
          stroke="#f0f"
          strokeWidth={1}
          fill="none"
          strokeDasharray="6 6"
        />
        <path
          d={getArcPath(rProjD)}
          stroke="#f0f"
          strokeWidth={1}
          fill="none"
          strokeDasharray="6 6"
        />
        <path
          d={getArcPath(rpobpY)}
          stroke="#f0f"
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 6"
        />
        <path
          d={getArcPath(rProjQ)}
          stroke="#f0f"
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 6"
        />
        {/* ===== Quadrado rotacionado ===== */}
        <polygon
          points={`${square.A.x},${square.A.y} ${square.B.x},${square.B.y} ${square.C.x},${square.C.y} ${square.D.x},${square.D.y}`}
          className="stroke-yellow-400 fill-yellow-400/10 cursor-grab"
          strokeWidth={3}
        />

        {/* Pontos do quadrado */}
        {Object.entries(square).map(([label, p]) => (
          <g key={label}>
            <circle cx={p.x} cy={p.y} r={5} className="fill-orange-400" />
            <text
              x={p.x + 8}
              y={p.y - 8}
              className="fill-orange-200 text-sm select-none"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Centro do quadrado */}
        <circle cx={FC.x} cy={FC.y} r={6} className="fill-yellow-300" />
        <text
          x={FC.x + 10}
          y={FC.y + 5}
          className="fill-yellow-200 text-sm select-none"
        >
          FC ({Math.round(FC.x)}, {Math.round(FC.y)})
        </text>
      </svg>
    </div>
  );
}
