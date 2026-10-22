// Cliente de Supabase para src/proxy.ts. Renueva la sesión (el token dura una
// hora) y escribe las cookies nuevas tanto en la petición, para que las vean
// las páginas de esta misma petición, como en la respuesta, para el navegador.
// Las páginas no pueden escribir cookies: por eso la renovación ocurre aquí.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./tipos-db";

export async function actualizarSesion(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const cliente = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll(nuevas, encabezados) {
          for (const { name, value } of nuevas) peticion.cookies.set(name, value);
          respuesta = NextResponse.next({ request: peticion });
          for (const { name, value, options } of nuevas) respuesta.cookies.set(name, value, options);
          // Evita que una CDN guarde en caché una respuesta con la cookie de otra persona.
          for (const [clave, valor] of Object.entries(encabezados)) respuesta.headers.set(clave, valor);
        },
      },
    },
  );

  // getClaims() verifica la firma del token; getSession() solo leería la cookie.
  const { data } = await cliente.auth.getClaims();
  return { respuesta, hayUsuario: Boolean(data?.claims.sub) };
}

/** Redirige conservando las cookies que la renovación haya escrito. */
export function redirigirConCookies(origen: NextResponse, destino: URL) {
  const redireccion = NextResponse.redirect(destino);
  for (const cookie of origen.cookies.getAll()) redireccion.cookies.set(cookie);
  return redireccion;
}
