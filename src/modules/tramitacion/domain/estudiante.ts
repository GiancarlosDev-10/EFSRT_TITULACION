// Datos del estudiante que registra Mesa de Partes al recibir la primera
// carpeta (D36, D38). Mismas reglas que los CHECK de la tabla `estudiantes`:
// la base las repite como última barrera.
import { exito, fallo, type Resultado } from "./resultado";

export const TIPOS_DOCUMENTO = ["DNI", "CE"] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

/** Solo las cuentas de este dominio son institucionales. */
export const DOMINIO_INSTITUCIONAL = "@iestpgildaballivian.edu.pe";

export type DatosEstudiante = {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  /** Identificador de la carrera (D18). */
  carrera: string;
  correoInstitucional: string | null;
  /** Para egresados sin cuenta institucional (D36). */
  correoPersonal: string | null;
};

/** Lo que llega del formulario, sin validar. */
export type EntradaEstudiante = Record<keyof DatosEstudiante, string | undefined>;

export type ErrorCampoEstudiante =
  | "TIPO_DOCUMENTO_INVALIDO"
  | "DNI_INVALIDO"
  | "CE_INVALIDO"
  | "NOMBRES_REQUERIDOS"
  | "APELLIDOS_REQUERIDOS"
  | "NOMBRE_DEMASIADO_LARGO"
  | "CARRERA_INVALIDA"
  | "CORREO_INSTITUCIONAL_INVALIDO"
  | "CORREO_INVALIDO"
  | "CORREO_REQUERIDO";

/** Un error por campo, para marcar cada uno en el formulario. */
export type ErroresEstudiante = Partial<Record<keyof DatosEstudiante, ErrorCampoEstudiante>>;

const LARGO_MAXIMO_NOMBRE = 100;
const FORMA_DE_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const esTipoDocumento = (valor: unknown): valor is TipoDocumento => TIPOS_DOCUMENTO.some((tipo) => tipo === valor);

/** Espacios sobrantes fuera, como lo hace la base al guardar. */
const limpiarNombre = (texto = "") => texto.trim().replace(/\s+/g, " ");
/** Sin espacios, puntos ni guiones, en mayúsculas: "001-234 567" → "001234567". */
export const limpiarDocumento = (texto = "") => texto.replace(/[\s.-]/g, "").toUpperCase();
const limpiarCorreo = (texto = "") => texto.trim().toLowerCase() || null;

/**
 * Valida y normaliza los datos de un estudiante nuevo. Devuelve todos los
 * errores a la vez (uno por campo) para marcarlos juntos en el formulario.
 */
export function validarDatosEstudiante(entrada: EntradaEstudiante): Resultado<DatosEstudiante, ErroresEstudiante> {
  const errores: ErroresEstudiante = {};
  const numeroDocumento = limpiarDocumento(entrada.numeroDocumento);
  const nombres = limpiarNombre(entrada.nombres);
  const apellidos = limpiarNombre(entrada.apellidos);
  const carrera = (entrada.carrera ?? "").trim();
  const correoInstitucional = limpiarCorreo(entrada.correoInstitucional);
  const correoPersonal = limpiarCorreo(entrada.correoPersonal);

  const tipoDocumento = entrada.tipoDocumento;
  if (!esTipoDocumento(tipoDocumento)) errores.tipoDocumento = "TIPO_DOCUMENTO_INVALIDO";
  else if (tipoDocumento === "DNI" && !/^\d{8}$/.test(numeroDocumento)) errores.numeroDocumento = "DNI_INVALIDO";
  else if (tipoDocumento === "CE" && !/^[A-Z0-9]{1,12}$/.test(numeroDocumento)) errores.numeroDocumento = "CE_INVALIDO";

  if (!nombres) errores.nombres = "NOMBRES_REQUERIDOS";
  else if (nombres.length > LARGO_MAXIMO_NOMBRE) errores.nombres = "NOMBRE_DEMASIADO_LARGO";
  if (!apellidos) errores.apellidos = "APELLIDOS_REQUERIDOS";
  else if (apellidos.length > LARGO_MAXIMO_NOMBRE) errores.apellidos = "NOMBRE_DEMASIADO_LARGO";

  if (!/^[a-z0-9-]{1,60}$/.test(carrera)) errores.carrera = "CARRERA_INVALIDA";

  if (correoInstitucional !== null && !(FORMA_DE_CORREO.test(correoInstitucional) && correoInstitucional.endsWith(DOMINIO_INSTITUCIONAL))) {
    errores.correoInstitucional = "CORREO_INSTITUCIONAL_INVALIDO";
  }
  if (correoPersonal !== null && !FORMA_DE_CORREO.test(correoPersonal)) errores.correoPersonal = "CORREO_INVALIDO";
  if (correoInstitucional === null && correoPersonal === null) errores.correoPersonal = "CORREO_REQUERIDO";

  if (Object.keys(errores).length > 0 || !esTipoDocumento(tipoDocumento)) return fallo(errores);
  return exito({ tipoDocumento, numeroDocumento, nombres, apellidos, carrera, correoInstitucional, correoPersonal });
}
