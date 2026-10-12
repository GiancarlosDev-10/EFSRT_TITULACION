// Clientes de Supabase para las pruebas de integración contra el proyecto de
// desarrollo. Solo corren con `bun run test:db` (PRUEBAS_SUPABASE=1); con
// `bun test` se omiten y no tocan la red.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/shared/lib/supabase/tipos-db";
import { USUARIOS_PRUEBA, claveUsuariosPrueba, type ClaveUsuarioPrueba } from "./usuarios-prueba";

export const PRUEBAS_SUPABASE = process.env.PRUEBAS_SUPABASE === "1";

export type Cliente = SupabaseClient<Database>;

function variable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env`);
  return valor;
}

const sinSesionGuardada = { auth: { persistSession: false, autoRefreshToken: false } };

/** Sin sesión: como cualquier persona desde internet con la clave pública. */
export function clienteAnonimo(): Cliente {
  return createClient<Database>(variable("NEXT_PUBLIC_SUPABASE_URL"), variable("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), sinSesionGuardada);
}

/** Clave secreta: se salta el RLS. Solo para preparar datos y probar los triggers. */
export function clienteAdmin(): Cliente {
  return createClient<Database>(variable("NEXT_PUBLIC_SUPABASE_URL"), variable("SUPABASE_SECRET_KEY"), sinSesionGuardada);
}

const sesiones = new Map<ClaveUsuarioPrueba, Promise<Cliente>>();

/** Cliente con la sesión de un usuario de prueba (clave pública + su token): aplica el RLS. */
export function clienteComo(usuario: ClaveUsuarioPrueba): Promise<Cliente> {
  let sesion = sesiones.get(usuario);
  if (!sesion) {
    sesion = (async () => {
      const cliente = clienteAnonimo();
      const { error } = await cliente.auth.signInWithPassword({
        email: USUARIOS_PRUEBA[usuario].correo,
        password: claveUsuariosPrueba(),
      });
      if (error) throw new Error(`No se pudo iniciar sesión como ${usuario}: ${error.message}. ¿Corriste bun run db:sembrar?`);
      return cliente;
    })();
    sesiones.set(usuario, sesion);
  }
  return sesion;
}
