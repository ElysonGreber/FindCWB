import { useMemo } from "react";

export type Pt = { x: number; y: number };

/**
 * Hook para gerar o path SVG de um arco de círculo,
 * a partir do centro, raio e ângulos inicial/final.
 *
 * @param center Centro do círculo
 * @param radius Raio do círculo
 * @param startAngle Ângulo inicial (em graus)
 * @param endAngle Ângulo final (em graus)
 * @param sweepFlag (opcional) 0 = anti-horário, 1 = horário
 * @returns String pronta para atributo "d" do <path>
 */
export function useArcByAngle(
  center: Pt,
  radius: number,
  startAngle: number,
  endAngle: number,
  sweepFlag: 0 | 1 = 1
): string {
  return useMemo(() => {
    // Converte graus → radianos
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const startRad = toRad(startAngle);
    const endRad = toRad(endAngle);

    // Calcula coordenadas dos pontos inicial e final
    const start = {
      x: center.x + radius * Math.cos(startRad),
      y: center.y + radius * Math.sin(startRad),
    };
    const end = {
      x: center.x + radius * Math.cos(endRad),
      y: center.y + radius * Math.sin(endRad),
    };

    // Verifica se o arco é maior que 180°
    const angleDiff =
      ((endAngle - startAngle + 360) % 360) * (sweepFlag === 1 ? 1 : -1);
    const largeArcFlag = Math.abs(angleDiff) > 180 ? 1 : 0;

    // Retorna path SVG
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  }, [center, radius, startAngle, endAngle, sweepFlag]);
}
