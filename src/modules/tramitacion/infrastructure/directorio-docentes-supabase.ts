import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared";
import type { DirectorioDocentes } from "../application";

/**
 * Docentes del personal, leídos con `docentes()`: solo la dependencia que
 * asigna al docente recibe filas (`personal` no se lee por la API).
 */
export function crearDirectorioDocentesSupabase(cliente: SupabaseClient<Database>): DirectorioDocentes {
  return {
    async listar() {
      const { data, error } = await cliente.rpc("docentes");
      if (error) throw new Error(`Supabase: ${error.message} (${error.code})`);
      return data.map((d) => ({ id: d.id, nombre: d.nombre, activo: d.activo, enSupervision: d.en_supervision }));
    },
  };
}
