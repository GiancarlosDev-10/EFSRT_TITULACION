import { Suspense } from "react";
import { obtenerUsuarioActual } from "@/modules/auth";
import {
  AvisosDeObservacion,
  SeguimientoEscritorio,
  SeguimientoMovil,
  obtenerSeguimientoDelEstudiante,
} from "@/modules/tramitacion";
import { Saludo } from "@/shared";

export const metadata = { title: "Mi seguimiento — EFSRT" };

export default function PaginaAlumno() {
  return (
    <main className="flex flex-col gap-5 px-5 pt-7 pb-6 lg:gap-6 lg:px-10 lg:pt-[52px] lg:pb-8">
      <Suspense fallback={<Cargando />}>
        <InicioAlumno />
      </Suspense>
    </main>
  );
}

async function InicioAlumno() {
  // La identidad sale de la sesión, nunca de la URL (punto 7 de seguridad).
  const usuario = await obtenerUsuarioActual();
  const seguimiento = await obtenerSeguimientoDelEstudiante(usuario.id);
  const ahora = new Date();

  return (
    <>
      <Saludo
        nombre={usuario.nombre}
        correo={usuario.correo}
        subtitulo="Sigue el recorrido de tus expedientes de EFSRT por las oficinas del instituto."
      />
      <AvisosDeObservacion seguimiento={seguimiento} ahora={ahora} />
      <SeguimientoMovil seguimiento={seguimiento} ahora={ahora} />
      <SeguimientoEscritorio seguimiento={seguimiento} ahora={ahora} />
    </>
  );
}

function Cargando() {
  return (
    <div aria-busy="true" aria-label="Cargando tu seguimiento" className="flex animate-pulse flex-col gap-5">
      <div className="h-11 w-48 rounded-xl bg-line" />
      <div className="h-32 rounded-[20px] bg-line" />
      <div className="h-40 rounded-[20px] bg-line" />
    </div>
  );
}
