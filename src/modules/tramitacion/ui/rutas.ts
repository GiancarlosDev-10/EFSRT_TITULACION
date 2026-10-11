import type { Modulo } from "../domain";

/** Rutas de la vista del estudiante, en un solo lugar. */
export const RUTAS_ALUMNO = {
  inicio: "/alumno",
  /** Inicio con un módulo elegido (en PC muestra su tracker y su mapa). */
  modulo: (modulo: Modulo) => `/alumno?modulo=${modulo}`,
  seguimientos: "/alumno/seguimiento",
  seguimiento: (modulo: Modulo) => `/alumno/seguimiento/${modulo}`,
  observacion: (expedienteId: string) => `/alumno/observacion/${expedienteId}`,
  constancias: "/alumno/constancia",
  constancia: (modulo: Modulo) => `/alumno/constancia/${modulo}`,
  requisitos: "/alumno/requisitos",
} as const;
