import {
  aplicarCambioEstado,
  exito,
  fallo,
  type Actor,
  type CodigoEstado,
  type Expediente,
  type Resultado,
} from "../domain";
import type { ErrorTramitacion } from "./mensajes";
import type { DependenciasTramitacion } from "./puertos";

export type SolicitudCambioEstado = {
  /** Lo pone el servidor desde la sesión, nunca el cliente. */
  actor: Actor;
  expedienteId: string;
  hacia: CodigoEstado;
  motivo?: string;
};

/**
 * Una oficina registra un cambio de estado. El evento se publica solo después
 * de guardar: si algo falla, el estudiante no recibe un aviso falso.
 */
export function crearRegistrarCambioEstado({
  repositorio,
  publicador,
  reloj,
}: Omit<DependenciasTramitacion, "ids">) {
  return async function registrarCambioEstado({
    actor,
    expedienteId,
    hacia,
    motivo,
  }: SolicitudCambioEstado): Promise<Resultado<Expediente, ErrorTramitacion>> {
    const expediente = await repositorio.buscarPorId(expedienteId);
    if (!expediente) return fallo("EXPEDIENTE_NO_ENCONTRADO");

    const cambio = aplicarCambioEstado(expediente, { hacia, actor, fecha: reloj.ahora(), motivo });
    if (!cambio.ok) return cambio;

    const guardado = await repositorio.registrarCambio(expedienteId, cambio.valor.evento.registro);
    if (!guardado.ok) return guardado;

    await publicador.publicar(cambio.valor.evento);
    return exito(cambio.valor.expediente);
  };
}
