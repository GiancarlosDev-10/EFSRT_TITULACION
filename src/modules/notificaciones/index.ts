// API pública del módulo notificaciones. Otros módulos solo importan desde aquí.
export type { AvisoDeCampana, Campana } from "./application/campana";
export { avisarAlEstudiante, enviarAvisosPendientes, marcarAvisosLeidos, obtenerCampana } from "./infrastructure/contenedor";
export { CampanaNotificaciones, type LecturaCampana } from "./ui/CampanaNotificaciones";
