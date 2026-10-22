import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared";
import type { DirectorioEstudiantes } from "../application";

/** Con la sesión del usuario: el RLS solo le deja leer su propia fila. */
export function crearDirectorioSupabase(cliente: SupabaseClient<Database>): DirectorioEstudiantes {
  return {
    async buscarPorUsuario(usuarioId) {
      const { data, error } = await cliente
        .from("estudiantes")
        .select("id, nombres, apellidos, carrera")
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      if (error) throw new Error(`Supabase: ${error.message} (${error.code})`);
      return data && { id: data.id, nombre: `${data.nombres} ${data.apellidos}`, carrera: data.carrera };
    },
  };
}
