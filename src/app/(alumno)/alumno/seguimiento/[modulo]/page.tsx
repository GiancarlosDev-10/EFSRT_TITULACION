import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MODULOS, esModulo } from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina } from "@/shared";
import { ContenidoSeguimiento } from "../_componentes/ContenidoSeguimiento";

export const metadata = { title: "Seguimiento — EFSRT" };

// Los módulos son conocidos (I, II, III): la ruta se prepara de antemano.
export function generateStaticParams() {
  return MODULOS.map((modulo) => ({ modulo }));
}

export default function PaginaSeguimientoModulo({ params }: PageProps<"/alumno/seguimiento/[modulo]">) {
  return (
    <MarcoPagina ancho="completo">
      <Suspense fallback={<CargandoPagina etiqueta="Cargando el seguimiento" />}>
        <SeguimientoSegunRuta params={params} />
      </Suspense>
    </MarcoPagina>
  );
}

async function SeguimientoSegunRuta({ params }: Pick<PageProps<"/alumno/seguimiento/[modulo]">, "params">) {
  const { modulo } = await params;
  if (!esModulo(modulo)) notFound();
  return <ContenidoSeguimiento modulo={modulo} />;
}
