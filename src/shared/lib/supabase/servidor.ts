// Cliente de Supabase para el servidor, con la sesión del usuario leída de las
// cookies: el RLS ve a quien hace la petición. Usa la clave PÚBLICA a propósito;
// la clave secreta nunca se usa para atender peticiones de usuarios.
// No se exporta en shared/index.ts: ese archivo también lo importa el navegador.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./tipos-db";

export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll(nuevas) {
          try {
            for (const { name, value, options } of nuevas) almacen.set(name, value, options);
          } catch {
            // Desde un Server Component no se pueden escribir cookies; la sesión
            // la renueva el proxy (TODO(auth), Fase 7).
          }
        },
      },
    },
  );
}
