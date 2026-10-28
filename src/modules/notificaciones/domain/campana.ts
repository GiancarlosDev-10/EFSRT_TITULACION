// Texto de cada aviso de la campana (D58). TypeScript puro: recibe los textos
// del catálogo ya resueltos (como `DatosAviso` del correo) y devuelve el título
// y la línea de detalle que se muestran en la lista.
import type { TipoDeEstado } from "./aviso";

/** A quién va el aviso: decide el punto de vista del texto. */
export type DestinatarioAviso = "estudiante" | "oficina" | "docente";

export type DatosAvisoCampana = {
  para: DestinatarioAviso;
  /** Nombre completo del estudiante ("Valeria Quispe Huamán"). */
  estudiante: string;
  modulo: string;
  estado: { codigo: string; nombre: string; tipo: TipoDeEstado };
  /** El expediente acaba de nacer (Mesa de Partes recibió la carpeta). */
  apertura: boolean;
  /** "a Coordinación de Carrera" si en este estado el expediente pasa a otra oficina (D56); si no, `null`. */
  pasaA: string | null;
  /** Docente asignado en el 06; `null` en los demás estados. */
  docenteAsignado: string | null;
  /** Solo si Coordinación cambió al docente; el estado no cambió. */
  cambioDeDocente: { nuevo: string; anterior: string } | null;
};

export type TextoAviso = { titulo: string; detalle: string };

/** "Pago conforme" para "Pago conforme (derivado a Coordinación)": la aclaración ya la da el aviso. */
const sinAclaracion = (nombre: string) => nombre.replace(/\s*\(.*\)$/, "");

function paraEstudiante(d: DatosAvisoCampana): TextoAviso {
  const modulo = `Módulo ${d.modulo}`;
  const detalle = `${d.estado.codigo} · ${d.estado.nombre}`;
  if (d.cambioDeDocente) return { titulo: `${modulo}: cambió tu Docente Supervisor`, detalle: `Ahora es ${d.cambioDeDocente.nuevo}` };
  if (d.apertura) return { titulo: `${modulo}: recibimos tu expediente`, detalle };
  if (d.estado.tipo === "observacion") return { titulo: `${modulo}: tu expediente tiene una observación`, detalle };
  if (d.estado.tipo === "final") return { titulo: `${modulo}: tu constancia está lista para recoger`, detalle };
  if (d.docenteAsignado) return { titulo: `${modulo}: tu Docente Supervisor es ${d.docenteAsignado}`, detalle };
  if (d.pasaA) return { titulo: `${modulo} pasó ${d.pasaA}`, detalle };
  return { titulo: `${modulo}: ${d.estado.nombre}`, detalle };
}

export function redactarAvisoCampana(d: DatosAvisoCampana): TextoAviso {
  if (d.para === "estudiante") return paraEstudiante(d);
  if (d.para === "docente") {
    return {
      titulo: `Te asignaron a ${d.estudiante}`,
      detalle: `Módulo ${d.modulo} · ${d.cambioDeDocente ? `Reemplazas a ${d.cambioDeDocente.anterior}` : "Coordinación de Carrera"}`,
    };
  }
  return { titulo: `Llegó el expediente de ${d.estudiante}`, detalle: `Módulo ${d.modulo} · ${sinAclaracion(d.estado.nombre)}` };
}
