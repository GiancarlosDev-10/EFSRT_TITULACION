// Clases de Tailwind por tono, en un solo lugar para todos los componentes.
import type { SituacionEtapa } from "../application";
import type { TonoEvento, TonoExpediente } from "./presentacion";

/** Chip del código de estado (01…10) en el historial. */
export const CHIP_EVENTO: Record<TonoEvento, string> = {
  proceso: "bg-neutral-bg text-text-soft",
  conforme: "bg-ok-bg text-ok",
  observado: "bg-warn text-white",
  subsanado: "bg-warn-bg text-warn-text",
};

/** Píldora de estado sobre fondo claro. */
export const PILDORA: Record<TonoExpediente, string> = {
  "en-curso": "bg-navy-tint text-navy",
  observado: "bg-warn-bg text-warn-text",
  listo: "bg-ok-bg text-ok",
  "sin-expediente": "bg-neutral-bg text-text-soft",
};

/** Píldora de estado sobre la tarjeta oscura. */
export const PILDORA_SOBRE_OSCURO: Record<TonoExpediente, string> = {
  "en-curso": "bg-ink-active text-white",
  observado: "bg-warn-soft text-warn-on-soft",
  listo: "bg-ok-soft text-ok-on-soft",
  "sin-expediente": "bg-ink-line text-on-ink",
};

/** Punto de color sobre la barra lateral oscura. */
export const PUNTO_SOBRE_OSCURO: Record<TonoExpediente, string> = {
  "en-curso": "bg-on-ink",
  observado: "bg-warn-bright",
  listo: "bg-ok-bright",
  "sin-expediente": "border border-on-ink-muted",
};

/** Segmento de la barra de avance (celular). */
export const SEGMENTO: Record<SituacionEtapa, string> = {
  completada: "bg-ok",
  actual: "bg-navy",
  observada: "bg-warn-bright",
  pendiente: "bg-line",
};
