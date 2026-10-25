import type { Dependencia, Modulo } from "../domain";

/**
 * Rutas de la vista del estudiante, en un solo lugar. Cada módulo tiene una
 * sola dirección de seguimiento, que se adapta a celular y a PC.
 */
export const RUTAS_ALUMNO = {
  inicio: "/alumno",
  seguimientos: "/alumno/seguimiento",
  seguimiento: (modulo: Modulo) => `/alumno/seguimiento/${modulo}`,
  observacion: (expedienteId: string) => `/alumno/observacion/${expedienteId}`,
  constancia: (modulo: Modulo) => `/alumno/constancia/${modulo}`,
  requisitos: "/alumno/requisitos",
} as const;

/** Rutas de las pantallas de oficina: la bandeja de cada dependencia y el detalle de un expediente. */
export const RUTAS_OFICINA = {
  bandeja: (dependencia: Dependencia) => `/${dependencia}`,
  expediente: (dependencia: Dependencia, expedienteId: string) => `/${dependencia}/expediente/${expedienteId}`,
} as const;

/** Rutas de la recepción de carpetas (solo Mesa de Partes). */
export const RUTAS_RECEPCION = {
  buscar: "/mesa-partes/recepcion",
  modulo: (estudianteId: string) => `/mesa-partes/recepcion?estudiante=${estudianteId}`,
  estudianteNuevo: "/mesa-partes/recepcion/nuevo",
} as const;
