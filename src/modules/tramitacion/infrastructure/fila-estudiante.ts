import { TIPOS_DOCUMENTO, type TipoDocumento } from "../domain";
import type { FichaEstudiante } from "../application";

/** Columnas de `estudiantes` que leen las oficinas. */
export const COLUMNAS_ESTUDIANTE =
  "id, nombres, apellidos, tipo_documento, numero_documento, carrera, correo_institucional, correo_personal" as const;

export type FilaEstudiante = {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  carrera: string;
  correo_institucional: string | null;
  correo_personal: string | null;
};

// Si la base y el dominio no coinciden, mejor fallar que mostrar datos a medias.
function tipoDocumento(valor: string): TipoDocumento {
  const tipo = TIPOS_DOCUMENTO.find((t) => t === valor);
  if (!tipo) throw new Error(`Tipo de documento desconocido en la base: ${valor}`);
  return tipo;
}

export function aFicha(fila: FilaEstudiante): FichaEstudiante {
  return {
    id: fila.id,
    nombres: fila.nombres,
    apellidos: fila.apellidos,
    tipoDocumento: tipoDocumento(fila.tipo_documento),
    numeroDocumento: fila.numero_documento,
    carrera: fila.carrera,
    correoInstitucional: fila.correo_institucional,
    correoPersonal: fila.correo_personal,
  };
}
