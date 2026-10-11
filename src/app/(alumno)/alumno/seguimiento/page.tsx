import { Suspense } from "react";
import { CargandoSeguimiento, ContenidoSeguimiento, MarcoSeguimiento } from "./_componentes/ContenidoSeguimiento";

export const metadata = { title: "Seguimiento — EFSRT" };

/** Pestaña "Seguimiento": muestra el módulo predeterminado (observado o más reciente). */
export default function PaginaSeguimiento() {
  return (
    <MarcoSeguimiento>
      <Suspense fallback={<CargandoSeguimiento />}>
        <ContenidoSeguimiento modulo={null} />
      </Suspense>
    </MarcoSeguimiento>
  );
}
