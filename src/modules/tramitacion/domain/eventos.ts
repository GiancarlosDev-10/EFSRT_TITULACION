import type { Modulo } from "./catalogo";
import type { RegistroHistorial } from "./historial";

/** Se emite en cada cambio de estado; `notificaciones` lo escucha para avisar al estudiante. */
export type ExpedienteCambioDeEstado = {
  tipo: "ExpedienteCambioDeEstado";
  expedienteId: string;
  estudianteId: string;
  modulo: Modulo;
  registro: RegistroHistorial;
};
