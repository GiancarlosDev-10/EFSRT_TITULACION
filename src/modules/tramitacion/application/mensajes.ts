import { LONGITUD_MAXIMA_MOTIVO, type ErrorCambioDocente, type ErrorTransicion } from "../domain";
import type { ErrorRepositorio } from "./puertos";

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
