import { Suspense } from "react";
import { obtenerUsuarioActual } from "@/modules/auth";
import {
  SeguimientoEscritorio,
  SeguimientoMovil,
  esModulo,
  obtenerSeguimientoDelEstudiante,
} from "@/modules/tramitacion";
import { Saludo } from "@/shared";

export const metadata = { title: "Mi seguimiento — EFSRT" };

export default function PaginaAlumno({ searchParams }: PageProps<"/alumno">) {
  return (
    <main className="flex flex-col gap-5 px-5 pt-6 pb-6 lg:gap-6 lg:px-10 lg:pt-8 lg:pb-8">
      <Suspense fallback={<Cargando />}>
        <InicioAlumno searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function InicioAlumno({ searchParams }: Pick<PageProps<"/alumno">, "searchParams">) {
  // La identidad sale de la sesión, nunca de la URL (punto 7 de seguridad).
  const usuario = await obtenerUsuarioActual();
  const seguimiento = await obtenerSeguimientoDelEstudiante(usuario.id);
  // El módulo elegido sí viene de la URL: solo decide qué expediente propio se muestra.
  const { modulo } = await searchParams;
  const ahora = new Date();

  const saludo = (
    <Saludo
      nombre={usuario.nombre}
      correo={usuario.correo}
      subtitulo="Sigue el recorrido de tus expedientes de EFSRT por las oficinas del instituto."
    />
  );

  return (
    <>
      <SeguimientoMovil seguimiento={seguimiento} ahora={ahora} encabezado={saludo} />
      <SeguimientoEscritorio
        seguimiento={seguimiento}
        ahora={ahora}
        encabezado={saludo}
        modulo={esModulo(modulo) ? modulo : null}
      />
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
