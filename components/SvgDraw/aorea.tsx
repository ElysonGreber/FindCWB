"use client";

import { useState, useRef } from "react";
import { useLineIntersection } from "@/hooks/useLineIntersection";
import { Polygon } from "./PoligonEly";
import { useParallelLines } from "@/hooks/useParallelLines";
import { useIntermediatePoints } from "@/hooks/useIntermediatePoints";
import { useDistancePoints } from "@/hooks/useDistancePoints";
import { useLineCircleIntersection } from "@/hooks/useLineCircleIntersection";
import { useArcByAngle } from "@/hooks/useArcByAngle";
import { useArcBezier } from "@/hooks/useArcBezier";
type Pt = { x: number; y: number };

export default function Divina() {
  

  const W = 1500;
  const H = 1500;
  const CX = W / 2;
  const CY = H / 2;
  const CXhl = ((W / 2 )/ 2);
  const CYht = ((H / 2 )/ 2);
  const CYhb = ((H / 2) + ((H / 2) / 3.29));
  const CXhr = ((W / 2) + ((W / 2 )/ 2));
  const px0 = { x: 0, y: CY };
  const pxW = { x: W, y: CY };
  const py0 = { x: CX, y: 0 };
  const pyH = { x: CX, y: H };
  const pQLB = { x: CXhl, y: CYhb };
  const pQRB = { x: CXhr, y: CYhb };
  const midB = useIntermediatePoints(pQLB, pQRB, 1);
  const midP = midB.length > 0 ? midB[0] : null;
  const BPerp = {x: pQRB.x, y:0};
  let midPp = { x: 0, y: 0 };
  if (midP) {
    midPp = { x: midP.x, y: midP.y };
  }
  const rP1 = useDistancePoints(pQLB, midPp);
const CiB = { center: { x: pQRB.x, y: pQRB.y }, radius: rP1 };

const intersections = useLineCircleIntersection(pQRB, BPerp, CiB);

const pO = intersections.length > 0 ? intersections[0] : null;

let pOp = {x:0 , y:0};
if(pO) {pOp = {x: pO.x, y:pO.y}}

const rOpB = useDistancePoints(pQRB, pOp);
const COB = { center: { x: pOp.x, y: pOp.y }, radius: rOpB };
const interCOpA = useLineCircleIntersection(pQLB, pOp, COB);
const pAO = interCOpA.length > 0 ? interCOpA[1] : null;
let pAOp = {x:0 , y:0};
if(pAO) {pAOp = {x: pAO.x, y:pAO.y}};
const rApiO = useDistancePoints(pQLB, pAOp);

const pV = {x: pQLB.x, y: pQLB.y- rApiO};
const pP = {x: pQLB.x+rApiO, y: pQLB.y};
const pPh = {x: pP.x, y: pV.y};
const pVB = {x:pQRB.x, y:pV.y};
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
  }) 
  
  {
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
const markRO = getPLineAtAngle(pOp.x, pOp.y, rOpB, 65);
const Arc = useArcByAngle(pP, rApiO, 180, 270,1);

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
        
        <g>
          <Line A={px0} B={pxW} className="stroke-red-400" strokeWidth={stkw} />
          <Line A={py0} B={pyH} className="stroke-red-400" strokeWidth={stkw} />
          <Line
            A={pQLB}
            B={pQRB}
            className="stroke-secondary-foreground"
            strokeWidth={stkwH}
          />
          <Line
            A={BPerp}
            B={pQRB}
            className="stroke-secondary-foreground"
            strokeWidth={stkwH}
          />
          <Line A={pQLB} B={pV} className="stroke-secondary-foreground"
            strokeWidth={stkwH}
          />
          <Line A={pV} B={pVB} className="stroke-secondary-foreground"
            strokeWidth={stkwH}
          />
           <Line A={pP} B={pPh} className="stroke-secondary-foreground"
            strokeWidth={stkwH}
          />
          {pO &&(<><Line
            A={pQLB}
            B={pO}
            className="stroke-red-400"
            strokeWidth={stkw}
          />
          <Line
            A={pO}
            B={markRO}
            className="stroke-red-400"
            strokeWidth={stkw}
          />
            <circle
          cx={pO.x}
          cy={pO.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
        
          <text
          x={pO.x + 10}
          y={pO.y - 10}
          className="fill-secondary-foreground text-xs"
        >
          O = (AB/2)
        </text></>)}
        </g>
        
          <circle
          cx={pP.x}
          cy={pP.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
        
        <circle
          cx={pQRB.x}
          cy={pQRB.y}
          r={rP1}
          fill="none"
          className="stroke-red-400"
          strokeDasharray="6 6"
        />
         <circle
          cx={pOp.x}
          cy={pOp.y}
          r={rOpB}
          fill="none"
          className="stroke-red-400"
          strokeDasharray="6 6"
        />
        <circle
          cx={pQLB.x}
          cy={pQLB.y}
          r={rApiO}
          fill="none"
          className="stroke-red-400"
          strokeDasharray="6 6"
        />
         <circle
          cx={pV.x}
          cy={pV.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
         <circle
          cx={pQLB.x}
          cy={pQLB.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
        <circle
          cx={pVB.x}
          cy={pVB.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
         <circle
          cx={pAOp.x}
          cy={pAOp.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
         <circle
          cx={pQRB.x}
          cy={pQRB.y}
          r={3}
          fill="none"
          className="fill-red-400"
        />
        <text
          x={pVB.x + 10}
          y={pVB.y - 10}
          className="fill-secondary-foreground text-xs"
        >
          B'
        </text>
        <text
          x={pAOp.x - 15}
          y={pAOp.y}
          className="fill-secondary-foreground text-xs"
        >
          C
        </text>
        <text
          x={pP.x +5}
          y={pP.y + 15}
          className="fill-secondary-foreground text-xs"
        >
          P
        </text>
        <text
          x={pQRB.x + 10}
          y={pQRB.y +15}
          className="fill-secondary-foreground text-xs"
        >
          B
        </text>
        <text
          x={pQLB.x - 15}
          y={pQLB.y + 15}
          className="fill-secondary-foreground text-xs"
        >
          A
        </text>
         <text
          x={pV.x - 10}
          y={pV.y - 10}
          className="fill-secondary-foreground text-xs"
        >
          r= Intersecção AO e Circulo O r=OB 
        </text>
        <path d={Arc} stroke="blue" strokeWidth={1} fill="none"  strokeLinecap="round"/>
        {/* Pontos intermediários */}
        {midB.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="black" />
            <text x={p.x + 6} y={p.y + 4} fontSize="10" fill="black">
              P{i + 1}
            </text>
          </g>
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
