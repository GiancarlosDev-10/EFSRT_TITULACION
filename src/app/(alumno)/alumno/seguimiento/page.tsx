import { Suspense } from "react";
import { CargandoPagina, MarcoPagina } from "@/shared";
import { ContenidoSeguimiento } from "./_componentes/ContenidoSeguimiento";

export const metadata = { title: "Seguimiento — EFSRT" };

/** Pestaña "Seguimiento": muestra el módulo predeterminado (observado o más reciente). */
export default function PaginaSeguimiento() {
  return (
    <MarcoPagina ancho="completo">
      <Suspense fallback={<CargandoPagina etiqueta="Cargando el seguimiento" />}>
        <ContenidoSeguimiento modulo={null} />
      </Suspense>
    </MarcoPagina>
  );
}
