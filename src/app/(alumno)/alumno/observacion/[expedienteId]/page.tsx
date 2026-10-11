import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VistaObservacion, detalleDeObservacion } from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina } from "@/shared";
import { datosDelEstudiante } from "../../_datos";

export const metadata = { title: "Observación — EFSRT" };

export default function PaginaObservacion({ params }: PageProps<"/alumno/observacion/[expedienteId]">) {
  return (
    <MarcoPagina>
      <Suspense fallback={<CargandoPagina etiqueta="Cargando la observación" />}>
        <Observacion params={params} />
      </Suspense>
    </MarcoPagina>
  );
}

async function Observacion({ params }: Pick<PageProps<"/alumno/observacion/[expedienteId]">, "params">) {
  const { expedienteId } = await params;
  const { seguimiento, nombresModulo, ahora } = await datosDelEstudiante();
  // Solo se busca entre los expedientes propios: uno ajeno da 404 (IDOR).
  const detalle = detalleDeObservacion(seguimiento, expedienteId, ahora);
  if (!detalle) notFound();
  return <VistaObservacion detalle={detalle} nombreModulo={nombresModulo?.[detalle.modulo]} />;
}
