import { cambiarDocente as aplicarCambioDocente, exito, fallo, type Actor, type Expediente, type Resultado } from "../domain";
import type { ErrorTramitacion } from "./mensajes";
import { buscarDocenteActivo, type DependenciasTramitacion } from "./puertos";

export type SolicitudCambioDocente = {
  /** Lo pone el servidor desde la sesión, nunca el cliente. */
  actor: Actor;
  expedienteId: string;
  docenteId: string;
  motivo?: string;
};

/** Coordinación cambia al Docente Supervisor de un expediente en supervisión (p. ej. renunció). */
export function crearCambiarDocente({
  repositorio,
  docentes,
  reloj,
}: Pick<DependenciasTramitacion, "repositorio" | "docentes" | "reloj">) {
  return async function cambiarDocente({
    actor,
    expedienteId,
    docenteId,
    motivo,
  }: SolicitudCambioDocente): Promise<Resultado<Expediente, ErrorTramitacion>> {
    const expediente = await repositorio.buscarPorId(expedienteId);
    if (!expediente) return fallo("EXPEDIENTE_NO_ENCONTRADO");

    const docente = await buscarDocenteActivo(docentes, docenteId);
    if (!docente) return fallo("DOCENTE_NO_VALIDO");

    const cambio = aplicarCambioDocente(expediente, { docente, actor, fecha: reloj.ahora(), motivo });
    if (!cambio.ok) return cambio;

    const guardado = await repositorio.registrarCambioDocente(expedienteId, cambio.valor.cambio);
    if (!guardado.ok) return guardado;
    return exito(cambio.valor.expediente);
  };
}
