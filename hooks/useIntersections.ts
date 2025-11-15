import { useState, useEffect } from "react";
import type { Pt } from "@/types";

type ColoredPt = Pt & { color?: string };

export function useIntersections(
  paths: any[],
  circles: any[],
  ellipses: any[],
  polygons: any[],
  addPoint: (pt: ColoredPt) => void,
  getNextLabel: (i: number) => string,
  setPointCount: React.Dispatch<React.SetStateAction<number>>
) {
  const [intersectionMode, setIntersectionMode] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [previewPoints, setPreviewPoints] = useState<Pt[]>([]);

  /** 🔍 Detecta o elemento clicado */
  function detectClickedElement(p: Pt): string | null {
    for (const group of [paths, polygons]) {
      for (const shape of group) {
        for (let i = 0; i < shape.points.length - 1; i++) {
          const A: Pt = shape.points[i];
          const B: Pt = shape.points[i + 1];
          const dist =
            Math.abs((B.y - A.y) * p.x - (B.x - A.x) * p.y + B.x * A.y - B.y * A.x) /
            Math.hypot(B.y - A.y, B.x - A.x);
          if (dist < 8) return shape.id;
        }
      }
    }

    for (const c of circles) {
      const d = Math.hypot(p.x - c.center.x, p.y - c.center.y);
      if (Math.abs(d - c.radius) < 8) return c.id;
    }

    for (const e of ellipses) {
      const dx = (p.x - e.center.x) / e.rx;
      const dy = (p.y - e.center.y) / e.ry;
      if (Math.abs(dx * dx + dy * dy - 1) < 0.08) return e.id;
    }

    return null;
  }

  /** Alterna seleção de elementos */
  function toggleElementSelection(id: string) {
    setSelectedElements((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /** 🔄 Recalcula automaticamente os pontos de interseção em tempo real */
  useEffect(() => {
    if (!intersectionMode || selectedElements.length < 2) {
      setPreviewPoints([]);
      return;
    }

    const selected = [
      ...paths.filter((p) => selectedElements.includes(p.id)),
      ...circles.filter((c) => selectedElements.includes(c.id)),
      ...ellipses.filter((e) => selectedElements.includes(e.id)),
      ...polygons.filter((p) => selectedElements.includes(p.id)),
    ];

    const newPts: Pt[] = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const A = selected[i];
        const B = selected[j];
        const pts = getIntersectionsBetween(A, B);
        newPts.push(...pts);
      }
    }
    setPreviewPoints(newPts);
  }, [intersectionMode, selectedElements, paths, circles, ellipses, polygons]);

  /** ✅ Finaliza e adiciona os pontos de interseção reais */
  function finalizeIntersections() {
    previewPoints.forEach((pt) => {
      const label = getNextLabel(Date.now() % 1000);
      addPoint({ ...pt, label, color: "yellow" });
      setPointCount((n) => n + 1);
    });
    setPreviewPoints([]);
    setSelectedElements([]);
    setIntersectionMode(false);
  }

  // ===================================================
  // 📐 FUNÇÕES DE INTERSEÇÃO GEOMÉTRICA (sem alterações)
  // ===================================================

  function getIntersectionsBetween(a: any, b: any): Pt[] {
    const pts: Pt[] = [];

    const segsA = getSegments(a);
    const segsB = getSegments(b);

    for (const sa of segsA) {
      for (const sb of segsB) {
        const ip = segmentIntersection(sa.A, sa.B, sb.A, sb.B);
        if (ip) pts.push(ip);
      }
    }

    if (a.points && b.center) {
      for (const seg of getSegments(a)) pts.push(...segmentCurveIntersections(seg, b));
    } else if (b.points && a.center) {
      for (const seg of getSegments(b)) pts.push(...segmentCurveIntersections(seg, a));
    }

    if (a.center && b.center && a.radius && b.radius)
      pts.push(...circleCircleIntersections(a, b));

    if (a.center && b.center && a.rx && b.radius)
      pts.push(...ellipseCircleIntersections(a, b));
    if (b.center && a.center && b.rx && a.radius)
      pts.push(...ellipseCircleIntersections(b, a));

    if (a.rx && b.rx) pts.push(...ellipseEllipseIntersections(a, b));

    return pts;
  }

  function getSegments(shape: any): { A: Pt; B: Pt }[] {
    if (!shape.points) return [];
    const segs: { A: Pt; B: Pt }[] = [];
    for (let i = 0; i < shape.points.length - 1; i++) {
      segs.push({ A: shape.points[i], B: shape.points[i + 1] });
    }
    return segs;
  }

  function segmentIntersection(A: Pt, B: Pt, C: Pt, D: Pt): Pt | null {
    const denom = (A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x);
    if (Math.abs(denom) < 1e-6) return null;

    const x =
      ((A.x * B.y - A.y * B.x) * (C.x - D.x) -
        (A.x - B.x) * (C.x * D.y - C.y * D.x)) /
      denom;
    const y =
      ((A.x * B.y - A.y * B.x) * (C.y - D.y) -
        (A.y - B.y) * (C.x * D.y - C.y * D.x)) /
      denom;

    if (
      x < Math.min(A.x, B.x) - 0.1 ||
      x > Math.max(A.x, B.x) + 0.1 ||
      y < Math.min(A.y, B.y) - 0.1 ||
      y > Math.max(A.y, B.y) + 0.1 ||
      x < Math.min(C.x, D.x) - 0.1 ||
      x > Math.max(C.x, D.x) + 0.1 ||
      y < Math.min(C.y, D.y) - 0.1 ||
      y > Math.max(C.y, D.y) + 0.1
    )
      return null;

    return { x, y };
  }

  function segmentCurveIntersections(seg: { A: Pt; B: Pt }, curve: any): Pt[] {
    if (curve.radius) return segmentCircleIntersections(seg, curve);
    if (curve.rx) return segmentEllipseIntersections(seg, curve);
    return [];
  }

  function segmentCircleIntersections(seg: { A: Pt; B: Pt }, c: any): Pt[] {
    const { A, B } = seg;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const fx = A.x - c.center.x;
    const fy = A.y - c.center.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const cc = fx * fx + fy * fy - c.radius * c.radius;
    const disc = b * b - 4 * a * cc;
    const pts: Pt[] = [];
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const t1 = (-b - s) / (2 * a);
      const t2 = (-b + s) / (2 * a);
      [t1, t2].forEach((t) => {
        if (t >= 0 && t <= 1)
          pts.push({ x: A.x + t * dx, y: A.y + t * dy });
      });
    }
    return pts;
  }

  function segmentEllipseIntersections(seg: { A: Pt; B: Pt }, e: any): Pt[] {
    const { A, B } = seg;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const x0 = A.x - e.center.x;
    const y0 = A.y - e.center.y;

    const a = (dx * dx) / (e.rx * e.rx) + (dy * dy) / (e.ry * e.ry);
    const b = (2 * x0 * dx) / (e.rx * e.rx) + (2 * y0 * dy) / (e.ry * e.ry);
    const c = (x0 * x0) / (e.rx * e.rx) + (y0 * y0) / (e.ry * e.ry) - 1;

    const disc = b * b - 4 * a * c;
    const pts: Pt[] = [];
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const t1 = (-b - s) / (2 * a);
      const t2 = (-b + s) / (2 * a);
      [t1, t2].forEach((t) => {
        if (t >= 0 && t <= 1)
          pts.push({ x: A.x + t * dx, y: A.y + t * dy });
      });
    }
    return pts;
  }

  function circleCircleIntersections(a: any, b: any): Pt[] {
    const dx = b.center.x - a.center.x;
    const dy = b.center.y - a.center.y;
    const d = Math.hypot(dx, dy);
    if (d > a.radius + b.radius || d < Math.abs(a.radius - b.radius)) return [];
    const a1 = (a.radius ** 2 - b.radius ** 2 + d ** 2) / (2 * d);
    const h = Math.sqrt(Math.max(a.radius ** 2 - a1 ** 2, 0));
    const xm = a.center.x + (a1 * dx) / d;
    const ym = a.center.y + (a1 * dy) / d;
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
    return [
      { x: xm + rx, y: ym + ry },
      { x: xm - rx, y: ym - ry },
    ];
  }

  function ellipseCircleIntersections(e: any, c: any): Pt[] {
    const pts: Pt[] = [];
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 90) {
      const ex = e.center.x + e.rx * Math.cos(a);
      const ey = e.center.y + e.ry * Math.sin(a);
      const dist = Math.abs(Math.hypot(ex - c.center.x, ey - c.center.y) - c.radius);
      if (dist < 1.5) pts.push({ x: ex, y: ey });
    }
    return pts;
  }

  function ellipseEllipseIntersections(e1: any, e2: any): Pt[] {
    const pts: Pt[] = [];
    const threshold = 1.5;

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 180) {
      const x1 = e1.center.x + e1.rx * Math.cos(a);
      const y1 = e1.center.y + e1.ry * Math.sin(a);

      const dx = (x1 - e2.center.x) / e2.rx;
      const dy = (y1 - e2.center.y) / e2.ry;
      const val = Math.abs(dx * dx + dy * dy - 1);

      if (val < 0.02) pts.push({ x: x1, y: y1 });
    }

    const filtered: Pt[] = [];
    pts.forEach((p) => {
      if (!filtered.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < threshold))
        filtered.push(p);
    });
    return filtered;
  }

  return {
    intersectionMode,
    setIntersectionMode,
    selectedElements,
    toggleElementSelection,
    detectClickedElement,
    finalizeIntersections,
    previewPoints,
  };
}
