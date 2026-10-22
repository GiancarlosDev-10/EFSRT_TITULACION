import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared";
import type { ConsultasDeOficina, ExpedienteConEstudiante, FichaEstudiante } from "../application";
import { aExpediente, consultaExpedientes, errorDeBase } from "./repositorio-supabase";

type FilaConEstudiante = Parameters<typeof aExpediente>[0] & {
  estudiante: {
    id: string;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    carrera: string;
    correo_institucional: string | null;
    correo_personal: string | null;
  } | null;
};

function aFicha(estudiante: NonNullable<FilaConEstudiante["estudiante"]>): FichaEstudiante {
  if (estudiante.tipo_documento !== "DNI" && estudiante.tipo_documento !== "CE") {
    throw new Error(`Tipo de documento desconocido en la base: ${estudiante.tipo_documento}`);
  }
  return {
    id: estudiante.id,
    nombres: estudiante.nombres,
    apellidos: estudiante.apellidos,
    tipoDocumento: estudiante.tipo_documento,
    numeroDocumento: estudiante.numero_documento,
    carrera: estudiante.carrera,
    correoInstitucional: estudiante.correo_institucional,
    correoPersonal: estudiante.correo_personal,
  };
}

// El RLS del estudiante deja ver sus datos a quien ve el expediente; si aun
// así llegara sin estudiante, el expediente se omite en vez de mostrarse a medias.
function aDato(fila: FilaConEstudiante): ExpedienteConEstudiante | null {
  return fila.estudiante ? { expediente: aExpediente(fila), estudiante: aFicha(fila.estudiante) } : null;
}

/** Con la sesión del usuario: la base decide qué expedientes ve cada oficina. */
export function crearConsultasSupabase(cliente: SupabaseClient<Database>): ConsultasDeOficina {
  return {
    async listarExpedientes() {
      const { data, error } = await consultaExpedientes(cliente);
      if (error) throw errorDeBase(error);
      return data.map(aDato).filter((dato) => dato !== null);
    },

    async buscarExpediente(id) {
      const { data, error } = await consultaExpedientes(cliente).eq("id", id).maybeSingle();
      if (error) throw errorDeBase(error);
      return data ? aDato(data) : null;
    },
  };
}
