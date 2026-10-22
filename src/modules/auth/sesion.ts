// Capa 2 del control de acceso (D04, D46): identidad y rol de la petición,
// leídos en el servidor. Las páginas, Server Actions y Route Handlers obtienen
// la identidad SOLO por aquí, nunca de la URL ni de datos del navegador.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import type { Database } from "@/shared";
import { crearClienteServidor } from "@/shared/lib/supabase/servidor";
import { RUTA_DE_ROL, esRol, type Rol } from "./roles";

export type UsuarioActual = {
  /** Id de la cuenta (auth.users). */
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
};

export type Sesion =
  | { estado: "sin-sesion" }
  /** Hay cuenta, pero no está habilitada (sin perfil o personal desactivado). */
  | { estado: "sin-perfil" }
  | { estado: "activa"; usuario: UsuarioActual };

export const RUTAS_AUTH = {
  ingreso: "/login",
  cuentaNoHabilitada: "/login?error=cuenta",
  enlaceVencido: "/login?error=enlace",
} as const;

/**
 * Lee la sesión con un cliente dado. getClaims() verifica la firma del token;
 * el perfil sale de la base (`mi_perfil`), nunca del token (D39).
 */
export async function leerSesion(cliente: SupabaseClient<Database>): Promise<Sesion> {
  const { data, error } = await cliente.auth.getClaims();
  if (error || !data?.claims.sub) return { estado: "sin-sesion" };

  const perfil = await cliente.rpc("mi_perfil");
  if (perfil.error) throw new Error(`Supabase: ${perfil.error.message} (${perfil.error.code})`);
  const [fila] = perfil.data;
  if (!fila || !esRol(fila.rol)) return { estado: "sin-perfil" };

  return {
    estado: "activa",
    usuario: { id: data.claims.sub, nombre: fila.nombre, correo: data.claims.email ?? "", rol: fila.rol },
  };
}

/**
 * Sesión de la petición actual (una sola consulta por render gracias a `cache`).
 * `connection()` la marca como dato de la petición: getClaims() usa la hora
 * (vencimiento del token) y Next.js no permite leerla en un prerender.
 */
export const obtenerSesion = cache(async () => {
  await connection();
  return leerSesion(await crearClienteServidor());
});

/** Usuario de la petición, o `null` si no hay sesión habilitada. */
export async function obtenerUsuarioActual(): Promise<UsuarioActual | null> {
  const sesion = await obtenerSesion();
  return sesion.estado === "activa" ? sesion.usuario : null;
}

/**
 * Exige sesión con el rol indicado. Sin sesión → ingreso; cuenta no habilitada
 * → aviso en el ingreso; otro rol → su propia ruta. Llamarla en cada página,
 * Server Action y Route Handler: el layout no basta (no se vuelve a ejecutar al
 * navegar entre páginas de la misma sección).
 */
export async function exigirRol(rol: Rol): Promise<UsuarioActual> {
  const sesion = await obtenerSesion();
  if (sesion.estado === "sin-sesion") redirect(RUTAS_AUTH.ingreso);
  if (sesion.estado === "sin-perfil") redirect(RUTAS_AUTH.cuentaNoHabilitada);
  if (sesion.usuario.rol !== rol) redirect(RUTA_DE_ROL[sesion.usuario.rol]);
  return sesion.usuario;
}
