import type { DatosAviso } from "../domain/aviso";

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
