import "server-only";
import { connection } from "next/server";
import { ESTUDIANTE_DE_PRUEBA } from "@/modules/tramitacion";

export type Rol = "estudiante" | "mesa-partes" | "coordinacion" | "docente" | "bienestar";

export type UsuarioActual = {
  id: string;
  nombre: string;
  correo: string;
  /** Identificador de la carrera (los nombres de módulos se buscan con él). */
  carrera: string;
  rol: Rol;
};

/**
 * Usuario de la petición actual. Las páginas obtienen la identidad SOLO por
 * aquí, nunca de la URL ni del cliente.
 * TODO(auth): leer la sesión de Google OAuth (@iestpgildaballivian.edu.pe).
 * Mientras tanto devuelve a la estudiante de prueba.
 */
export async function obtenerUsuarioActual(): Promise<UsuarioActual> {
  await connection(); // la respuesta depende de cada petición (luego: la cookie de sesión)
  return { ...ESTUDIANTE_DE_PRUEBA, rol: "estudiante" };
}
