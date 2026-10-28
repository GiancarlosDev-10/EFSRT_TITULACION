import type { DatosAviso } from "../domain/aviso";
import type { DatosAvisoCampana } from "../domain/campana";

/** Correo listo para salir. */
export type CorreoSaliente = {
  para: string[];
  asunto: string;
  texto: string;
  html: string;
};

/** Aviso de la bandeja de salida, con lo necesario para redactarlo. */
export type AvisoPorEnviar = {
  id: number;
  para: string[];
  datos: DatosAviso;
};

/**
 * Bandeja de salida (D20): la base crea un aviso pendiente en la misma
 * operación que el cambio de estado, así que un correo que falla no se pierde.
 */
export interface BandejaDeSalida {
  /** Toma hasta `limite` avisos por enviar y los aparta, para que otro envío simultáneo no los repita. */
  reclamar(limite: number): Promise<AvisoPorEnviar[]>;
  marcarEnviado(id: number): Promise<void>;
  marcarFallido(id: number, error: string): Promise<void>;
}

/** Proveedor de correo: Gmail por SMTP hoy (D48), el definitivo después. */
export interface Notificador {
  enviar(correo: CorreoSaliente): Promise<void>;
}

/** Aviso de la campana tal como lo guarda la base (D58). */
export type AvisoRecibido = {
  id: number;
  datos: DatosAvisoCampana;
  fecha: Date;
  leido: boolean;
  /** Pantalla a la que lleva: el seguimiento del módulo o la ficha del expediente. */
  enlace: string;
};

/**
 * Bandeja de entrada de la campana: los avisos de quien tiene la sesión. El
 * RLS decide cuáles son suyos; nunca recibe el destinatario desde el navegador.
 */
export interface BandejaDeEntrada {
  recientes(limite: number): Promise<AvisoRecibido[]>;
  contarSinLeer(): Promise<number>;
  /** Marca como leídos los propios hasta `hastaId` (el más reciente que se vio). */
  marcarLeidos(hastaId: number): Promise<void>;
}
