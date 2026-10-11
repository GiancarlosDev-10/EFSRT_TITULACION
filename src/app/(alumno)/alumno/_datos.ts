import { obtenerUsuarioActual } from "@/modules/auth";
import { nombresDeModulos, obtenerSeguimientoDelEstudiante } from "@/modules/tramitacion";

/**
 * Lo que necesitan todas las páginas del estudiante. La identidad sale de la
 * sesión, nunca de la URL: los parámetros de la URL solo eligen entre sus datos.
 */
export async function datosDelEstudiante() {
  const usuario = await obtenerUsuarioActual();
  const seguimiento = await obtenerSeguimientoDelEstudiante(usuario.id);
  return { usuario, seguimiento, nombresModulo: nombresDeModulos(usuario.carrera), ahora: new Date() };
}
