// Usuarios ficticios del proyecto de desarrollo: uno por perfil, más un
// estudiante y un docente "ajenos" para probar que nadie ve lo de otro.
// Entran con contraseña (CLAVE_USUARIOS_PRUEBA en .env) solo en las pruebas;
// la aplicación se usa con Google o enlace al correo (cuentas reales, abajo).
import type { Rol } from "../../src/modules/auth/roles";

export type UsuarioPrueba = { correo: string; nombre: string; rol: Rol; carrera?: string };

/** Carrera real de los datos del video (D18). */
export const CARRERA_REAL = "desarrollo-sistemas";

/**
 * Carrera ficticia de las pruebas automáticas: así la Coordinación de la
 * carrera real (tu cuenta, en el video) no ve los estudiantes que crea cada
 * `test:db`. Mesa de Partes y Bienestar ven todas las carreras (D50).
 */
export const CARRERA_DE_PRUEBAS = "pruebas-automaticas";

export const USUARIOS_PRUEBA = {
  estudiante: { correo: "estudiante@efsrt.test", nombre: "Giancarlos Ormeño", rol: "estudiante" },
  estudianteAjeno: { correo: "estudiante-ajeno@efsrt.test", nombre: "Valeria Chávez Rojas", rol: "estudiante" },
  mesaPartes: { correo: "mesa-partes@efsrt.test", nombre: "A. Quispe", rol: "mesa-partes" },
  coordinacion: { correo: "coordinacion@efsrt.test", nombre: "Lic. M. Torres", rol: "coordinacion", carrera: CARRERA_DE_PRUEBAS },
  // De otra carrera: no debe ver los expedientes de Desarrollo de Sistemas (D50).
  coordinacionAjena: { correo: "coordinacion-ajena@efsrt.test", nombre: "Lic. J. Ramos", rol: "coordinacion", carrera: "contabilidad" },
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

/**
 * Docentes que solo existen en `personal` (sin cuenta), para el contrato del
 * repositorio: cada `test:db` les asigna expedientes nuevos sin tocar lo que
 * ven los usuarios de las pruebas de seguridad.
 */
export const DOCENTES_CONTRATO = [
  { correo: "docente-contrato-1@efsrt.test", nombre: "Mg. Contrato Uno" },
  { correo: "docente-contrato-2@efsrt.test", nombre: "Mg. Contrato Dos" },
] as const;

/**
 * Estudiantes de las pruebas automáticas, enlazados a los usuarios de prueba.
 * Son distintos de Giancarlos y Valeria (datos del video, enlazados a tus
 * cuentas reales) porque una cuenta solo puede enlazarse a un estudiante.
 */
export const ESTUDIANTES_PRUEBA = {
  // En la carrera real: también aparece en el video, junto a Giancarlos y Valeria.
  estudiante: { tipo_documento: "DNI", numero_documento: "70000091", nombres: "Estudiante", apellidos: "De Prueba", carrera: CARRERA_REAL },
  estudianteAjeno: {
    tipo_documento: "CE",
    numero_documento: "009000091",
    nombres: "Estudiante",
    apellidos: "Ajena De Prueba",
    carrera: CARRERA_DE_PRUEBAS,
  },
} as const;

/**
 * Cuentas reales para probar a mano y grabar el video (D48). Se leen del .env
 * para no guardar correos personales en el repositorio. Las vacías se omiten.
 */
export const CUENTAS_REALES = {
  estudiante: process.env.CUENTA_ESTUDIANTE,
  egresada: process.env.CUENTA_EGRESADA,
  "mesa-partes": process.env.CUENTA_MESA_PARTES,
  coordinacion: process.env.CUENTA_COORDINACION,
  docente: process.env.CUENTA_DOCENTE,
  bienestar: process.env.CUENTA_BIENESTAR,
} as const;
