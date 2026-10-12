// Convención de nombres de migraciones (D43):
//   AAAAMMDDNN_<modulo>_<verbo>_<que>.sql
// AAAAMMDD = fecha de Perú; NN = correlativo del día (01…99). Así se lee la fecha
// a simple vista y la CLI de Supabase las aplica siempre en orden.
// Las migraciones se crean con `bun run db:nueva <nombre>`, NO con
// `supabase migration new` (que usa un número de 14 dígitos).
import { readdirSync } from "node:fs";
import { join } from "node:path";

export const CARPETA_MIGRACIONES = join(import.meta.dir, "../../supabase/migrations");

/** "20261011" para la fecha actual en Lima. */
function fechaDePeru(ahora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(ahora).replaceAll("-", "");
}

/** Nombre del siguiente archivo de migración, p. ej. "2026101105_tramitacion_agregar_algo.sql". */
export function siguienteMigracion(nombre: string, ahora = new Date()): string {
  if (!/^[a-z0-9]+(_[a-z0-9]+)+$/.test(nombre)) {
    throw new Error(`Nombre inválido: "${nombre}". Usa <modulo>_<verbo>_<que>, en minúsculas, sin tildes ni ñ.`);
  }
  const fecha = fechaDePeru(ahora);
  const delDia = readdirSync(CARPETA_MIGRACIONES)
    .map((archivo) => archivo.match(new RegExp(`^${fecha}(\\d{2})_`))?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  const correlativo = Math.max(0, ...delDia) + 1;
  if (correlativo > 99) throw new Error(`Ya hay 99 migraciones con fecha ${fecha}.`);
  return `${fecha}${String(correlativo).padStart(2, "0")}_${nombre}.sql`;
}
