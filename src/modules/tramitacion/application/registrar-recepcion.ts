import { abrirExpediente, exito, type Actor, type Expediente, type Modulo, type Resultado } from "../domain";
import type { ErrorTramitacion } from "./mensajes";
import type { DependenciasTramitacion } from "./puertos";

export type SolicitudRecepcion = {
  /** Lo pone el servidor desde la sesión, nunca el cliente. */
  actor: Actor;
  estudianteId: string;
  modulo: Modulo;
  nota?: string;
};

/** Mesa de Partes recibe la carpeta física: nace el expediente en 01. */
export function crearRegistrarRecepcion({
  repositorio,
  publicador,
  reloj,
  ids,
}: DependenciasTramitacion) {
  return async function registrarRecepcion({
    actor,
    estudianteId,
    modulo,
    nota,
  }: SolicitudRecepcion): Promise<Resultado<Expediente, ErrorTramitacion>> {
    const apertura = abrirExpediente(
      { id: ids.nuevoId(), estudianteId, modulo },
      { actor, fecha: reloj.ahora(), motivo: nota },
    );
    if (!apertura.ok) return apertura;

    const guardado = await repositorio.crear(apertura.valor.expediente);
    if (!guardado.ok) return guardado;

    await publicador.publicar(apertura.valor.evento);
    return exito(apertura.valor.expediente);
  };
}
