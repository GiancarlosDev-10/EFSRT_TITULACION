import type { CodigoEstado, Dependencia } from "./catalogo";

/** Persona de una dependencia que registra un cambio. Lo provee el servidor desde la sesión, nunca el cliente. */
export type Actor = {
  id: string;
  nombre: string;
  dependencia: Dependencia;
};

/** Fila del historial. Es de solo añadidura: nunca se edita ni se borra. */
export type RegistroHistorial = {
  /** `null` en el registro con el que nace el expediente. */
  estadoAnterior: CodigoEstado | null;
  estadoNuevo: CodigoEstado;
  actor: Actor;
  /** Motivo en observaciones (obligatorio); nota opcional en los demás estados. */
  motivo: string | null;
  fecha: Date;
};
