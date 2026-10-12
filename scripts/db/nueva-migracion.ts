// Crea una migración vacía con la convención de nombres (D43).
// Uso: bun run db:nueva tramitacion_agregar_docente_asignado
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARPETA_MIGRACIONES, siguienteMigracion } from "./nombre-migracion";

const nombre = process.argv[2];
if (!nombre) {
  console.error("Uso: bun run db:nueva <modulo>_<verbo>_<que>");
  process.exit(1);
}

const archivo = siguienteMigracion(nombre);
writeFileSync(join(CARPETA_MIGRACIONES, archivo), `-- ${nombre.replaceAll("_", " ")}\n`);
console.log(`Migración creada: supabase/migrations/${archivo}`);
