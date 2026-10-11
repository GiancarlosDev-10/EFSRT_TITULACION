import type { ReactNode } from "react";
import { obtenerUsuarioActual } from "@/modules/auth";
import { SeguimientoDeModulo, obtenerSeguimientoDelEstudiante, type Modulo } from "@/modules/tramitacion";

/** Contenedor común de /alumno/seguimiento y /alumno/seguimiento/[modulo]. */
export function MarcoSeguimiento({ children }: { children: ReactNode }) {
  return <main className="flex flex-col px-5 pt-5 pb-6 lg:px-10 lg:pt-8">{children}</main>;
}

export async function ContenidoSeguimiento({ modulo }: { modulo: Modulo | null }) {
  // La identidad sale de la sesión; el módulo solo elige entre los expedientes propios.
  const usuario = await obtenerUsuarioActual();
  const seguimiento = await obtenerSeguimientoDelEstudiante(usuario.id);
  return <SeguimientoDeModulo seguimiento={seguimiento} modulo={modulo} ahora={new Date()} />;
}

export function CargandoSeguimiento() {
  return (
    <div aria-busy="true" aria-label="Cargando el seguimiento" className="mx-auto flex w-full max-w-lg animate-pulse flex-col gap-4">
      <div className="h-11 w-40 rounded-xl bg-line" />
      <div className="h-[52px] rounded-[14px] bg-line" />
      <div className="h-48 rounded-[22px] bg-line" />
    </div>
  );
}
