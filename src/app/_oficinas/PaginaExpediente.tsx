// Detalle de un expediente, común a las cuatro oficinas. El RLS decide si la
// sesión lo ve (p. ej. un docente solo ve los suyos): si no, "no encontrado".
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirRol } from "@/modules/auth";
import {
  DetalleExpedienteOficina,
  DocenteEnFicha,
  PanelAccion,
  esCodigoEstado,
  obtenerExpedienteDeOficina,
  opcionesDeAccion,
  type Dependencia,
} from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina, esUuid } from "@/shared";
import { cambiarDocenteDeOficina, registrarCambioDeOficina } from "./acciones";

type Props = {
  dependencia: Dependencia;
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function PaginaExpediente(props: Props) {
  return (
    <MarcoPagina ancho="extenso">
      <Suspense fallback={<CargandoPagina etiqueta="Verificando tu acceso" />}>
        <Contenido {...props} />
      </Suspense>
    </MarcoPagina>
  );
}

async function Contenido({ dependencia, params, searchParams }: Props) {
  await exigirRol(dependencia);
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const expediente = await obtenerExpedienteDeOficina(id, dependencia);
  if (!expediente) notFound();

  const { registrado, docente } = await searchParams;
  return (
    <DetalleExpedienteOficina
      expediente={expediente}
      dependencia={dependencia}
      ahora={new Date()}
      registrado={esCodigoEstado(registrado) ? registrado : null}
      docenteCambiado={docente === "cambiado"}
      cambioDocente={
        expediente.puedeCambiarDocente &&
        expediente.docente && (
          // `key`: al cambiar de docente, el diálogo se cierra y empieza de cero.
          <DocenteEnFicha
            key={expediente.docente.id}
            expedienteId={expediente.id}
            docente={expediente.docente}
            desactivado={expediente.docenteDesactivado}
            docentes={expediente.docentesDisponibles}
            accion={cambiarDocenteDeOficina}
          />
        )
      }
      panel={
        // `key`: al cambiar el estado, el formulario empieza de cero.
        <PanelAccion
          key={expediente.estado}
          expedienteId={expediente.id}
          estado={expediente.estado}
          opciones={opcionesDeAccion(expediente.estado, expediente.acciones, dependencia)}
          docentes={expediente.docentesDisponibles}
          nombreEstudiante={expediente.estudiante.nombres.split(" ")[0]}
          accion={registrarCambioDeOficina}
        />
      }
    />
  );
}
