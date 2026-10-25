// Alta de un estudiante en su primera carpeta (solo Mesa de Partes). Al
// guardar, sigue con la elección del módulo (paso 2 de la recepción).
import { Suspense } from "react";
import { exigirRol } from "@/modules/auth";
import { FormularioEstudianteNuevo, PasosRecepcion, carrerasRegistradas } from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina } from "@/shared";
import { registrarEstudianteDeOficina } from "./acciones";
import { Encabezado } from "./PaginaRecepcion";

export function PaginaEstudianteNuevo() {
  return (
    <MarcoPagina>
      <Suspense fallback={<CargandoPagina etiqueta="Verificando tu acceso" />}>
        <Contenido />
      </Suspense>
    </MarcoPagina>
  );
}

async function Contenido() {
  await exigirRol("mesa-partes");
  return (
    <>
      <Encabezado />
      <PasosRecepcion actual={1} />
      <section className="rounded-2xl border border-line bg-white">
        <FormularioEstudianteNuevo carreras={carrerasRegistradas()} accion={registrarEstudianteDeOficina} />
      </section>
    </>
  );
}
