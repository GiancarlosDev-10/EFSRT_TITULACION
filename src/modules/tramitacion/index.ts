// API pública del módulo tramitacion. Otros módulos solo importan desde aquí.
export * from "./domain";
export type {
  EstudianteRegistrado,
  EtapaSeguimiento,
  ErrorTramitacion,
  EventoSeguimiento,
  ExpedienteSeguimiento,
  SeguimientoModulo,
  SituacionEtapa,
  SolicitudCambioDocente,
  SolicitudCambioEstado,
  SolicitudRecepcion,
} from "./application";
export { MENSAJES_DE_ERROR } from "./application";
export {
  cambiarDocente,
  obtenerEstudianteDeUsuario,
  obtenerSeguimientoDelEstudiante,
  registrarCambioEstado,
  registrarRecepcion,
  suscribirseACambiosDeEstado,
} from "./infrastructure/contenedor";
export * from "./ui";
