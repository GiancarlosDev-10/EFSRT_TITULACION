// Lo que reciben las pantallas de las oficinas: la bandeja y el detalle de un
// expediente, ya clasificados con las reglas del catálogo. Sin textos de
// interfaz (los pone ui/).
import {
  ESTADO_ASIGNACION_DOCENTE,
  MODULOS,
  esObservacion,
  permiteCambiarDocente,
  puedeRegistrar,
  transicionesDisponibles,
  ubicacionDe,
  type CodigoEstado,
  type Dependencia,
  type DocenteAsignado,
  type Expediente,
  type Modulo,
} from "../domain";
import type {
  DependenciasTramitacion,
  DocenteDelDirectorio,
  ExpedienteConEstudiante,
  FichaEstudiante,
} from "./puertos";

export type EstudianteEnBandeja = {
  id: string;
  nombre: string;
  /** "DNI 71234568" */
  documento: string;
};

export type FilaBandeja = {
  expedienteId: string;
  modulo: Modulo;
  estado: CodigoEstado;
  estudiante: EstudianteEnBandeja;
  docente: DocenteAsignado | null;
  /** El docente vigente fue desactivado y quien mira es quien debe cambiarlo. */
  docenteDesactivado: boolean;
  /** Último movimiento (cambio de estado o de docente). */
  ultimoCambio: Date;
};

export type FilaEstudiante = {
  estudiante: EstudianteEnBandeja;
  /** Un expediente por módulo; `null` si no tiene o la sesión no lo ve. */
  modulos: Record<Modulo, FilaBandeja | null>;
};

export type Bandeja = {
  /** Esperan algo de esta oficina; lo que más espera, primero. */
  porAtender: FilaBandeja[];
  /** Observados por esta oficina: esperan la corrección del estudiante. */
  observados: FilaBandeja[];
  /** Cada estudiante con sus módulos; el de movimiento más reciente, primero. */
  estudiantes: FilaEstudiante[];
};

/** "Giancarlos Ormeño" */
export function nombreCompleto({ nombres, apellidos }: Pick<FichaEstudiante, "nombres" | "apellidos">): string {
  return `${nombres} ${apellidos}`;
}

const sinTildes = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const soloDocumento = (texto: string) => texto.replace(/[\s.-]/g, "").toUpperCase();

/**
 * Mismo criterio que `buscar_estudiantes` en la base (D38): si el texto lleva
 * dígitos, por documento (también sin los ceros iniciales del carné); si no,
 * cada palabra debe aparecer en nombres y apellidos, sin tildes ni mayúsculas.
 */
export function coincideConEstudiante(estudiante: FichaEstudiante, consulta: string): boolean {
  const texto = consulta.trim();
  if (texto === "") return true;
  if (/\d/.test(texto)) {
    const documento = soloDocumento(texto);
    const numero = estudiante.numeroDocumento;
    return numero.startsWith(documento) || numero.replace(/^0+/, "").startsWith(documento.replace(/^0+/, ""));
  }
  const nombre = sinTildes(nombreCompleto(estudiante));
  return sinTildes(texto).split(/\s+/).every((palabra) => nombre.includes(palabra));
}

function ultimoCambio(expediente: Expediente): Date {
  const fechas = [expediente.historial.at(-1)?.fecha, expediente.cambiosDocente.at(-1)?.fecha].filter(
    (fecha): fecha is Date => fecha !== undefined,
  );
  return new Date(Math.max(...fechas.map((fecha) => fecha.getTime())));
}

/** ¿Esta dependencia asigna y cambia al docente? (la del estado de asignación). */
const asignaDocente = (dependencia: Dependencia) => puedeRegistrar(dependencia, ESTADO_ASIGNACION_DOCENTE);

function estaDesactivado(expediente: Expediente, inactivos: ReadonlySet<string>): boolean {
  return expediente.docente !== null && inactivos.has(expediente.docente.id) && permiteCambiarDocente(expediente.estado);
}

function aEstudianteEnBandeja(estudiante: FichaEstudiante): EstudianteEnBandeja {
  return {
    id: estudiante.id,
    nombre: nombreCompleto(estudiante),
    documento: `${estudiante.tipoDocumento} ${estudiante.numeroDocumento}`,
  };
}

function aFila({ expediente, estudiante }: ExpedienteConEstudiante, inactivos: ReadonlySet<string>): FilaBandeja {
  return {
    expedienteId: expediente.id,
    modulo: expediente.modulo,
    estado: expediente.estado,
    estudiante: aEstudianteEnBandeja(estudiante),
    docente: expediente.docente,
    docenteDesactivado: estaDesactivado(expediente, inactivos),
    ultimoCambio: ultimoCambio(expediente),
  };
}

const masAntiguoPrimero = (a: FilaBandeja, b: FilaBandeja) => a.ultimoCambio.getTime() - b.ultimoCambio.getTime();

/** Docentes del directorio, solo si esta dependencia es la que asigna (a las demás no les llegan). */
async function docentesPara(
  dependencia: Dependencia,
  docentes: DependenciasTramitacion["docentes"],
): Promise<readonly DocenteDelDirectorio[]> {
  return asignaDocente(dependencia) ? docentes.listar() : [];
}

export function crearObtenerBandeja({ consultas, docentes }: Pick<DependenciasTramitacion, "consultas" | "docentes">) {
  return async function obtenerBandeja(dependencia: Dependencia, consulta = ""): Promise<Bandeja> {
    const [expedientes, directorio] = await Promise.all([consultas.listarExpedientes(), docentesPara(dependencia, docentes)]);
    const inactivos = new Set(directorio.filter((d) => !d.activo).map((d) => d.id));
    const filas = expedientes
      .filter(({ estudiante }) => coincideConEstudiante(estudiante, consulta))
      .map((dato) => aFila(dato, inactivos));

    const porAtender = filas.filter(
      (fila) =>
        (transicionesDisponibles(fila.estado, dependencia).length > 0 && !esObservacion(fila.estado)) ||
        fila.docenteDesactivado,
    );
    const observados = filas.filter((fila) => esObservacion(fila.estado) && ubicacionDe(fila.estado) === dependencia);

    const porEstudiante = new Map<string, FilaEstudiante>();
    for (const fila of filas) {
      const grupo = porEstudiante.get(fila.estudiante.id) ?? {
        estudiante: fila.estudiante,
        modulos: Object.fromEntries(MODULOS.map((modulo) => [modulo, null])) as FilaEstudiante["modulos"],
      };
      grupo.modulos[fila.modulo] = fila;
      porEstudiante.set(fila.estudiante.id, grupo);
    }
    const masReciente = (grupo: FilaEstudiante) =>
      Math.max(...Object.values(grupo.modulos).map((fila) => fila?.ultimoCambio.getTime() ?? 0));

    return {
      porAtender: porAtender.sort(masAntiguoPrimero),
      observados: observados.sort(masAntiguoPrimero),
      estudiantes: [...porEstudiante.values()].sort((a, b) => masReciente(b) - masReciente(a)),
    };
  };
}

// ---- Detalle del expediente ------------------------------------------------

export type MovimientoDeOficina =
  | {
      tipo: "estado";
      codigo: CodigoEstado;
      fecha: Date;
      actor: string;
      nota: string | null;
      /** Solo en la asignación: el docente elegido. */
      docente: string | null;
      /** Observación vigente (es el estado actual) o ya subsanada; `null` si no es observación. */
      observacion: "vigente" | "subsanada" | null;
    }
  | { tipo: "cambio-docente"; fecha: Date; actor: string; anterior: string; nuevo: string; motivo: string };

export type ExpedienteDeOficina = {
  id: string;
  modulo: Modulo;
  estado: CodigoEstado;
  estudiante: FichaEstudiante;
  docente: DocenteAsignado | null;
  docenteDesactivado: boolean;
  /** Historial y cambios de docente juntos; lo más reciente primero. */
  movimientos: MovimientoDeOficina[];
  /** Estados que esta oficina puede registrar ahora. */
  acciones: readonly CodigoEstado[];
  /** Esta oficina puede cambiar al docente ahora. */
  puedeCambiarDocente: boolean;
  /** Docentes activos para asignar o cambiar; vacío si esta oficina no asigna. */
  docentesDisponibles: DocenteDelDirectorio[];
};

function movimientos(expediente: Expediente): MovimientoDeOficina[] {
  const ultimo = expediente.historial.length - 1;
  const deEstado: MovimientoDeOficina[] = expediente.historial.map((registro, i) => ({
    tipo: "estado",
    codigo: registro.estadoNuevo,
    fecha: registro.fecha,
    actor: registro.actor.nombre,
    nota: registro.motivo,
    docente: registro.docente?.nombre ?? null,
    observacion: esObservacion(registro.estadoNuevo) ? (i === ultimo ? "vigente" : "subsanada") : null,
  }));
  const deDocente: MovimientoDeOficina[] = expediente.cambiosDocente.map((cambio) => ({
    tipo: "cambio-docente",
    fecha: cambio.fecha,
    actor: cambio.actor.nombre,
    anterior: cambio.anterior.nombre,
    nuevo: cambio.nuevo.nombre,
    motivo: cambio.motivo,
  }));
  // Cronológico (sort es estable: a igual fecha, en orden de registro) y luego invertido.
  return [...deEstado, ...deDocente].sort((a, b) => a.fecha.getTime() - b.fecha.getTime()).reverse();
}

export function crearObtenerExpedienteDeOficina({
  consultas,
  docentes,
}: Pick<DependenciasTramitacion, "consultas" | "docentes">) {
  return async function obtenerExpedienteDeOficina(
    expedienteId: string,
    dependencia: Dependencia,
  ): Promise<ExpedienteDeOficina | null> {
    const [dato, directorio] = await Promise.all([
      consultas.buscarExpediente(expedienteId),
      docentesPara(dependencia, docentes),
    ]);
    if (!dato) return null;

    const { expediente, estudiante } = dato;
    const inactivos = new Set(directorio.filter((d) => !d.activo).map((d) => d.id));
    return {
      id: expediente.id,
      modulo: expediente.modulo,
      estado: expediente.estado,
      estudiante,
      docente: expediente.docente,
      docenteDesactivado: estaDesactivado(expediente, inactivos),
      movimientos: movimientos(expediente),
      acciones: transicionesDisponibles(expediente.estado, dependencia),
      puedeCambiarDocente: asignaDocente(dependencia) && expediente.docente !== null && permiteCambiarDocente(expediente.estado),
      docentesDisponibles: directorio.filter((d) => d.activo),
    };
  };
}
