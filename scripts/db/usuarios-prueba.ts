// Usuarios ficticios del proyecto de desarrollo: uno por perfil, más un
// estudiante y un docente "ajenos" para probar que nadie ve lo de otro.
// Entran con contraseña (CLAVE_USUARIOS_PRUEBA en .env) solo en las pruebas;
// el ingreso real será con Google o enlace al correo (Fase 7).
import type { Rol } from "../../src/modules/auth/sesion";

export type UsuarioPrueba = { correo: string; nombre: string; rol: Rol };

export const USUARIOS_PRUEBA = {
  estudiante: { correo: "estudiante@efsrt.test", nombre: "Giancarlos Ormeño", rol: "estudiante" },
  estudianteAjeno: { correo: "estudiante-ajeno@efsrt.test", nombre: "Valeria Chávez Rojas", rol: "estudiante" },
  mesaPartes: { correo: "mesa-partes@efsrt.test", nombre: "A. Quispe", rol: "mesa-partes" },
  coordinacion: { correo: "coordinacion@efsrt.test", nombre: "Lic. M. Torres", rol: "coordinacion" },
  docente: { correo: "docente@efsrt.test", nombre: "Mg. R. Paredes", rol: "docente" },
  docenteAjeno: { correo: "docente-ajeno@efsrt.test", nombre: "Mg. L. Vargas", rol: "docente" },
  bienestar: { correo: "bienestar@efsrt.test", nombre: "Lic. P. Salazar", rol: "bienestar" },
} as const satisfies Record<string, UsuarioPrueba>;

export type ClaveUsuarioPrueba = keyof typeof USUARIOS_PRUEBA;

export function claveUsuariosPrueba(): string {
  const clave = process.env.CLAVE_USUARIOS_PRUEBA;
  if (!clave) throw new Error("Falta CLAVE_USUARIOS_PRUEBA en .env");
  return clave;
}
