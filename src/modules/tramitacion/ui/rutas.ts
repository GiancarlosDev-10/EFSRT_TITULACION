import type { Modulo } from "../domain";

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
