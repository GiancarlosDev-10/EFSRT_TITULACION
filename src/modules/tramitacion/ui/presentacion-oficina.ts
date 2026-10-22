// Lógica de presentación de las pantallas de oficina: funciones puras que
// convierten la bandeja y el expediente en textos y tonos. Todo se deriva del
// catálogo; aquí no se escriben códigos de estado a mano.
import { diasEntre } from "@/shared";
import {
  CODIGOS_ESTADO,
  DEPENDENCIAS,
  ESTADOS,
  TRANSICIONES,
  esFinal,
  esObservacion,
  exigeDocente,
  ubicacionDe,
  type CodigoEstado,
  type Dependencia,
} from "../domain";
import type { TonoEvento, TonoExpediente } from "./presentacion";

/** Dónde está el expediente, para frases como "Está con el Docente Supervisor" (D23). */
export const UBICACION_DE: Record<Dependencia, string> = {
  "mesa-partes": "en Mesa de Partes",
  coordinacion: "en Coordinación de Carrera",
  docente: "con el Docente Supervisor",
  bienestar: "en Bienestar y Empleabilidad",
};

/** A quién pasa, para "El expediente pasa al Docente Supervisor". */
const DESTINO_DE: Record<Dependencia, string> = {
  "mesa-partes": "a Mesa de Partes",
  coordinacion: "a Coordinación de Carrera",
  docente: "al Docente Supervisor",
  bienestar: "a Bienestar y Empleabilidad",
};

/** "Pago conforme (derivado a Coordinación)" → "Pago conforme": para botones. */
export function nombreBreve(codigo: CodigoEstado): string {
  return ESTADOS[codigo].nombre.replace(/\s*\(.*\)$/, "");
}

/** Qué pasa al registrar `hacia` desde `desde`: la ayuda bajo cada opción del panel. */
export function ayudaDeAccion(desde: CodigoEstado, hacia: CodigoEstado, dependencia: Dependencia): string {
  if (esObservacion(hacia)) return "El expediente queda detenido en tu oficina hasta que el estudiante corrija lo indicado.";

  const prefijo = esObservacion(desde) ? "El estudiante entregó la corrección. " : "";
  if (esFinal(hacia)) return `${prefijo}El estudiante recibirá el aviso para recoger su constancia en físico.`;
  if (exigeDocente(hacia)) return `${prefijo}Elige al docente: el expediente pasa a su bandeja.`;

  const siguiente = TRANSICIONES[hacia].map(ubicacionDe).find((d) => d !== dependencia);
  return siguiente ? `${prefijo}El expediente pasa ${DESTINO_DE[siguiente]}.` : `${prefijo}El expediente sigue en tu oficina.`;
}

/** Tono del chip de un estado (sin historia: el estado tal como está ahora). */
export function tonoDeEstado(codigo: CodigoEstado): TonoEvento {
  const { tipo } = ESTADOS[codigo];
  if (tipo === "observacion") return "observado";
  return tipo === "proceso" ? "proceso" : "conforme";
}

/** Tono de la píldora de ubicación. */
export function tonoDePildora(codigo: CodigoEstado): TonoExpediente {
  if (esObservacion(codigo)) return "observado";
  return esFinal(codigo) ? "listo" : "en-curso";
}

/** "Constancia lista", "Observado · Coordinación" o "Mesa de Partes". */
export function textoDePildora(codigo: CodigoEstado): string {
  if (esFinal(codigo)) return ESTADOS[codigo].etiqueta;
  const lugar = DEPENDENCIAS[ubicacionDe(codigo)].nombreCorto;
  return esObservacion(codigo) ? `Observado · ${lugar}` : lugar;
}

/** ¿Esta oficina registra observaciones? (si no, la bandeja no muestra la pestaña "Observados"). */
export function registraObservaciones(dependencia: Dependencia): boolean {
  return CODIGOS_ESTADO.some((codigo) => esObservacion(codigo) && ubicacionDe(codigo) === dependencia);
}

/** Días completos de espera; `null` si son menos de 3 (no se resaltan). */
export function diasDeEspera(desde: Date, ahora: Date): number | null {
  const dias = diasEntre(desde, ahora);
  return dias >= 3 ? dias : null;
}

const TITULOS = /^(mg|lic|ing|dr|dra|abg|prof)\.\s*/i;

/** "Lic. Patricia Gutiérrez" → "Patricia"; si solo hay una inicial ("Mg. R. Paredes"), el nombre completo. */
export function nombreParaSaludo(nombre: string): string {
  const [primero = ""] = nombre.replace(TITULOS, "").split(/\s+/);
  return primero.replace(".", "").length <= 1 ? nombre : primero;
}

export type VistaBandeja = "atender" | "observados" | "estudiantes";

export const VISTAS_BANDEJA: readonly VistaBandeja[] = ["atender", "observados", "estudiantes"];

export function esVistaBandeja(valor: unknown): valor is VistaBandeja {
  return VISTAS_BANDEJA.some((vista) => vista === valor);
}

/** Una opción del panel de acción: lo que la oficina puede registrar ahora. */
export type OpcionAccion = {
  codigo: CodigoEstado;
  nombre: string;
  /** Para el botón: "Registrar 03 · Pago conforme". */
  nombreBreve: string;
  ayuda: string;
  /** Exige motivo (lo leerá el estudiante). */
  observacion: boolean;
  exigeDocente: boolean;
  tono: TonoEvento;
};

export function opcionesDeAccion(
  desde: CodigoEstado,
  acciones: readonly CodigoEstado[],
  dependencia: Dependencia,
): OpcionAccion[] {
  return acciones.map((codigo) => ({
    codigo,
    nombre: ESTADOS[codigo].nombre,
    nombreBreve: nombreBreve(codigo),
    ayuda: ayudaDeAccion(desde, codigo, dependencia),
    observacion: esObservacion(codigo),
    exigeDocente: exigeDocente(codigo),
    tono: tonoDeEstado(codigo),
  }));
}
