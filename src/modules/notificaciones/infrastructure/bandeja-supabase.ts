import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/tipos-db";
import type { BandejaDeSalida } from "../application/puertos";
import { datosDelAviso } from "./datos-del-aviso";

/**
 * Bandeja de salida en Supabase. Usa la clave secreta: el RLS no deja a
 * ningún usuario tocar los avisos (D55). Nunca recibe datos del navegador.
 */
export function crearBandejaSupabase(cliente: SupabaseClient<Database>, sitio: string): BandejaDeSalida {
  async function actualizar(id: number, cambios: Database["public"]["Tables"]["notificaciones"]["Update"]) {
    const { error } = await cliente
      .from("notificaciones")
      .update({ ...cambios, actualizado_en: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`notificaciones ${id}: ${error.message}`);
  }

  return {
    async reclamar(limite) {
      const { data, error } = await cliente.rpc("reclamar_notificaciones", { p_limite: limite });
      if (error) throw new Error(`reclamar_notificaciones: ${error.message}`);
      return (data ?? []).map((fila) => ({ id: fila.id, para: fila.destinatarios, datos: datosDelAviso(fila, sitio) }));
    },
    marcarEnviado: (id) => actualizar(id, { envio: "enviado", enviado_en: new Date().toISOString(), ultimo_error: null }),
    marcarFallido: (id, error) => actualizar(id, { envio: "fallido", ultimo_error: error }),
  };
}
