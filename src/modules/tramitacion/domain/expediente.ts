import { ESTADO_INICIAL, type CodigoEstado, type Modulo } from "./catalogo";
import type { ExpedienteCambioDeEstado } from "./eventos";
import type { Actor, RegistroHistorial } from "./historial";
import { validarTransicion, type ErrorTransicion } from "./reglas";
import { exito, type Resultado } from "./resultado";

/** Un expediente por par (estudiante, módulo). */
export type Expediente = {
  id: string;
  estudianteId: string;
  modulo: Modulo;
  estado: CodigoEstado;
  historial: readonly RegistroHistorial[];
};

type DatosExpediente = Pick<Expediente, "id" | "estudianteId" | "modulo">;

/** Lo que pide quien registra el cambio. Actor y fecha los pone el servidor. */
export type CambioSolicitado = {
  hacia: CodigoEstado;
  actor: Actor;
  fecha: Date;
  motivo?: string;
};

export type CambioRegistrado = {
  expediente: Expediente;
  evento: ExpedienteCambioDeEstado;
};

/**
 * Único punto donde se crea un registro del historial. No modifica nada:
 * devuelve un expediente nuevo con la fila añadida al final.
 */
function registrar(
  datos: DatosExpediente,
  desde: CodigoEstado | null,
  historialPrevio: readonly RegistroHistorial[],
  { hacia, actor, fecha, motivo }: CambioSolicitado,
): Resultado<CambioRegistrado, ErrorTransicion> {
  const validacion = validarTransicion({ desde, hacia, dependencia: actor.dependencia, motivo });
  if (!validacion.ok) return validacion;

  const registro: RegistroHistorial = {
    estadoAnterior: desde,
    estadoNuevo: hacia,
    actor,
    motivo: validacion.valor.motivo,
    fecha,
  };

  return exito({
    expediente: { ...datos, estado: hacia, historial: [...historialPrevio, registro] },
    evento: {
      tipo: "ExpedienteCambioDeEstado",
      expedienteId: datos.id,
      estudianteId: datos.estudianteId,
      modulo: datos.modulo,
      registro,
    },
  });
}

/** Crea el expediente cuando Mesa de Partes recibe la carpeta física. */
export function abrirExpediente(
  datos: DatosExpediente,
  cambio: Omit<CambioSolicitado, "hacia">,
): Resultado<CambioRegistrado, ErrorTransicion> {
  return registrar(datos, null, [], { ...cambio, hacia: ESTADO_INICIAL });
}

export function aplicarCambioEstado(
  expediente: Expediente,
  cambio: CambioSolicitado,
): Resultado<CambioRegistrado, ErrorTransicion> {
  const { id, estudianteId, modulo, estado, historial } = expediente;
  return registrar({ id, estudianteId, modulo }, estado, historial, cambio);
}
