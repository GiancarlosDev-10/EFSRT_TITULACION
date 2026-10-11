import {
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
import { exito, fallo, type Resultado } from "./resultado";

export type ErrorTransicion =
  | "TRANSICION_NO_PERMITIDA"
  | "DEPENDENCIA_NO_AUTORIZADA"
  | "MOTIVO_REQUERIDO"
  | "MOTIVO_DEMASIADO_LARGO";

/** Valida un valor externo (p. ej. de la URL); si es válido, TypeScript lo trata como `Modulo`. */
export function esModulo(valor: unknown): valor is Modulo {
  return MODULOS.some((modulo) => modulo === valor);
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

type SolicitudTransicion = {
  desde: CodigoEstado | null;
  hacia: CodigoEstado;
  dependencia: Dependencia;
  motivo?: string;
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
}: SolicitudTransicion): Resultado<{ motivo: string | null }, ErrorTransicion> {
  if (!estaPermitida(desde, hacia)) return fallo("TRANSICION_NO_PERMITIDA");
  if (!puedeRegistrar(dependencia, hacia)) return fallo("DEPENDENCIA_NO_AUTORIZADA");

  const motivoNormalizado = motivo?.trim() || null;
  if (esObservacion(hacia) && motivoNormalizado === null) return fallo("MOTIVO_REQUERIDO");
  if (motivoNormalizado !== null && motivoNormalizado.length > LONGITUD_MAXIMA_MOTIVO) {
    return fallo("MOTIVO_DEMASIADO_LARGO");
  }

  return exito({ motivo: motivoNormalizado });
}
