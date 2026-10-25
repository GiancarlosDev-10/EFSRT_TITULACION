// Raíz de composición del módulo en el servidor. "server-only": usa la clave
// secreta de Supabase y no debe llegar nunca al navegador.
import "server-only";
import { after } from "next/server";
import { crearEnvioDeAvisos } from "./composicion";

let enviar: ReturnType<typeof crearEnvioDeAvisos> | null = null;

/** Envía los avisos pendientes de la bandeja de salida (también los fallidos que aún se pueden reintentar). */
export async function enviarAvisosPendientes() {
  enviar ??= crearEnvioDeAvisos();
  return enviar();
}

/**
 * Escucha `ExpedienteCambioDeEstado`. No necesita los datos del evento: el
 * aviso ya está en la bandeja (lo creó la base junto con el cambio). El correo
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
