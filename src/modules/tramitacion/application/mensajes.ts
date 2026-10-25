import {
  DOMINIO_INSTITUCIONAL,
  LONGITUD_MAXIMA_MOTIVO,
  type ErrorCambioDocente,
  type ErrorCampoEstudiante,
  type ErrorTransicion,
} from "../domain";
import type { ErrorRegistroEstudiante, ErrorRepositorio } from "./puertos";

export type ErrorTramitacion = ErrorTransicion | ErrorCambioDocente | ErrorRepositorio;

/** Texto para la interfaz de cada error. `Record` obliga a que ningún código quede sin mensaje. */
export const MENSAJES_DE_ERROR: Record<ErrorTramitacion, string> = {
  TRANSICION_NO_PERMITIDA: "Ese cambio no está permitido desde el estado actual del expediente.",
  DEPENDENCIA_NO_AUTORIZADA: "Tu oficina no puede registrar ese estado.",
  MOTIVO_REQUERIDO: "Escribe el motivo de la observación.",
  MOTIVO_DEMASIADO_LARGO: `El texto no puede pasar de ${LONGITUD_MAXIMA_MOTIVO} caracteres.`,
  DOCENTE_REQUERIDO: "Elige al Docente Supervisor.",
  DOCENTE_NO_VALIDO: "Ese docente ya no está habilitado. Elige otro.",
  CAMBIO_DE_DOCENTE_NO_PERMITIDO: "El Docente Supervisor solo se puede cambiar mientras la supervisión está en curso.",
  MISMO_DOCENTE: "Elige a un docente distinto del actual.",
  EXPEDIENTE_NO_ENCONTRADO: "No encontramos ese expediente.",
  EXPEDIENTE_YA_EXISTE: "El estudiante ya tiene un expediente para ese módulo.",
  CONFLICTO_DE_ESTADO:
    "Alguien actualizó este expediente hace un momento. Recarga la página y vuelve a intentarlo.",
};

/** Texto de cada error de los datos de un estudiante nuevo (se muestra bajo su campo). */
export const MENSAJES_DATOS_ESTUDIANTE: Record<ErrorCampoEstudiante, string> = {
  TIPO_DOCUMENTO_INVALIDO: "Elige DNI o carné de extranjería.",
  DNI_INVALIDO: "El DNI tiene 8 dígitos.",
  CE_INVALIDO: "El carné tiene hasta 12 letras o números.",
  NOMBRES_REQUERIDOS: "Escribe los nombres.",
  APELLIDOS_REQUERIDOS: "Escribe los apellidos.",
  NOMBRE_DEMASIADO_LARGO: "No puede pasar de 100 caracteres.",
  CARRERA_INVALIDA: "Elige la carrera.",
  CORREO_INSTITUCIONAL_INVALIDO: `Debe terminar en ${DOMINIO_INSTITUCIONAL}.`,
  CORREO_INVALIDO: "Revisa el correo.",
  CORREO_REQUERIDO: "Escribe al menos un correo.",
};

/** Texto de los errores del alta que no son de un campo. */
export const MENSAJES_ALTA_ESTUDIANTE: Record<"DEPENDENCIA_NO_AUTORIZADA" | ErrorRegistroEstudiante, string> = {
  DEPENDENCIA_NO_AUTORIZADA: "Solo Mesa de Partes registra estudiantes.",
  DOCUMENTO_YA_REGISTRADO: "Ya hay un estudiante con ese documento. Búscalo en la recepción.",
  CORREO_YA_REGISTRADO: "Ese correo ya pertenece a otro estudiante.",
};
