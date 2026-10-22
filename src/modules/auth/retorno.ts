// Retorno del login (/auth/callback): convierte lo que envía Supabase en una
// sesión y lleva a cada quien a la ruta de su rol.
import "server-only";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/shared/lib/supabase/servidor";
import { RUTA_DE_ROL } from "./roles";
import { RUTAS_AUTH, leerSesion } from "./sesion";
import { urlDelSitio } from "./sitio";

const TIPOS_DE_ENLACE: readonly EmailOtpType[] = ["email", "magiclink", "signup"];

function irA(ruta: string) {
  return NextResponse.redirect(new URL(ruta, urlDelSitio()));
}

export async function completarIngreso(peticion: NextRequest): Promise<NextResponse> {
  const parametros = peticion.nextUrl.searchParams;
  const codigo = parametros.get("code");
  const tokenHash = parametros.get("token_hash");
  const tipo = parametros.get("type") as EmailOtpType | null;
  const cliente = await crearClienteServidor();

  let error: unknown = null;
  if (codigo) {
    // Google y el enlace con la plantilla de correo por defecto (mismo navegador).
    ({ error } = await cliente.auth.exchangeCodeForSession(codigo));
  } else if (tokenHash && tipo && TIPOS_DE_ENLACE.includes(tipo)) {
    // Enlace con la plantilla propia: funciona aunque se abra en otro dispositivo.
    ({ error } = await cliente.auth.verifyOtp({ type: tipo, token_hash: tokenHash }));
  } else {
    // Sin código: Supabase devolvió un error, p. ej. el hook rechazó un correo no registrado.
    return irA(RUTAS_AUTH.cuentaNoHabilitada);
  }
  if (error) return irA(codigo ? RUTAS_AUTH.cuentaNoHabilitada : RUTAS_AUTH.enlaceVencido);

  // Mismo cliente: ya tiene la sesión recién creada.
  const sesion = await leerSesion(cliente);
  return irA(sesion.estado === "activa" ? RUTA_DE_ROL[sesion.usuario.rol] : RUTAS_AUTH.cuentaNoHabilitada);
}
