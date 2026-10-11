import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MODULOS, esModulo } from "@/modules/tramitacion";
import { CargandoSeguimiento, ContenidoSeguimiento, MarcoSeguimiento } from "../_componentes/ContenidoSeguimiento";

export const metadata = { title: "Seguimiento — EFSRT" };

// Los módulos son conocidos (I, II, III): la ruta se prepara de antemano.
export function generateStaticParams() {
  return MODULOS.map((modulo) => ({ modulo }));
}

export default function PaginaSeguimientoModulo({ params }: PageProps<"/alumno/seguimiento/[modulo]">) {
  return (
    <MarcoSeguimiento>
      <Suspense fallback={<CargandoSeguimiento />}>
        <SeguimientoSegunRuta params={params} />
      </Suspense>
    </MarcoSeguimiento>
  );
}

async function SeguimientoSegunRuta({ params }: Pick<PageProps<"/alumno/seguimiento/[modulo]">, "params">) {
  const { modulo } = await params;
  if (!esModulo(modulo)) notFound();
  return <ContenidoSeguimiento modulo={modulo} />;
}
