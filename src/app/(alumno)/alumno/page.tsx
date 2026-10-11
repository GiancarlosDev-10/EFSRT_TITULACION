import { Suspense } from "react";
import { SeguimientoEscritorio, SeguimientoMovil } from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina } from "@/shared";
import { SaludoEstudiante } from "./_componentes/SaludoEstudiante";
import { datosDelEstudiante } from "./_datos";

export const metadata = { title: "Mi seguimiento — EFSRT" };

export default function PaginaAlumno() {
  return (
    <MarcoPagina ancho="completo">
      <Suspense fallback={<CargandoPagina etiqueta="Cargando tu seguimiento" />}>
        <InicioAlumno />
      </Suspense>
    </MarcoPagina>
  );
}

/** Celular: resumen de los módulos. PC: panel del módulo predeterminado. */
async function InicioAlumno() {
  const { usuario, seguimiento, nombresModulo, ahora } = await datosDelEstudiante();
  const saludo = <SaludoEstudiante usuario={usuario} />;
  return (
    <>
      <SeguimientoMovil seguimiento={seguimiento} ahora={ahora} encabezado={saludo} nombresModulo={nombresModulo} />
      <SeguimientoEscritorio seguimiento={seguimiento} ahora={ahora} encabezado={saludo} modulo={null} />
    </>
  );
}
