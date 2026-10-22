import {
  DEPENDENCIAS,
  ESTADOS,
  MODULOS,
  ORDEN_DEPENDENCIAS,
  esFinal,
  esObservacion,
  ubicacionDe,
  type CodigoEstado,
  type Dependencia,
  type Expediente,
  type Modulo,
  type RegistroHistorial,
  type TipoEstado,
} from "../domain";
import type { DependenciasTramitacion } from "./puertos";

// Lo que recibe la pantalla del estudiante: datos ya calculados, sin reglas.
// Las fechas van como Date; el formato (es-PE) lo pone la interfaz.

export type SituacionEtapa = "completada" | "actual" | "observada" | "pendiente";

export type EventoSeguimiento = {
  codigo: CodigoEstado;
  nombre: string;
  fecha: Date;
  actor: string;
  nota: string | null;
  /** Nombre del Docente Supervisor, solo en el registro de asignación. */
  docente: string | null;
  /** `null` si no es una observación. Si lo es: `subsanadaEl` es `null` mientras siga vigente. */
  observacion: { subsanadaEl: Date | null } | null;
};

export type EtapaSeguimiento = {
  dependencia: Dependencia;
  nombre: string;
  situacion: SituacionEtapa;
  eventos: EventoSeguimiento[];
};

export type ExpedienteSeguimiento = {
  id: string;
  estado: { codigo: CodigoEstado; nombre: string; tipo: TipoEstado };
  ubicacion: { dependencia: Dependencia; nombre: string };
  /** Fecha del último cambio: desde cuándo está en el estado actual. */
  desde: Date;
  etapas: EtapaSeguimiento[];
};

export type SeguimientoModulo = {
  modulo: Modulo;
  /** `null` si el estudiante aún no entregó la carpeta de este módulo. */
  expediente: ExpedienteSeguimiento | null;
};

function situacionDe(dependencia: Dependencia, estado: CodigoEstado): SituacionEtapa {
  const etapa = ORDEN_DEPENDENCIAS.indexOf(dependencia);
  const actual = ORDEN_DEPENDENCIAS.indexOf(ubicacionDe(estado));
  if (etapa < actual || (etapa === actual && esFinal(estado))) return "completada";
  if (etapa > actual) return "pendiente";
  return esObservacion(estado) ? "observada" : "actual";
}

function aEvento(registro: RegistroHistorial, siguiente: RegistroHistorial | undefined): EventoSeguimiento {
  return {
    codigo: registro.estadoNuevo,
    nombre: ESTADOS[registro.estadoNuevo].nombre,
    fecha: registro.fecha,
    actor: registro.actor.nombre,
    nota: registro.motivo,
    docente: registro.docente?.nombre ?? null,
    observacion: esObservacion(registro.estadoNuevo) ? { subsanadaEl: siguiente?.fecha ?? null } : null,
  };
}

function aSeguimiento({ id, estado, historial }: Expediente): ExpedienteSeguimiento {
  const eventos = historial.map((registro, i) => aEvento(registro, historial[i + 1]));
  const ubicacion = ubicacionDe(estado);

  return {
    id,
    estado: { codigo: estado, nombre: ESTADOS[estado].nombre, tipo: ESTADOS[estado].tipo },
    ubicacion: { dependencia: ubicacion, nombre: DEPENDENCIAS[ubicacion].nombre },
    desde: historial[historial.length - 1].fecha,
    etapas: ORDEN_DEPENDENCIAS.map((dependencia) => ({
      dependencia,
      nombre: DEPENDENCIAS[dependencia].nombre,
      situacion: situacionDe(dependencia, estado),
      eventos: eventos.filter((evento) => ubicacionDe(evento.codigo) === dependencia),
    })),
  };
}

/** Los tres módulos del estudiante, tenga o no expediente en cada uno. */
export function crearObtenerSeguimientoDelEstudiante({ repositorio }: Pick<DependenciasTramitacion, "repositorio">) {
  return async function obtenerSeguimientoDelEstudiante(
    /** Sale de la sesión, nunca de la URL: así nadie consulta expedientes ajenos. */
    estudianteId: string,
  ): Promise<SeguimientoModulo[]> {
    const expedientes = await repositorio.listarPorEstudiante(estudianteId);
    return MODULOS.map((modulo) => {
      const expediente = expedientes.find((e) => e.modulo === modulo);
      return { modulo, expediente: expediente ? aSeguimiento(expediente) : null };
    });
  };
}
