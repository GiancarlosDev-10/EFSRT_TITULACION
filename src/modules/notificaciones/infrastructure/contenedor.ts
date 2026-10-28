// Raíz de composición del módulo en el servidor. "server-only": usa la clave
// secreta de Supabase y no debe llegar nunca al navegador.
import "server-only";
import { after, connection } from "next/server";
import { cache } from "react";
import { crearClienteServidor } from "@/shared/lib/supabase/servidor";
import { crearMarcarAvisosLeidos, crearObtenerCampana } from "../application/campana";
import { crearBandejaEntradaSupabase } from "./bandeja-entrada-supabase";
import { crearEnvioDeAvisos } from "./composicion";

let enviar: ReturnType<typeof crearEnvioDeAvisos> | null = null;

/** Envía los avisos pendientes de la bandeja de salida (también los fallidos que aún se pueden reintentar). */
export async function enviarAvisosPendientes() {
  enviar ??= crearEnvioDeAvisos();
  return enviar();
}

/**
 * Escucha los cambios de estado y de docente. No necesita los datos del evento:
 * el aviso ya está en la bandeja (lo creó la base junto con el cambio). El correo
 * sale después de responder a la oficina, para que nadie espere al servidor
 * de correo.
 */
export function avisarAlEstudiante(): void {
  after(async () => {
    try {
      const { fallidos } = await enviarAvisosPendientes();
      if (fallidos > 0) console.error(`[notificaciones] ${fallidos} aviso(s) no se enviaron; quedan para reintentar.`);
    } catch (error) {
      console.error("[notificaciones] No se pudo procesar la bandeja de salida:", error);
    }
  });
}

// ---- Campana (D58) ------------------------------------------------------------
// Con la sesión de quien pide (clave pública): el RLS decide qué avisos son suyos.

// `connection()`, como en `obtenerSesion` (modules/auth): el cliente de Supabase
// usa la hora (vencimiento del token) y Next.js no permite leerla en un prerender.
const bandejaDeEntrada = cache(async () => {
  await connection();
  return crearBandejaEntradaSupabase(await crearClienteServidor());
});

/** Avisos de la campana de quien tiene la sesión (cache: una consulta por petición). */
export const obtenerCampana = cache(async () => crearObtenerCampana({ bandeja: await bandejaDeEntrada() })());

/** Marca como leídos los avisos propios hasta `hastaId`; `false` si el dato no es válido. */
export async function marcarAvisosLeidos(hastaId: unknown) {
  return crearMarcarAvisosLeidos({ bandeja: await bandejaDeEntrada() })(hastaId);
}
