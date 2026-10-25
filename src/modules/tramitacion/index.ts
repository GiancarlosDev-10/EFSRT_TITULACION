// API pública del módulo tramitacion. Otros módulos solo importan desde aquí.
export * from "./domain";
export type {
  Bandeja,
  CandidatoRecepcion,
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
export {
  MENSAJES_ALTA_ESTUDIANTE,
  MENSAJES_DATOS_ESTUDIANTE,
  MENSAJES_DE_ERROR,
  nombreCompleto,
} from "./application";
export {
  buscarParaRecepcion,
  cambiarDocente,
  obtenerBandeja,
  obtenerCandidatoRecepcion,
  obtenerEstudianteDeUsuario,
  obtenerExpedienteDeOficina,
  obtenerSeguimientoDelEstudiante,
  registrarCambioEstado,
  registrarEstudiante,
  registrarRecepcion,
  suscribirseACambiosDeEstado,
} from "./infrastructure/contenedor";
export * from "./ui";
