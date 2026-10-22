import {
  aplicarCambioEstado,
  exigeDocente,
  exito,
  fallo,
  type Actor,
  type CodigoEstado,
  type DocenteAsignado,
  type Expediente,
  type Resultado,
} from "../domain";
import type { ErrorTramitacion } from "./mensajes";
import { buscarDocenteActivo, type DependenciasTramitacion } from "./puertos";

export type SolicitudCambioEstado = {
  /** Lo pone el servidor desde la sesión, nunca el cliente. */
  actor: Actor;
  expedienteId: string;
  hacia: CodigoEstado;
  /**
   * Estado que la oficina vio en pantalla. Si ya no es el actual, otra persona
   * lo cambió mientras tanto: CONFLICTO_DE_ESTADO en vez de un error confuso.
   */
  desde?: CodigoEstado;
  motivo?: string;
  /** Docente elegido al asignar (06). El nombre se toma del directorio, no del navegador. */
  docenteId?: string;
};

/**
 * Una oficina registra un cambio de estado. El evento se publica solo después
 * de guardar: si algo falla, el estudiante no recibe un aviso falso.
 */
export function crearRegistrarCambioEstado({
  repositorio,
  docentes,
  publicador,
  reloj,
}: Omit<DependenciasTramitacion, "ids">) {
  return async function registrarCambioEstado({
    actor,
    expedienteId,
    hacia,
    desde,
    motivo,
    docenteId,
  }: SolicitudCambioEstado): Promise<Resultado<Expediente, ErrorTramitacion>> {
    const expediente = await repositorio.buscarPorId(expedienteId);
    if (!expediente) return fallo("EXPEDIENTE_NO_ENCONTRADO");
    if (desde !== undefined && desde !== expediente.estado) return fallo("CONFLICTO_DE_ESTADO");

    let docente: DocenteAsignado | undefined;
    if (exigeDocente(hacia) && docenteId) {
      docente = (await buscarDocenteActivo(docentes, docenteId)) ?? undefined;
      if (!docente) return fallo("DOCENTE_NO_VALIDO");
    }

    const cambio = aplicarCambioEstado(expediente, { hacia, actor, fecha: reloj.ahora(), motivo, docente });
    if (!cambio.ok) return cambio;

    const guardado = await repositorio.registrarCambio(expedienteId, cambio.valor.evento.registro);
    if (!guardado.ok) return guardado;

    await publicador.publicar(cambio.valor.evento);
    return exito(cambio.valor.expediente);
  };
}
