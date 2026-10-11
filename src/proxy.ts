import { NextResponse } from "next/server";

// Next.js 16: "proxy" es el nuevo nombre de "middleware".
export function proxy() {
  // TODO(auth): control de acceso por rol.
  //   1. Leer la sesión (Google OAuth restringido a @iestpgildaballivian.edu.pe).
  //   2. Sin sesión → redirigir a /login.
  //   3. Obtener el rol y comparar con el prefijo de la ruta
  //      (/alumno, /mesa-partes, /coordinacion, /docente, /bienestar).
  //   4. Si la ruta no corresponde a su rol → redirigir a su propia ruta.
  // Es un chequeo optimista: la autorización real debe repetirse en el
  // servidor (casos de uso / RLS de Supabase), no solo aquí.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/alumno/:path*",
    "/mesa-partes/:path*",
    "/coordinacion/:path*",
    "/docente/:path*",
    "/bienestar/:path*",
  ],
};
