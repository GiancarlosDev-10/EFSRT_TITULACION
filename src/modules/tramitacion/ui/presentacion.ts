// Lógica de presentación de la vista del estudiante: funciones puras que
// convierten el seguimiento en textos y tonos. Los componentes solo pintan lo
// que devuelve este archivo; aquí están todos los textos que dependen de datos.
import { capitalizar, diaRelativo, diasEntre, fechaConAnio, haceDias, hora, rangoDeFechas } from "@/shared";
import {
  CODIGOS_ESTADO,
  DEPENDENCIAS,
  ESTADOS,
  ORDEN_DEPENDENCIAS,
  estadoAlSubsanar,
  esObservacion,
  indicacionDe,
  ubicacionDe,
  type CodigoEstado,
  type Modulo,
} from "../domain";
import type {
  EtapaSeguimiento,
  EventoSeguimiento,
  ExpedienteSeguimiento,
  SeguimientoModulo,
  SituacionEtapa,
} from "../application";

export type TonoEvento = "proceso" | "conforme" | "observado" | "subsanado";
export type TonoExpediente = "en-curso" | "observado" | "listo" | "sin-expediente";

// ---- Fechas ----------------------------------------------------------------

/** "Hoy · 09:40" o "15 set. · 14:30" (historial). */
export function momento(fecha: Date, ahora: Date): string {
  return `${capitalizar(diaRelativo(fecha, ahora))} · ${hora(fecha)}`;
}

/** "hoy, 09:40", "ayer, 09:40" o "15 set.": la hora solo si es reciente. */
function cuando(fecha: Date, ahora: Date): string {
  const dia = diaRelativo(fecha, ahora);
  return diasEntre(fecha, ahora) <= 1 ? `${dia}, ${hora(fecha)}` : dia;
}

/** "hoy", "ayer" o "el 15 set." para frases como "Subsanado el 15 set.". */
function elDia(fecha: Date, ahora: Date): string {
  const dia = diaRelativo(fecha, ahora);
  return diasEntre(fecha, ahora) <= 1 ? dia : `el ${dia}`;
}

// ---- Eventos y etapas ------------------------------------------------------

export function tonoDeEvento(evento: EventoSeguimiento): TonoEvento {
  if (evento.observacion) return evento.observacion.subsanadaEl ? "subsanado" : "observado";
  return ESTADOS[evento.codigo].tipo === "proceso" ? "proceso" : "conforme";
}

/** "Subsanado el 04 ago." para observaciones ya superadas; `null` en otro caso. */
export function textoSubsanado(evento: EventoSeguimiento, ahora: Date): string | null {
  const subsanadaEl = evento.observacion?.subsanadaEl;
  return subsanadaEl ? `Subsanado ${elDia(subsanadaEl, ahora)}` : null;
}

/** "Conforme · 11 jun.", "Observado · hoy, 09:40" o "Pendiente". */
export function resumenDeEtapa(etapa: EtapaSeguimiento, ahora: Date): string {
  const ultimo = etapa.eventos.at(-1);
  if (etapa.situacion === "pendiente") return "Pendiente";
  // Etapa actual sin registros: la oficina anterior ya se la pasó (D56).
  if (!ultimo) return "En curso";
  return `${ESTADOS[ultimo.codigo].etiqueta} · ${cuando(ultimo.fecha, ahora)}`;
}

const TEXTO_ETAPA_PENDIENTE: Record<EtapaSeguimiento["dependencia"], string> = {
  "mesa-partes": "Aún no hay movimientos.",
  coordinacion: "Cuando Mesa de Partes confirme tu pago, Coordinación revisará tus requisitos.",
  docente: "Cuando Coordinación asigne a tu Docente Supervisor, empezará la supervisión.",
  bienestar: "Cuando la supervisión esté aprobada, Bienestar registrará el visto bueno final.",
};

/** Etapa actual que aún no tiene registros: el expediente acaba de llegar a esa oficina (D56). */
const TEXTO_ETAPA_ACTUAL: Record<EtapaSeguimiento["dependencia"], string> = {
  "mesa-partes": "Mesa de Partes revisará tu pago.",
  coordinacion: "Coordinación de Carrera revisará tus requisitos.",
  docente: "Tu Docente Supervisor iniciará la supervisión.",
  bienestar: "Bienestar y Empleabilidad registrará el visto bueno final.",
};

/** Texto de una etapa sin eventos. */
export function textoEtapaVacia(etapa: EtapaSeguimiento, hayExpediente: boolean): string {
  if (!hayExpediente) return "Aún no hay movimientos.";
  return etapa.situacion === "actual" ? TEXTO_ETAPA_ACTUAL[etapa.dependencia] : TEXTO_ETAPA_PENDIENTE[etapa.dependencia];
}

/** Las cuatro etapas de un módulo; todas pendientes si aún no hay expediente. */
export function etapasDe(expediente: ExpedienteSeguimiento | null): EtapaSeguimiento[] {
  return (
    expediente?.etapas ??
    ORDEN_DEPENDENCIAS.map((dependencia) => ({
      dependencia,
      nombre: DEPENDENCIAS[dependencia].nombre,
      situacion: "pendiente" as const,
      eventos: [],
    }))
  );
}

/** Etapa que se muestra desplegada al entrar: donde está el expediente. */
export function etapaInicial(expediente: ExpedienteSeguimiento | null): EtapaSeguimiento["dependencia"] | null {
  return expediente?.ubicacion.dependencia ?? null;
}

export type PasoRecorrido = { nombre: string; situacion: SituacionEtapa; actual: boolean };

/** Mini barra de cuatro pasos de la tarjeta de ubicación (celular). */
export function pasosDeRecorrido(expediente: ExpedienteSeguimiento): PasoRecorrido[] {
  return expediente.etapas.map((etapa) => ({
    nombre: DEPENDENCIAS[etapa.dependencia].nombreCorto,
    situacion: etapa.situacion,
    actual: etapa.dependencia === expediente.ubicacion.dependencia,
  }));
}

/** "02, 04 y 08": códigos de los estados de observación, tomados del catálogo. */
export function codigosDeObservacion(): string {
  const codigos = CODIGOS_ESTADO.filter(esObservacion);
  return codigos.length > 1 ? `${codigos.slice(0, -1).join(", ")} y ${codigos.at(-1)}` : codigos.join("");
}

// ---- Expediente ------------------------------------------------------------

export function tonoDeExpediente(expediente: ExpedienteSeguimiento | null): TonoExpediente {
  if (!expediente) return "sin-expediente";
  if (expediente.estado.tipo === "observacion") return "observado";
  if (expediente.estado.tipo === "final") return "listo";
  return "en-curso";
}

/** Texto breve del estado del módulo: "Observado", "Constancia lista", "Sin expediente"… */
export function etiquetaDeModulo({ expediente }: SeguimientoModulo): string {
  return expediente ? ESTADOS[expediente.estado.codigo].etiqueta : "Sin expediente";
}

export type Ubicacion = {
  rotulo: string;
  lugar: string;
  pildora: string;
  desde: string;
  tono: TonoExpediente;
};

/** Contenido de la tarjeta oscura "Tu expediente está en…". */
export function ubicacionDeModulo({ modulo, expediente }: SeguimientoModulo, ahora: Date): Ubicacion {
  const tono = tonoDeExpediente(expediente);
  if (!expediente) {
    return {
      rotulo: `Módulo ${modulo}`,
      lugar: "Aún sin expediente",
      pildora: "Sin expediente",
      desde: "Entrega tu carpeta en Mesa de Partes",
      tono,
    };
  }
  return {
    rotulo: `Módulo ${modulo} · ${tono === "listo" ? "Recoge tu constancia en" : "Tu expediente está en"}`,
    lugar: expediente.ubicacion.nombre,
    pildora: `${expediente.estado.codigo} · ${expediente.estado.nombre}`,
    desde: `Desde ${elDia(expediente.desde, ahora)}, ${hora(expediente.desde)}`,
    tono,
  };
}

export type Progreso = {
  segmentos: SituacionEtapa[];
  ubicacion: { prefijo: string; lugar: string };
  texto: string;
};

/** Barra de cuatro segmentos y textos de la tarjeta de módulo (celular). */
export function progresoDeExpediente(expediente: ExpedienteSeguimiento, ahora: Date): Progreso {
  const segmentos = expediente.etapas.map((etapa) => etapa.situacion);
  const listo = expediente.estado.tipo === "final";
  const posicion = ORDEN_DEPENDENCIAS.indexOf(expediente.ubicacion.dependencia) + 1;
  return {
    segmentos,
    ubicacion: { prefijo: listo ? "Recógela en" : "Está en", lugar: expediente.ubicacion.nombre },
    texto: listo
      ? `Recorrido completo · ${diaRelativo(expediente.desde, ahora)}`
      : `Dependencia ${posicion} de ${ORDEN_DEPENDENCIAS.length} · actualizado ${elDia(expediente.desde, ahora)}`,
  };
}

// ---- Avisos de observación -------------------------------------------------

export type AvisoObservacion = {
  modulo: Modulo;
  expedienteId: string;
  motivo: string;
  entrega: string;
  observado: string;
};

/** Evento de la observación vigente (el último de la oficina actual); `null` si no hay observación. */
function eventoObservado(expediente: ExpedienteSeguimiento): EventoSeguimiento | null {
  if (expediente.estado.tipo !== "observacion") return null;
  const { dependencia } = expediente.ubicacion;
  return expediente.etapas.find((etapa) => etapa.dependencia === dependencia)?.eventos.at(-1) ?? null;
}

const entregaA = (expediente: ExpedienteSeguimiento) =>
  `Entrega tu corrección ${DEPENDENCIAS[expediente.ubicacion.dependencia].conPreposicion}`;

/** Un aviso por cada módulo con una observación vigente (D22). */
export function avisosDeObservacion(seguimiento: SeguimientoModulo[], ahora: Date): AvisoObservacion[] {
  return seguimiento.flatMap(({ modulo, expediente }) => {
    const evento = expediente && eventoObservado(expediente);
    if (!expediente || !evento) return [];
    const fecha = expediente.desde;
    const transcurrido = diasEntre(fecha, ahora) === 0 ? "" : ` · ${haceDias(fecha, ahora)}`;
    return [
      {
        modulo,
        expedienteId: expediente.id,
        motivo: evento.nota ?? "",
        entrega: entregaA(expediente),
        observado: `Observado ${elDia(fecha, ahora)}, ${hora(fecha)}${transcurrido}`,
      },
    ];
  });
}

// ---- Detalle de una observación --------------------------------------------

export type DetalleObservacion =
  | {
      vigente: true;
      modulo: Modulo;
      codigo: CodigoEstado;
      nombre: string;
      motivo: string;
      actor: string;
      /** "Docente Supervisor · Hoy · 09:40" */
      registro: string;
      lugar: string;
      /** Guía en tres pasos, armada desde el catálogo (D22). */
      pasos: string[];
    }
  | { vigente: false; modulo: Modulo };

/**
 * Observación de un expediente del estudiante. Solo busca entre sus propios
 * expedientes: un id ajeno devuelve `null`, igual que uno inexistente (IDOR).
 */
export function detalleDeObservacion(
  seguimiento: SeguimientoModulo[],
  expedienteId: string,
  ahora: Date,
): DetalleObservacion | null {
  const datos = seguimiento.find((m) => m.expediente?.id === expedienteId);
  const expediente = datos?.expediente;
  if (!datos || !expediente) return null;

  const evento = eventoObservado(expediente);
  if (!evento) return { vigente: false, modulo: datos.modulo };

  const { codigo, nombre } = expediente.estado;
  const lugar = DEPENDENCIAS[expediente.ubicacion.dependencia].nombre;
  const vuelveA = estadoAlSubsanar(codigo);
  return {
    vigente: true,
    modulo: datos.modulo,
    codigo,
    nombre,
    motivo: evento.nota ?? "",
    actor: evento.actor,
    registro: `${lugar} · ${momento(evento.fecha, ahora)}`,
    lugar,
    pasos: [
      indicacionDe(codigo) ?? "Corrige lo indicado en la observación.",
      `${entregaA(expediente)}.`,
      vuelveA
        ? `Cuando registren tu corrección, tu expediente vuelve a ${vuelveA} · ${ESTADOS[vuelveA].nombre} y te llegará un correo.`
        : "Cuando registren tu corrección, te llegará un correo.",
    ],
  };
}

// ---- Constancia -------------------------------------------------------------

export type ResumenConstancia = {
  vistoBueno: string;
  /** Tiempo en cada oficina: desde que llegó hasta su último registro. */
  tramos: { nombre: string; periodo: string }[];
  dias: number;
};

/** Datos de la constancia lista para recoger; `null` si el expediente aún no llega a 10. */
export function resumenDeConstancia(expediente: ExpedienteSeguimiento): ResumenConstancia | null {
  if (expediente.estado.tipo !== "final") return null;
  const eventos = expediente.etapas.flatMap((etapa) => etapa.eventos);
  const recepcion = eventos[0].fecha;

  let llegada = recepcion;
  const tramos = expediente.etapas.map((etapa) => {
    const salida = etapa.eventos.at(-1)?.fecha ?? llegada;
    const tramo = { nombre: etapa.nombre, periodo: rangoDeFechas(llegada, salida) };
    llegada = salida;
    return tramo;
  });

  return {
    vistoBueno: `${DEPENDENCIAS.bienestar.nombre} registró el visto bueno final el ${fechaConAnio(expediente.desde)}.`,
    tramos,
    dias: diasEntre(recepcion, expediente.desde),
  };
}


// ---- Últimos movimientos ---------------------------------------------------

export type Movimiento = {
  clave: string;
  codigo: CodigoEstado;
  tono: TonoEvento;
  titulo: string;
  detalle: string;
};

/** Los cambios más recientes de todos los módulos. */
export function ultimosMovimientos(seguimiento: SeguimientoModulo[], ahora: Date, cantidad = 3): Movimiento[] {
  return seguimiento
    .flatMap(({ modulo, expediente }) =>
      (expediente?.etapas ?? []).flatMap((etapa) => etapa.eventos.map((evento) => ({ modulo, evento }))),
    )
    .sort((a, b) => b.evento.fecha.getTime() - a.evento.fecha.getTime())
    .slice(0, cantidad)
    .map(({ modulo, evento }) => ({
      clave: `${modulo}-${evento.codigo}-${evento.fecha.getTime()}`,
      codigo: evento.codigo,
      tono: tonoDeEvento(evento),
      titulo: `${evento.nombre} · Módulo ${modulo}`,
      detalle: `${capitalizar(cuando(evento.fecha, ahora))} · ${DEPENDENCIAS[ubicacionDe(evento.codigo)].nombre}`,
    }));
}

/** Módulos con la constancia lista para recoger. */
export function constanciasListas(seguimiento: SeguimientoModulo[]): SeguimientoModulo[] {
  return seguimiento.filter((m) => m.expediente?.estado.tipo === "final");
}

// ---- Orden y selección de módulos -----------------------------------------

/** Orden de "Mis expedientes" (celular): primero los observados; el resto, en su orden. */
export function ordenParaInicio(seguimiento: SeguimientoModulo[]): SeguimientoModulo[] {
  const observado = (m: SeguimientoModulo) => m.expediente?.estado.tipo === "observacion";
  return [...seguimiento.filter(observado), ...seguimiento.filter((m) => !observado(m))];
}


/** Módulo que se muestra primero: el observado; si no, el último actualizado; si no, el I. */
export function moduloInicial(seguimiento: SeguimientoModulo[]): Modulo {
  const conExpediente = seguimiento.flatMap(({ modulo, expediente }) => (expediente ? [{ modulo, expediente }] : []));
  const observado = conExpediente.find(({ expediente }) => expediente.estado.tipo === "observacion");
  if (observado) return observado.modulo;
  const [reciente] = conExpediente.sort((a, b) => b.expediente.desde.getTime() - a.expediente.desde.getTime());
  return reciente?.modulo ?? "I";
}
