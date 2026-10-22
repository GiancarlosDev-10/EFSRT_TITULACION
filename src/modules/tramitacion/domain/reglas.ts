import {
  ESTADO_ASIGNACION_DOCENTE,
  ESTADO_INICIAL,
  ESTADOS,
  LONGITUD_MAXIMA_MOTIVO,
  MODULOS,
  TRANSICIONES,
  type CodigoEstado,
  type DefinicionEstado,
  type Dependencia,
  type Modulo,
} from "./catalogo";
import type { DocenteAsignado } from "./historial";
import { exito, fallo, type Resultado } from "./resultado";

type ErrorMotivo = "MOTIVO_REQUERIDO" | "MOTIVO_DEMASIADO_LARGO";

export type ErrorTransicion = "TRANSICION_NO_PERMITIDA" | "DEPENDENCIA_NO_AUTORIZADA" | "DOCENTE_REQUERIDO" | ErrorMotivo;

export type ErrorCambioDocente =
  | "DEPENDENCIA_NO_AUTORIZADA"
  | "CAMBIO_DE_DOCENTE_NO_PERMITIDO"
  | "MISMO_DOCENTE"
  | ErrorMotivo;

/** Valida un valor externo (p. ej. de la URL); si es válido, TypeScript lo trata como `Modulo`. */
export function esModulo(valor: unknown): valor is Modulo {
  return MODULOS.some((modulo) => modulo === valor);
}

/** Valida un valor externo (p. ej. de un formulario); si es válido, TypeScript lo trata como `CodigoEstado`. */
export function esCodigoEstado(valor: unknown): valor is CodigoEstado {
  return typeof valor === "string" && Object.hasOwn(ESTADOS, valor);
}

/** Dependencia donde se encuentra el expediente en ese estado. */
export function ubicacionDe(estado: CodigoEstado): Dependencia {
  return ESTADOS[estado].dependencia;
}

export function esObservacion(estado: CodigoEstado): boolean {
  return ESTADOS[estado].tipo === "observacion";
}

export function esFinal(estado: CodigoEstado): boolean {
  return ESTADOS[estado].tipo === "final";
}

/**
 * Estado al que vuelve el expediente cuando se subsana la observación (su única
 * salida en el catálogo: 02→03, 04→05, 08→07); `null` si no es una observación.
 */
export function estadoAlSubsanar(estado: CodigoEstado): CodigoEstado | null {
  if (!esObservacion(estado)) return null;
  const [salida] = TRANSICIONES[estado];
  return salida ?? null;
}

/** Primer paso de la guía para subsanar una observación; `null` si el estado no es una observación. */
export function indicacionDe(estado: CodigoEstado): string | null {
  const definicion: DefinicionEstado = ESTADOS[estado];
  return definicion.tipo === "observacion" ? definicion.indicacion : null;
}

/**
 * ¿Existe la flecha `desde → hacia`? `desde = null` significa que el
 * expediente aún no existe: solo puede nacer en el estado inicial.
 */
export function estaPermitida(desde: CodigoEstado | null, hacia: CodigoEstado): boolean {
  if (desde === null) return hacia === ESTADO_INICIAL;
  const siguientes: readonly CodigoEstado[] = TRANSICIONES[desde];
  return siguientes.includes(hacia);
}

/**
 * Regla de autorización: registra un estado la dependencia responsable de ese
 * estado (el destino). "Cada oficina registra lo que ella misma hizo".
 */
export function puedeRegistrar(dependencia: Dependencia, estado: CodigoEstado): boolean {
  return ESTADOS[estado].dependencia === dependencia;
}

/** Estados a los que esta dependencia puede llevar el expediente desde `desde`. */
export function transicionesDisponibles(
  desde: CodigoEstado,
  dependencia: Dependencia,
): readonly CodigoEstado[] {
  return TRANSICIONES[desde].filter((hacia) => puedeRegistrar(dependencia, hacia));
}

/** ¿Registrar este estado exige elegir al Docente Supervisor? */
export function exigeDocente(estado: CodigoEstado): boolean {
  return estado === ESTADO_ASIGNACION_DOCENTE;
}

/**
 * Mientras la supervisión está en curso (docente asignado, en supervisión u
 * observada), Coordinación puede cambiar al docente. Después de la aprobación
 * ya no: el docente que aprobó queda como el responsable.
 */
export function permiteCambiarDocente(estado: CodigoEstado): boolean {
  return exigeDocente(estado) || (ubicacionDe(estado) === "docente" && ESTADOS[estado].tipo !== "conforme");
}

/** Motivo sin espacios sobrantes; `null` si quedó vacío. */
function normalizarMotivo(motivo: string | undefined): Resultado<string | null, "MOTIVO_DEMASIADO_LARGO"> {
  const normalizado = motivo?.trim() || null;
  if (normalizado !== null && normalizado.length > LONGITUD_MAXIMA_MOTIVO) return fallo("MOTIVO_DEMASIADO_LARGO");
  return exito(normalizado);
}

type SolicitudTransicion = {
  desde: CodigoEstado | null;
  hacia: CodigoEstado;
  dependencia: Dependencia;
  motivo?: string;
  docente?: DocenteAsignado;
};

/**
 * Valida un cambio de estado completo. Si es válido devuelve el motivo
 * normalizado (sin espacios sobrantes; `null` si quedó vacío).
 */
export function validarTransicion({
  desde,
  hacia,
  dependencia,
  motivo,
  docente,
}: SolicitudTransicion): Resultado<{ motivo: string | null }, ErrorTransicion> {
  if (!estaPermitida(desde, hacia)) return fallo("TRANSICION_NO_PERMITIDA");
  if (!puedeRegistrar(dependencia, hacia)) return fallo("DEPENDENCIA_NO_AUTORIZADA");
  if (exigeDocente(hacia) && !docente) return fallo("DOCENTE_REQUERIDO");

  const motivoNormalizado = normalizarMotivo(motivo);
  if (!motivoNormalizado.ok) return motivoNormalizado;
  if (esObservacion(hacia) && motivoNormalizado.valor === null) return fallo("MOTIVO_REQUERIDO");
  return exito({ motivo: motivoNormalizado.valor });
}

type SolicitudCambioDocente = {
  estado: CodigoEstado;
  dependencia: Dependencia;
  anterior: DocenteAsignado | null;
  nuevo: DocenteAsignado;
  motivo?: string;
};

/**
 * Valida un cambio de docente. Lo registra la misma dependencia que lo asignó
 * (la de ESTADO_ASIGNACION_DOCENTE) y siempre con motivo, como una observación.
 */
export function validarCambioDocente({
  estado,
  dependencia,
  anterior,
  nuevo,
  motivo,
}: SolicitudCambioDocente): Resultado<{ anterior: DocenteAsignado; motivo: string }, ErrorCambioDocente> {
  if (!puedeRegistrar(dependencia, ESTADO_ASIGNACION_DOCENTE)) return fallo("DEPENDENCIA_NO_AUTORIZADA");
  if (!permiteCambiarDocente(estado) || anterior === null) return fallo("CAMBIO_DE_DOCENTE_NO_PERMITIDO");
  if (anterior.id === nuevo.id) return fallo("MISMO_DOCENTE");

  const motivoNormalizado = normalizarMotivo(motivo);
  if (!motivoNormalizado.ok) return motivoNormalizado;
  if (motivoNormalizado.valor === null) return fallo("MOTIVO_REQUERIDO");
  return exito({ anterior, motivo: motivoNormalizado.valor });
}
