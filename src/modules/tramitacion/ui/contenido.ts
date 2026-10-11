// Contenido institucional que se muestra al estudiante. No son reglas del
// trámite (esas están en domain/catalogo.ts) sino datos del instituto: se
// editan aquí, sin tocar componentes, cuando se confirmen con las oficinas.
import type { Modulo } from "../domain";

const MONTO_POR_MODULO = 20;

/** Nombres de los módulos por carrera (D18). Se agregan carreras sin tocar el código. */
const CARRERAS: Record<string, { nombre: string; modulos: Record<Modulo, string> }> = {
  "desarrollo-sistemas": {
    nombre: "Desarrollo de Sistemas",
    modulos: {
      I: "Soporte técnico y programación de sistemas",
      II: "Implementación de sistemas de información",
      III: "Diseño y puesta en producción de sistemas de información",
    },
  },
};

/** Nombres de los módulos de una carrera; `null` si la carrera no está registrada. */
export function nombresDeModulos(carrera: string): Record<Modulo, string> | null {
  return CARRERAS[carrera]?.modulos ?? null;
}

export const INSTITUCION = {
  montoPorModulo: MONTO_POR_MODULO,
  mesaPartes: {
    horario: "8:00 a. m. a 7:00 p. m.",
  },
  bienestar: {
    nombre: "Unidad de Bienestar y Empleabilidad",
    ubicacion: "Primer piso, al lado de la biblioteca",
    horario: "Lun., mié. y vie. de 8:00 a. m. a 1:00 p. m. · Mar. y jue. de 2:00 p. m. a 8:00 p. m.",
    queLlevar: "Solo tu DNI",
  },
  /** Documentos de la carpeta física que se entrega en Mesa de Partes al iniciar el trámite. */
  documentos: [
    { id: "voucher", nombre: `Voucher de pago (S/ ${MONTO_POR_MODULO} por módulo) canjeado en Tesorería` },
    { id: "ficha-matricula", nombre: "Copia de la ficha de matrícula" },
    { id: "dni", nombre: "Copia del DNI" },
    { id: "croquis", nombre: "Croquis de ubicación de la empresa" },
    { id: "constancia-practicas", nombre: "Constancia de prácticas o de trabajo" },
  ],
} as const;
