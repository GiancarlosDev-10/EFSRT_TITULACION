// API pública del módulo tramitacion. Otros módulos solo importan desde aquí.
export * from "./domain";
export type {
  EtapaSeguimiento,
  ErrorTramitacion,
  EventoSeguimiento,
  ExpedienteSeguimiento,
  SeguimientoModulo,
  SituacionEtapa,
  SolicitudCambioEstado,
  SolicitudRecepcion,
} from "./application";
export { MENSAJES_DE_ERROR } from "./application";
export {
  obtenerSeguimientoDelEstudiante,
  registrarCambioEstado,
  registrarRecepcion,
  suscribirseACambiosDeEstado,
} from "./infrastructure/contenedor";
export { ESTUDIANTE_DE_PRUEBA } from "./infrastructure/datos-prueba";
export * from "./ui";
