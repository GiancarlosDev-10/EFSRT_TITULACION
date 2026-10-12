import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared";
import {
  DEPENDENCIAS,
  ESTADOS,
  esModulo,
  exito,
  fallo,
  type CodigoEstado,
  type Dependencia,
  type Expediente,
} from "../domain";
import type { ErrorRepositorio, ExpedienteRepository } from "../application";

/**
 * Adaptador de Supabase. Recibe un cliente con la sesión del usuario: el RLS de
 * la base decide qué puede leer y escribir (capa 3 de seguridad, D04).
 * Las reglas del dominio ya se validaron antes en el caso de uso; si la base
 * rechaza algo que el dominio aceptó, es un error del sistema y se lanza.
 */
export function crearRepositorioSupabase(cliente: SupabaseClient<Database>): ExpedienteRepository {
  return {
    async buscarPorId(id) {
      const { data, error } = await consultaExpedientes(cliente).eq("id", id).maybeSingle();
      if (error) throw errorDeBase(error);
      return data ? aExpediente(data) : null;
    },

    async listarPorEstudiante(estudianteId) {
      const { data, error } = await consultaExpedientes(cliente).eq("estudiante_id", estudianteId);
      if (error) throw errorDeBase(error);
      return data.map(aExpediente);
    },

    async crear(expediente) {
      const [apertura] = expediente.historial;
      const { error } = await cliente.rpc("abrir_expediente", {
        p_id: expediente.id,
        p_estudiante_id: expediente.estudianteId,
        p_modulo: expediente.modulo,
        p_nota: apertura?.motivo ?? undefined,
      });
      if (!error) return exito(undefined);
      if (error.code === "23505") return fallo("EXPEDIENTE_YA_EXISTE");
      throw errorDeBase(error);
    },

    async registrarCambio(expedienteId, registro) {
      if (registro.estadoAnterior === null) throw new Error("registrarCambio no abre expedientes: usa crear()");
      const { error } = await cliente.rpc("registrar_cambio", {
        p_expediente_id: expedienteId,
        p_estado_anterior: registro.estadoAnterior,
        p_estado_nuevo: registro.estadoNuevo,
        p_motivo: registro.motivo ?? undefined,
      });
      if (!error) return exito(undefined);
      const conocido = errorConocido(error, ["EXPEDIENTE_NO_ENCONTRADO", "CONFLICTO_DE_ESTADO"]);
      if (conocido) return fallo(conocido);
      throw errorDeBase(error);
    },
  };
}

// Actor y fecha salen de las columnas que fijó el trigger, no de lo que envió el cliente.
function consultaExpedientes(cliente: SupabaseClient<Database>) {
  return cliente
    .from("expedientes")
    .select(
      "id, estudiante_id, modulo, estado, historial (id, estado_anterior, estado_nuevo, actor_id, actor_nombre, actor_dependencia, motivo, fecha)",
    )
    .order("id", { referencedTable: "historial", ascending: true });
}

type FilaExpediente = {
  id: string;
  estudiante_id: string;
  modulo: string;
  estado: string;
  historial: {
    estado_anterior: string | null;
    estado_nuevo: string;
    actor_id: string;
    actor_nombre: string;
    actor_dependencia: string;
    motivo: string | null;
    fecha: string;
  }[];
};

function aExpediente(fila: FilaExpediente): Expediente {
  if (!esModulo(fila.modulo)) throw new Error(`Módulo desconocido en la base: ${fila.modulo}`);
  return {
    id: fila.id,
    estudianteId: fila.estudiante_id,
    modulo: fila.modulo,
    estado: codigoEstado(fila.estado),
    historial: fila.historial.map((r) => ({
      estadoAnterior: r.estado_anterior === null ? null : codigoEstado(r.estado_anterior),
      estadoNuevo: codigoEstado(r.estado_nuevo),
      actor: { id: r.actor_id, nombre: r.actor_nombre, dependencia: dependencia(r.actor_dependencia) },
      motivo: r.motivo,
      fecha: new Date(r.fecha),
    })),
  };
}

// Si la base y catalogo.ts no coinciden, mejor fallar que mostrar datos a medias.
function codigoEstado(valor: string): CodigoEstado {
  if (!Object.hasOwn(ESTADOS, valor)) throw new Error(`Estado desconocido en la base: ${valor}`);
  return valor as CodigoEstado;
}

function dependencia(valor: string): Dependencia {
  if (!Object.hasOwn(DEPENDENCIAS, valor)) throw new Error(`Dependencia desconocida en la base: ${valor}`);
  return valor as Dependencia;
}

/** Los triggers lanzan el mismo código que usa el dominio como mensaje del error. */
function errorConocido<E extends ErrorRepositorio>(error: PostgrestError, esperados: readonly E[]): E | null {
  return esperados.find((codigo) => error.message === codigo) ?? null;
}

function errorDeBase(error: PostgrestError): Error {
  return new Error(`Supabase: ${error.message} (${error.code})`);
}
