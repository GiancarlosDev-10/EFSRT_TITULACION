import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared";
import { exito, fallo } from "../domain";
import type { DirectorioEstudiantes } from "../application";
import { COLUMNAS_ESTUDIANTE, aFicha } from "./fila-estudiante";

const errorDeBase = (error: PostgrestError) => new Error(`Supabase: ${error.message} (${error.code})`);

/**
 * Con la sesión del usuario: el RLS decide qué estudiantes ve (el estudiante,
 * solo su fila; Coordinación, los de su carrera) y solo Mesa de Partes registra.
 */
export function crearDirectorioSupabase(cliente: SupabaseClient<Database>): DirectorioEstudiantes {
  return {
    async buscarPorUsuario(usuarioId) {
      const { data, error } = await cliente
        .from("estudiantes")
        .select("id, nombres, apellidos, carrera")
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      if (error) throw errorDeBase(error);
      return data && { id: data.id, nombre: `${data.nombres} ${data.apellidos}`, carrera: data.carrera };
    },

    async buscar(consulta) {
      const { data, error } = await cliente.rpc("buscar_estudiantes", { p_consulta: consulta });
      if (error) throw errorDeBase(error);
      return data.map(aFicha);
    },

    async buscarPorId(id) {
      const { data, error } = await cliente.from("estudiantes").select(COLUMNAS_ESTUDIANTE).eq("id", id).maybeSingle();
      if (error) throw errorDeBase(error);
      return data ? aFicha(data) : null;
    },

    async registrar(datos) {
      const { data, error } = await cliente
        .from("estudiantes")
        .insert({
          tipo_documento: datos.tipoDocumento,
          numero_documento: datos.numeroDocumento,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          carrera: datos.carrera,
          correo_institucional: datos.correoInstitucional,
          correo_personal: datos.correoPersonal,
        })
        .select(COLUMNAS_ESTUDIANTE)
        .single();
      if (!error) return exito(aFicha(data));
      // Restricciones UNIQUE de la tabla: documento, correo institucional, correo personal.
      if (error.code === "23505") {
        return fallo(error.message.includes("documento") ? "DOCUMENTO_YA_REGISTRADO" : "CORREO_YA_REGISTRADO");
      }
      throw errorDeBase(error);
    },
  };
}
