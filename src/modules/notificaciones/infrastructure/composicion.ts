// Arma el envío de avisos con sus adaptadores. Lo usan el servidor
// (contenedor.ts) y el comando de reintento (scripts/notificaciones).
// NOTIFICACIONES_ENVIO=gmail envía de verdad; cualquier otro valor, a la consola.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/tipos-db";
import { crearEnviarPendientes } from "../application/enviar-pendientes";
import { crearBandejaSupabase } from "./bandeja-supabase";
import { crearNotificadorConsola, crearNotificadorGmail } from "./notificadores";

function variable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env`);
  return valor;
}

export function crearEnvioDeAvisos() {
  const cliente = createClient<Database>(variable("NEXT_PUBLIC_SUPABASE_URL"), variable("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sitio = (process.env.URL_DEL_SITIO ?? "http://localhost:3000").replace(/\/+$/, "");
  const notificador =
    process.env.NOTIFICACIONES_ENVIO === "gmail"
      ? crearNotificadorGmail({ remitente: variable("CORREO_REMITENTE"), clave: variable("GMAIL_CLAVE_APLICACION") })
      : crearNotificadorConsola();
  return crearEnviarPendientes({ bandeja: crearBandejaSupabase(cliente, sitio), notificador });
}
