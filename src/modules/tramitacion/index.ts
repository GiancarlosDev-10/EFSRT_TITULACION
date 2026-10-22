// API pública del módulo tramitacion. Otros módulos solo importan desde aquí.
export * from "./domain";
export type {
  Bandeja,
  EstudianteEnBandeja,
  EstudianteRegistrado,
  ExpedienteDeOficina,
  FichaEstudiante,
  FilaBandeja,
  FilaEstudiante,
  MovimientoDeOficina,
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
export { MENSAJES_DE_ERROR, nombreCompleto } from "./application";
export {
  cambiarDocente,
  obtenerBandeja,
  obtenerEstudianteDeUsuario,
  obtenerExpedienteDeOficina,
  obtenerSeguimientoDelEstudiante,
  registrarCambioEstado,
  registrarRecepcion,
  suscribirseACambiosDeEstado,
} from "./infrastructure/contenedor";
export * from "./ui";
