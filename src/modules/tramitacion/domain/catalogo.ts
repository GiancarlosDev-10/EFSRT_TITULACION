/**
 * Catálogo del trámite EFSRT: única fuente de verdad de dependencias, estados
 * y transiciones, incluidos sus textos. Los nombres son provisionales hasta
 * validarlos con los actores; si cambian, se edita SOLO este archivo. Tipos,
 * reglas, pruebas e interfaz se derivan de aquí.
 */

type DefinicionDependencia = {
  nombre: string;
  /** Para espacios reducidos (p. ej. la barra de pasos en celular). */
  nombreCorto: string;
  /** Qué hace la oficina en el trámite, en pocas palabras. */
  funcion: string;
  /** Para frases como "Entrega tu corrección {conPreposicion}". "Docente Supervisor" no se adapta al género. */
  conPreposicion: string;
};

export const DEPENDENCIAS = {
  "mesa-partes": {
    nombre: "Mesa de Partes",
    nombreCorto: "Mesa de Partes",
    funcion: "recepción y pago",
    conPreposicion: "a Mesa de Partes",
  },
  coordinacion: {
    nombre: "Coordinación de Carrera",
    nombreCorto: "Coordinación",
    funcion: "requisitos y docente",
    conPreposicion: "a la Coordinación de tu carrera",
  },
  docente: {
    nombre: "Docente Supervisor",
    nombreCorto: "Docente",
    funcion: "supervisión",
    conPreposicion: "al Docente Supervisor",
  },
  bienestar: {
    nombre: "Bienestar y Empleabilidad",
    nombreCorto: "Bienestar",
    funcion: "visto bueno y constancia",
    conPreposicion: "a Bienestar y Empleabilidad",
  },
} as const satisfies Record<string, DefinicionDependencia>;

export type Dependencia = keyof typeof DEPENDENCIAS;

/** Dependencias en el orden en que el expediente las recorre (el de DEPENDENCIAS). */
export const ORDEN_DEPENDENCIAS = Object.keys(DEPENDENCIAS) as Dependencia[];

export const MODULOS = ["I", "II", "III"] as const;

export type Modulo = (typeof MODULOS)[number];

/**
 * proceso: la oficina recibió o inició algo · conforme: la oficina dio su
 * conformidad · observacion: el expediente espera una corrección · final.
 */
export type TipoEstado = "proceso" | "conforme" | "observacion" | "final";

type DatosComunesEstado = {
  nombre: string;
  /** Texto breve para resúmenes y píldoras ("Conforme", "Observado"…). */
  etiqueta: string;
  /** Dependencia responsable: es la "ubicación" del expediente y la única que puede registrar este estado. */
  dependencia: Dependencia;
};

/** Solo las observaciones llevan `indicacion`: el primer paso de la guía para el estudiante. */
export type DefinicionEstado = DatosComunesEstado &
  ({ tipo: "observacion"; indicacion: string } | { tipo: Exclude<TipoEstado, "observacion"> });

export const ESTADOS = {
  "01": { nombre: "Expediente recibido", etiqueta: "Recibido", dependencia: "mesa-partes", tipo: "proceso" },
  "02": {
    nombre: "Pago observado",
    etiqueta: "Observado",
    dependencia: "mesa-partes",
    tipo: "observacion",
    indicacion: "Corrige tu pago o tu voucher según lo indicado.",
  },
  "03": { nombre: "Pago conforme (derivado a Coordinación)", etiqueta: "Conforme", dependencia: "mesa-partes", tipo: "conforme" },
  "04": {
    nombre: "Requisitos observados",
    etiqueta: "Observado",
    dependencia: "coordinacion",
    tipo: "observacion",
    indicacion: "Completa o corrige los requisitos indicados.",
  },
  "05": { nombre: "Requisitos conformes", etiqueta: "Conforme", dependencia: "coordinacion", tipo: "conforme" },
  "06": { nombre: "Docente supervisor asignado", etiqueta: "Docente asignado", dependencia: "coordinacion", tipo: "conforme" },
  "07": { nombre: "En supervisión", etiqueta: "En supervisión", dependencia: "docente", tipo: "proceso" },
  "08": {
    nombre: "Supervisión observada",
    etiqueta: "Observado",
    dependencia: "docente",
    tipo: "observacion",
    indicacion: "Corrige el documento de supervisión indicado.",
  },
  "09": { nombre: "Supervisión aprobada", etiqueta: "Aprobado", dependencia: "docente", tipo: "conforme" },
  "10": { nombre: "Constancia lista para recoger", etiqueta: "Constancia lista", dependencia: "bienestar", tipo: "final" },
} as const satisfies Record<string, DefinicionEstado>;

export type CodigoEstado = keyof typeof ESTADOS;

/** Estado con el que nace todo expediente (Mesa de Partes recibe la carpeta física). */
export const ESTADO_INICIAL = "01" satisfies CodigoEstado;

/** Estado en el que se elige al Docente Supervisor: registrarlo exige indicar quién es (D49). */
export const ESTADO_ASIGNACION_DOCENTE = "06" satisfies CodigoEstado;

/** Transiciones permitidas: estado actual → estados a los que puede pasar. */
export const TRANSICIONES = {
  "01": ["02", "03"],
  "02": ["03"],
  "03": ["04", "05"],
  "04": ["05"],
  "05": ["06"],
  "06": ["07"],
  "07": ["08", "09"],
  "08": ["07"],
  "09": ["10"],
  "10": [],
} as const satisfies Record<CodigoEstado, readonly CodigoEstado[]>;

/** Largo máximo del motivo (observaciones) o nota (demás estados). */
export const LONGITUD_MAXIMA_MOTIVO = 150;

/**
 * Códigos en orden "01"…"10". Se ordena explícitamente porque JavaScript
 * coloca primero las claves numéricas canónicas ("10") al enumerar un objeto.
 */
export const CODIGOS_ESTADO = (Object.keys(ESTADOS) as CodigoEstado[]).sort();
