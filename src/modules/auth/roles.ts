// Roles y la ruta de inicio de cada uno (sin dependencias de servidor).

export type Rol = "estudiante" | "mesa-partes" | "coordinacion" | "docente" | "bienestar";

export const RUTA_DE_ROL: Record<Rol, string> = {
  estudiante: "/alumno",
  "mesa-partes": "/mesa-partes",
  coordinacion: "/coordinacion",
  docente: "/docente",
  bienestar: "/bienestar",
};

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && Object.hasOwn(RUTA_DE_ROL, valor);
}
