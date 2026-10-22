"use server";
// Server Actions del ingreso. Son endpoints públicos: no reciben ningún dato que
// decida a dónde se vuelve ni quién es el usuario (eso sale de la sesión).
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/shared/lib/supabase/servidor";
import { RUTAS_AUTH } from "./sesion";
import { urlDeRetorno } from "./sitio";

/** "Continuar con Google": lleva a Google y vuelve a /auth/callback. */
export async function ingresarConGoogle() {
  const cliente = await crearClienteServidor();
  const { data, error } = await cliente.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: urlDeRetorno(),
      // Siempre deja elegir la cuenta (útil con varias cuentas de Google abiertas).
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    console.error("[auth] No se pudo iniciar el ingreso con Google:", error?.message);
    redirect(RUTAS_AUTH.cuentaNoHabilitada);
  }
  redirect(data.url);
}

export type EstadoEnlace =
  | { estado: "inicial" }
  | { estado: "invalido"; correo: string }
  | { estado: "enviado"; correo: string };

const LARGO_MAXIMO_CORREO = 254;
const FORMA_DE_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Enlace de acceso al correo (D36). La respuesta es la misma si el correo está
 * registrado o no, para no revelar qué correos existen: si no lo está, el hook
 * de la base rechaza crear la cuenta y no se envía nada.
 */
export async function enviarEnlace(_previo: EstadoEnlace, formulario: FormData): Promise<EstadoEnlace> {
  const correo = String(formulario.get("correo") ?? "").trim().toLowerCase();
  if (correo.length > LARGO_MAXIMO_CORREO || !FORMA_DE_CORREO.test(correo)) {
    return { estado: "invalido", correo: correo.slice(0, LARGO_MAXIMO_CORREO) };
  }

  const cliente = await crearClienteServidor();
  const { error } = await cliente.auth.signInWithOtp({
    email: correo,
    options: { emailRedirectTo: urlDeRetorno(), shouldCreateUser: true },
  });
  // Correo no habilitado, límite de envíos, etc.: solo queda en el registro del servidor.
  if (error) console.warn("[auth] Enlace no enviado:", error.code ?? error.message);
  return { estado: "enviado", correo };
}

export async function cerrarSesion() {
  const cliente = await crearClienteServidor();
  await cliente.auth.signOut();
  redirect(RUTAS_AUTH.ingreso);
}
