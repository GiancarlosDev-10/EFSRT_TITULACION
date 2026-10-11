// Datos ficticios compartidos por las pruebas del dominio. No se exporta en index.ts.
import type { Dependencia } from "./catalogo";
import type { Actor } from "./historial";

export const ACTORES = {
  "mesa-partes": { id: "act-mp", nombre: "Mesa de Partes", dependencia: "mesa-partes" },
  coordinacion: { id: "act-co", nombre: "Coordinación de Computación", dependencia: "coordinacion" },
  docente: { id: "act-do", nombre: "Mg. R. Paredes", dependencia: "docente" },
  bienestar: { id: "act-bi", nombre: "Bienestar y Empleabilidad", dependencia: "bienestar" },
} as const satisfies Record<Dependencia, Actor>;

export const DATOS_EXPEDIENTE = { id: "exp-1", estudianteId: "est-lucia", modulo: "II" } as const;

export const FECHA = new Date("2026-10-10T09:00:00-05:00");
