import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MODULOS, VistaConstancia, esModulo } from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina } from "@/shared";
import { datosDelEstudiante } from "../../_datos";

export const metadata = { title: "Tu constancia — EFSRT" };

export function generateStaticParams() {
  return MODULOS.map((modulo) => ({ modulo }));
}

export default function PaginaConstancia({ params }: PageProps<"/alumno/constancia/[modulo]">) {
  return (
    <MarcoPagina ancho="amplio">
      <Suspense fallback={<CargandoPagina etiqueta="Cargando tu constancia" />}>
        <Constancia params={params} />
      </Suspense>
    </MarcoPagina>
  );
}

async function Constancia({ params }: Pick<PageProps<"/alumno/constancia/[modulo]">, "params">) {
  const { modulo } = await params;
  if (!esModulo(modulo)) notFound();
  const { seguimiento, nombresModulo } = await datosDelEstudiante();
  const datos = seguimiento.find((m) => m.modulo === modulo);
  if (!datos) notFound();
  return <VistaConstancia datos={datos} nombreModulo={nombresModulo?.[modulo]} />;
}
