"use server";
// Server Actions de la campana (D58). Son endpoints públicos (CLAUDE.md,
// Seguridad): cada una exige sesión. El destinatario nunca viene del
// navegador: el RLS decide qué avisos son de quien pide, y `hastaId` se valida
// en el caso de uso (entero positivo) y la base solo marca los propios.
import { obtenerUsuarioActual } from "@/modules/auth";
import { marcarAvisosLeidos, obtenerCampana, type LecturaCampana } from "@/modules/notificaciones";

/** Los avisos de la sesión, para refrescar la campana al navegar; `null` sin sesión. */
export async function leerCampana(): Promise<LecturaCampana | null> {
  if (!(await obtenerUsuarioActual())) return null;
  return { campana: await obtenerCampana(), ahora: new Date() };
}

/** Al abrir la campana: marca como leídos los propios hasta el último que se vio. */
export async function marcarCampanaLeida(hastaId: unknown): Promise<boolean> {
  if (!(await obtenerUsuarioActual())) return false;
  return marcarAvisosLeidos(hastaId);
}
