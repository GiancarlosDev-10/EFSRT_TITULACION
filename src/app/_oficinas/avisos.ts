// Composición entre módulos: `notificaciones` escucha los cambios de estado que
// emite `tramitacion` (CLAUDE.md, Arquitectura, regla 4). Ningún módulo conoce
// al otro; solo este archivo los une. Lo importan las Server Actions.
import "server-only";
import { avisarAlEstudiante } from "@/modules/notificaciones";
import { suscribirseACambiosDeEstado } from "@/modules/tramitacion";

// Una sola suscripción por proceso: si el archivo se vuelve a cargar (recarga
// en desarrollo), se quita la anterior antes de suscribirse otra vez.
const CLAVE = Symbol.for("efsrt.notificaciones.suscripcion");
const global = globalThis as { [CLAVE]?: () => void };
global[CLAVE]?.();
global[CLAVE] = suscribirseACambiosDeEstado(avisarAlEstudiante);
