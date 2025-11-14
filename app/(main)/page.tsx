import Potencial from "@/components/Consulta/Potencial";
import PotencialTable from "@/components/Consulta/PotencialTable";
import QuadroZoneamento from "@/components/Consulta/QuadroZoneamento";
import LoteKonva from "@/components/SvgDraw/LoteKonva";
import SunPathCuritiba from "@/components/sunpaths/Sunpath-2D";
import Diagram2D from "@/components/sunpaths/Sunpath-Diagram";
import LoteSVGComCotas from "@/components/Consulta/LoteCotas";
import LoteValores from "@/components/Consulta/LoteValores";
import SvgLines from "@/components/SvgDraw/pnts";
import Cavalera from "@/components/SvgDraw/cavalera";
import Quadrantes   from "@/components/SvgDraw/conica";
import Isometrica from "@/components/SvgDraw/isometrica";
import Divina from "@/components/SvgDraw/aorea";
export default function Home() {
  return (
    <div className="flex flex-col gap-6">
     
      {/* <Quadrantes /> */}
       <Isometrica />
      <Divina />
     <Cavalera />
      <Quadrantes />
      <Potencial />
      <PotencialTable />
      <QuadroZoneamento />
      <LoteValores />
      <LoteKonva />
      <SunPathCuritiba />
      <Diagram2D />
      <SvgLines />


      <LoteSVGComCotas />

    </div>
  );
}
