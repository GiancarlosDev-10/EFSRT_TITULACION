import type { CodigoEstado, Dependencia } from "./catalogo";

/** Persona de una dependencia que registra un cambio. Lo provee el servidor desde la sesión, nunca el cliente. */
export type Actor = {
  id: string;
  nombre: string;
  dependencia: Dependencia;
};

/** Docente Supervisor con el nombre que tenía al registrarse (como el del actor). */
export type DocenteAsignado = {
  id: string;
  nombre: string;
};

/** Fila del historial. Es de solo añadidura: nunca se edita ni se borra. */
export type RegistroHistorial = {
  /** `null` en el registro con el que nace el expediente. */
  estadoAnterior: CodigoEstado | null;
  estadoNuevo: CodigoEstado;
  actor: Actor;
  /** Motivo en observaciones (obligatorio); nota opcional en los demás estados. */
  motivo: string | null;
  fecha: Date;
  /** Solo en el registro de asignación (ESTADO_ASIGNACION_DOCENTE): el docente elegido. */
  docente?: DocenteAsignado;
};

/**
 * Coordinación cambia al Docente Supervisor mientras la supervisión sigue en
 * curso (p. ej. porque renunció). No cambia el estado. También de solo añadidura.
 */
export type CambioDocente = {
  anterior: DocenteAsignado;
  nuevo: DocenteAsignado;
  motivo: string;
  actor: Actor;
  fecha: Date;
};
