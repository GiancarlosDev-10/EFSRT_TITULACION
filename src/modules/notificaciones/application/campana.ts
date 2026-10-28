import { redactarAvisoCampana } from "../domain/campana";
import type { BandejaDeEntrada } from "./puertos";

/** Cuántos avisos muestra la campana (D58). */
export const MAXIMO_AVISOS = 20;

export type AvisoDeCampana = {
  id: number;
  titulo: string;
  detalle: string;
  fecha: Date;
  leido: boolean;
  enlace: string;
};

export type Campana = {
  avisos: AvisoDeCampana[];
  /** Puede ser mayor que la lista: cuenta también los que no entran en los últimos 20. */
  sinLeer: number;
  /** El más reciente de la lista: hasta ahí se marca como leído al abrirla; `null` si no hay avisos. */
  ultimoId: number | null;
};

/** Lo que muestra la campana de quien tiene la sesión. */
export function crearObtenerCampana({ bandeja }: { bandeja: BandejaDeEntrada }) {
  return async function obtenerCampana(): Promise<Campana> {
    const [recientes, sinLeer] = await Promise.all([bandeja.recientes(MAXIMO_AVISOS), bandeja.contarSinLeer()]);
    const avisos = recientes.map(({ id, datos, fecha, leido, enlace }) => ({ id, ...redactarAvisoCampana(datos), fecha, leido, enlace }));
    return { avisos, sinLeer, ultimoId: avisos.length > 0 ? Math.max(...avisos.map((a) => a.id)) : null };
  };
}

/**
 * Al abrir la campana, marca como leídos los avisos hasta el último que se vio.
 * `hastaId` viene del navegador: solo se acepta un entero positivo, y la base
 * solo toca los avisos propios. Devuelve `false` si el dato no es válido.
 */
export function crearMarcarAvisosLeidos({ bandeja }: { bandeja: BandejaDeEntrada }) {
  return async function marcarAvisosLeidos(hastaId: unknown): Promise<boolean> {
    if (typeof hastaId !== "number" || !Number.isSafeInteger(hastaId) || hastaId <= 0) return false;
    await bandeja.marcarLeidos(hastaId);
    return true;
  };
}
