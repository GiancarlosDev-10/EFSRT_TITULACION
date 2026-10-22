import { ESTADO_INICIAL, type CodigoEstado, type Modulo } from "./catalogo";
import type { ExpedienteCambioDeEstado } from "./eventos";
import type { Actor, CambioDocente, DocenteAsignado, RegistroHistorial } from "./historial";
import { exigeDocente, validarCambioDocente, validarTransicion, type ErrorCambioDocente, type ErrorTransicion } from "./reglas";
import { exito, type Resultado } from "./resultado";

/** Un expediente por par (estudiante, módulo). */
export type Expediente = {
  id: string;
  estudianteId: string;
  modulo: Modulo;
  estado: CodigoEstado;
  historial: readonly RegistroHistorial[];
  /** Docente Supervisor vigente: lo fija la asignación (06) y lo reemplaza cada cambio. */
  docente: DocenteAsignado | null;
  /** Cambios del Docente Supervisor, en orden. Vacío si nunca se cambió. */
  cambiosDocente: readonly CambioDocente[];
};

type DatosExpediente = Pick<Expediente, "id" | "estudianteId" | "modulo">;

/** Lo que pide quien registra el cambio. Actor y fecha los pone el servidor. */
export type CambioSolicitado = {
  hacia: CodigoEstado;
  actor: Actor;
  fecha: Date;
  motivo?: string;
  /** Obligatorio al asignar docente (ESTADO_ASIGNACION_DOCENTE); se ignora en los demás estados. */
  docente?: DocenteAsignado;
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
  expediente: Omit<Expediente, "estado">,
  desde: CodigoEstado | null,
  { hacia, actor, fecha, motivo, docente }: CambioSolicitado,
): Resultado<CambioRegistrado, ErrorTransicion> {
  const validacion = validarTransicion({ desde, hacia, dependencia: actor.dependencia, motivo, docente });
  if (!validacion.ok) return validacion;

  const asignado = exigeDocente(hacia) ? docente : undefined;
  const registro: RegistroHistorial = {
    estadoAnterior: desde,
    estadoNuevo: hacia,
    actor,
    motivo: validacion.valor.motivo,
    fecha,
    ...(asignado ? { docente: asignado } : {}),
  };

  return exito({
    expediente: {
      ...expediente,
      estado: hacia,
      historial: [...expediente.historial, registro],
      docente: asignado ?? expediente.docente,
    },
    evento: {
      tipo: "ExpedienteCambioDeEstado",
      expedienteId: expediente.id,
      estudianteId: expediente.estudianteId,
      modulo: expediente.modulo,
      registro,
    },
  });
}

/** Crea el expediente cuando Mesa de Partes recibe la carpeta física. */
export function abrirExpediente(
  datos: DatosExpediente,
  cambio: Omit<CambioSolicitado, "hacia" | "docente">,
): Resultado<CambioRegistrado, ErrorTransicion> {
  return registrar({ ...datos, historial: [], docente: null, cambiosDocente: [] }, null, { ...cambio, hacia: ESTADO_INICIAL });
}

export function aplicarCambioEstado(
  expediente: Expediente,
  cambio: CambioSolicitado,
): Resultado<CambioRegistrado, ErrorTransicion> {
  return registrar(expediente, expediente.estado, cambio);
}

export type CambioDocenteSolicitado = {
  docente: DocenteAsignado;
  actor: Actor;
  fecha: Date;
  motivo?: string;
};

export type DocenteCambiado = {
  expediente: Expediente;
  cambio: CambioDocente;
};

/** Coordinación cambia al Docente Supervisor (p. ej. renunció). El estado no cambia. */
export function cambiarDocente(
  expediente: Expediente,
  { docente, actor, fecha, motivo }: CambioDocenteSolicitado,
): Resultado<DocenteCambiado, ErrorCambioDocente> {
  const validacion = validarCambioDocente({
    estado: expediente.estado,
    dependencia: actor.dependencia,
    anterior: expediente.docente,
    nuevo: docente,
    motivo,
  });
  if (!validacion.ok) return validacion;

  const cambio: CambioDocente = { ...validacion.valor, nuevo: docente, actor, fecha };
  return exito({
    expediente: { ...expediente, docente, cambiosDocente: [...expediente.cambiosDocente, cambio] },
    cambio,
  });
}
