import { redactarAviso } from "../domain/aviso";
import type { BandejaDeSalida, Notificador } from "./puertos";

export type ResultadoEnvio = { enviados: number; fallidos: number };

/** Largo máximo del error que se guarda (el de un servidor SMTP puede ser muy largo). */
const LARGO_MAXIMO_ERROR = 500;

/**
 * Envía los avisos pendientes de la bandeja de salida. Un correo que falla
 * queda como "fallido" con su error y no detiene a los demás; se reintenta
 * en el siguiente envío.
 */
export function crearEnviarPendientes({ bandeja, notificador }: { bandeja: BandejaDeSalida; notificador: Notificador }) {
  return async function enviarPendientes(limite = 20): Promise<ResultadoEnvio> {
    const avisos = await bandeja.reclamar(limite);
    const resultado: ResultadoEnvio = { enviados: 0, fallidos: 0 };
    for (const aviso of avisos) {
      try {
        await notificador.enviar({ para: aviso.para, ...redactarAviso(aviso.datos) });
        await bandeja.marcarEnviado(aviso.id);
        resultado.enviados++;
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        await bandeja.marcarFallido(aviso.id, mensaje.slice(0, LARGO_MAXIMO_ERROR));
        resultado.fallidos++;
      }
    }
    return resultado;
  };
}
