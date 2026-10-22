// Capa 1 del control de acceso (D04): chequeo optimista, sin consultar la base.
// Next.js 16: "proxy" es el nuevo nombre de "middleware".
//
// Solo comprueba que haya una sesión válida y la renueva. El rol lo revisa cada
// página, Server Action y Route Handler con `exigirRol` (capa 2), y los datos
// los protege el RLS (capa 3). Ver D46.
import type { NextRequest } from "next/server";
import { actualizarSesion, redirigirConCookies } from "@/shared/lib/supabase/proxy";

export async function proxy(peticion: NextRequest) {
  const { respuesta, hayUsuario } = await actualizarSesion(peticion);
  if (hayUsuario) return respuesta;
  return redirigirConCookies(respuesta, new URL("/login", peticion.url));
}

// Rutas de cada perfil (RUTA_DE_ROL en modules/auth/roles.ts; una prueba
// comprueba que coincidan). No cubre /api: cada Route Handler se protege solo.
export const config = {
  matcher: [
    "/alumno/:path*",
    "/mesa-partes/:path*",
    "/coordinacion/:path*",
    "/docente/:path*",
    "/bienestar/:path*",
  ],
};
