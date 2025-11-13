"use client";

import { useState, useRef } from "react";
import { useLineIntersection } from "@/hooks/useLineIntersection";
import { Polygon } from "./PoligonEly";
import { useParallelLines } from "@/hooks/useParallelLines";
type Pt = { x: number; y: number };

export default function Cavalera() {
  const W = 1500;
  const H = 1500;
  const CX = W / 2;
  const CY = H / 2;
  const CXA = CX - 300;

  const { getIntersection } = useLineIntersection();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const stkw = 0.4;
  const stkwH = 1.5;

  const [points, setPoints] = useState<Pt[]>([]);

  // Conversão de coordenadas do mouse para o sistema SVG
  const toSvgCoords = (clientX: number, clientY: number): Pt => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x, y };
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const { clientX, clientY } = e;
    const p = toSvgCoords(clientX, clientY);
    setPoints((prev) => [...prev, p]);
  };

  function getPLineAtAngle(
    x1: number,
    y1: number,
    length: number,
    angleDeg: number
  ) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: x1 + length * Math.cos(rad), y: y1 + length * Math.sin(rad) };
  }

  function Line({
    A,
    B,
    className = "stroke-black",
    strokeWidth = 1,
    strokeDasharray,
  }: {
    A: { x: number; y: number };
    B: { x: number; y: number };
    className?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }) {
    return (
      <line
        x1={A.x}
        y1={A.y}
        x2={B.x}
        y2={B.y}
        className={className}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    );
  }

  function pointAlongVector(A: Pt, B: Pt, k: number) {
    return {
      x: A.x + (B.x - A.x) * k,
      y: A.y + (B.y - A.y) * k,
    };
  }

  // Eixo e projeções
  const L = 650;
  const eangle = 135;
  const eixoX2 = CXA + L * Math.cos((eangle * Math.PI) / 180);
  const eixoY2 = CY + L * Math.sin((eangle * Math.PI) / 180);

  // Pontos geométricos do cubo
  const HfS = CY - 200;
  const Hcubo = 200;
  const HcuboY = HfS - Hcubo;
  const Lcubo = 200;
  const Pcubo = Lcubo / 2;

  const PA = { x: CXA, y: HfS };
  const PB = { x: CXA + Lcubo, y: HfS };
  const PC = { x: CXA + Lcubo, y: HcuboY };
  const PD = { x: CXA, y: HcuboY };

  const PA2 = getPLineAtAngle(PA.x, PA.y, Pcubo, 135);
  const PB2 = getPLineAtAngle(PB.x, PB.y, Pcubo, 135);
  const PC2 = getPLineAtAngle(PC.x, PC.y, Pcubo, 135);
  const PD2 = getPLineAtAngle(PD.x, PD.y, Pcubo, 135);

  const pPBs = { x: CXA + Lcubo, y: CY };
  const pPB2s = getPLineAtAngle(pPBs.x, pPBs.y, Pcubo, 135);

  // Foco
 
  const PFx2 = getPLineAtAngle(CXA, CY, 200, 135);
  const PF = getPLineAtAngle(PFx2.x, PFx2.y, 600, 270);
  const PFxpre = getIntersection(
    { x: PF.x, y: PF.y },
    { x: PF.x, y: PF.y+700 },
    { x: CXA, y: CY },
    { x: eixoX2, y: eixoY2 }
  );
 let PFx = {x: 0, y:0}
 if (PFxpre) PFx = { x: PFxpre.x, y: PFxpre.y };
  const PFxCont = pointAlongVector(PFx, pPB2s, 3);
  const PFxInter = getIntersection(
    { x: PFx.x, y: PFx.y },
    { x: PFxCont.x, y: PFxCont.y },
    { x: 0, y: CY },
    { x: W, y: CY }
  );

  let eyi = { x: 0, y: 0 };
  if (PFxInter) eyi = { x: PFxInter.x, y: PFxInter.y };

  const PFext = pointAlongVector(PF, PC2, 3);
  const PFbext = pointAlongVector(PF, PB2, 3);
  const PFinter = getIntersection(
    { x: PF.x, y: PF.y },
    { x: PFext.x, y: PFext.y },
    { x: eyi.x, y: eyi.y },
    { x: eyi.x, y: 0 }
  );

  let efi = { x: 0, y: 0 };
  if (PFinter) efi = { x: PFinter.x, y: PFinter.y };

  const PFPFx = getIntersection(
    { x: PF.x, y: PF.y },
    { x: PFbext.x, y: PFbext.y },
    { x: PFx.x, y: PFx.y },
    { x: PFext.x, y: PFext.y }
  );

  let epfx = { x: 0, y: 0 };
  if (PFPFx) epfx = { x: PFPFx.x, y: PFPFx.y };

  const ifxx = getIntersection(
    { x: epfx.x, y: epfx.y },
    { x: 0, y: epfx.y },
    { x: CXA, y: CY },
    { x: eixoX2, y: eixoY2 }
  );

  let ifxp = { x: 0, y: 0 };
  if (ifxx) ifxp = { x: ifxx.x, y: ifxx.y };

  const facegeo = [
    { x: PB.x, y: PB.y },
    { x: PB2.x, y: PB2.y },
    { x: PC2.x, y: PC2.y },
    { x: PC.x, y: PC.y },
  ];
  const lineA = { A: { x: PC2.x, y: PC2.y }, B: { x: PC.x, y: PC.y } };
  const lineB = { A: { x: PB2.x, y: PB2.y }, B: { x: PB.x, y: PB.y } };
  const parallels = useParallelLines(lineA, lineB, 25);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <svg
        ref={svgRef}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onClick={handleClick}
        className="bg-background cursor-crosshair"
      >
        <Polygon
          points={facegeo}
          className="stroke-blue-400"
          fill="rgba(6,13,24,0.5)"
        />
        <polygon
          points={`
            ${ifxp.x},${ifxp.y}
            ${PA2.x},${PA2.y}
            ${PB2.x},${PB2.y}
            ${PB.x},${PB.y}
            ${PC.x},${PC.y}
            ${efi.x},${efi.y}
            ${eyi.x},${eyi.y}
            ${epfx.x},${epfx.y}
          `}
          fill="rgba(6,13,24,0.5)"
        />

        <g>
          <line
            x1={CXA}
            y1={CY}
            x2={W}
            y2={CY}
            className="stroke-secondary-foreground"
            strokeWidth={stkw}
          />
          <line
            x1={CXA}
            y1={0}
            x2={CXA}
            y2={CY}
            className="stroke-secondary-foreground"
            strokeWidth={stkw}
          />
          <line
            x1={CXA}
            y1={CY}
            x2={eixoX2}
            y2={eixoY2}
            className="stroke-secondary-foreground"
            strokeWidth={stkw}
          />
        </g>

        <g>
          <Line A={PA} B={PB} className="stroke-red-400" strokeDasharray="6 6" />
          <Line A={PD} B={PA} className="stroke-red-400" strokeDasharray="6 6" />
          <Line A={PA} B={PA2} className="stroke-red-400" strokeDasharray="6 6" />
        </g>

        <g>
          <Line A={PB} B={PC} className="stroke-secondary-foreground" />
          <Line A={PC} B={PD} className="stroke-secondary-foreground" />
          <Line A={PD} B={PD2} className="stroke-secondary-foreground" />
          <Line A={PA2} B={PD2} className="stroke-secondary-foreground" />
          <Line A={PB} B={PB2} className="stroke-secondary-foreground" />
          <Line A={PC} B={PC2} className="stroke-secondary-foreground" />
          <Line A={PB2} B={PA2} className="stroke-secondary-foreground" />
          <Line A={PC2} B={PD2} className="stroke-secondary-foreground" />
          <Line A={PC2} B={PB2} className="stroke-secondary-foreground" />
        </g>

        <g>
          <text x={PF.x - 3} y={PF.y - 10} className="fill-secondary-foreground text-sm">
            PF
          </text>
          <text x={PA.x - 3} y={PA.y - 10} className="fill-secondary-foreground text-sm">
            A
          </text>
          <text x={PB.x - 3} y={PB.y - 10} className="fill-secondary-foreground text-sm">
            B
          </text>
          <text x={PC.x - 3} y={PC.y - 10} className="fill-secondary-foreground text-sm">
            C
          </text>
          <text x={PD.x - 3} y={PD.y - 10} className="fill-secondary-foreground text-sm">
            D
          </text>
        </g>

        <Line A={PFx} B={eyi} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PF} B={PC2} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PC2} B={efi} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={eyi} B={efi} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PC} B={efi} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PF} B={PB2} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PB2} B={epfx} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={ifxp} B={epfx} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PF} B={PA2} className="stroke-red-400" strokeDasharray="6 6" />
        <Line A={PA2} B={ifxp} className="stroke-red-400" strokeDasharray="6 6" />

        <g>
          {[PFx, PF, pPB2s, eyi, efi].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-yellow-400" />
          ))}
        </g>
{/* Linhas paralelas */}
      {parallels.map((ln, i) => (
        <line
          key={i}
          x1={ln.A.x}
          y1={ln.A.y}
          x2={ln.B.x}
          y2={ln.B.y}
          stroke="black"
          strokeWidth={0.5}
          
        />
      ))}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} className="fill-cyan-400" />
            <text x={p.x + 10} y={p.y - 10} className="fill-cyan-200 text-xs">
              ({Math.round(p.x)}, {Math.round(p.y)})
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
