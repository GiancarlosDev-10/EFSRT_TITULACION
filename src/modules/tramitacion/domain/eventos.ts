import type { Modulo } from "./catalogo";
import type { CambioDocente, RegistroHistorial } from "./historial";

/** Se emite en cada cambio de estado; `notificaciones` lo escucha para avisar al estudiante. */
export type ExpedienteCambioDeEstado = {
  tipo: "ExpedienteCambioDeEstado";
  expedienteId: string;
  estudianteId: string;
  modulo: Modulo;
  registro: RegistroHistorial;
};

/** Se emite cuando Coordinación cambia al Docente Supervisor (D53); el estudiante recibe un correo (D58). */
export type DocenteDelExpedienteCambiado = {
  tipo: "DocenteDelExpedienteCambiado";
  expedienteId: string;
  estudianteId: string;
  modulo: Modulo;
  cambio: CambioDocente;
};

/** Todo lo que `tramitacion` publica para otros módulos. */
export type EventoTramitacion = ExpedienteCambioDeEstado | DocenteDelExpedienteCambiado;
