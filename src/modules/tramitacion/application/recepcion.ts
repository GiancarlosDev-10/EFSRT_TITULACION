// Mesa de Partes recibe la carpeta física: busca al estudiante (o lo registra
// si es su primera carpeta) y elige el módulo. La apertura del expediente la
// hace registrarRecepcion.
import {
  ESTADO_INICIAL,
  MODULOS,
  exito,
  fallo,
  puedeRegistrar,
  validarDatosEstudiante,
  type Actor,
  type CodigoEstado,
  type EntradaEstudiante,
  type ErroresEstudiante,
  type Modulo,
  type Resultado,
} from "../domain";
import type { DependenciasTramitacion, ErrorRegistroEstudiante, FichaEstudiante } from "./puertos";

/** Un estudiante con lo que tiene en cada módulo: sirve para elegir el módulo libre. */
export type CandidatoRecepcion = {
  estudiante: FichaEstudiante;
  /** `null` si el módulo está libre (aún no entregó esa carpeta). */
  modulos: Record<Modulo, { expedienteId: string; estado: CodigoEstado } | null>;
};

/** Menos de dos caracteres no es una búsqueda (igual que `buscar_estudiantes` en la base). */
const LARGO_MINIMO_BUSQUEDA = 2;

type Lecturas = Pick<DependenciasTramitacion, "estudiantes" | "repositorio">;

async function aCandidato(repositorio: Lecturas["repositorio"], estudiante: FichaEstudiante): Promise<CandidatoRecepcion> {
  const expedientes = await repositorio.listarPorEstudiante(estudiante.id);
  const modulos = Object.fromEntries(
    MODULOS.map((modulo) => {
      const expediente = expedientes.find((e) => e.modulo === modulo);
      return [modulo, expediente ? { expedienteId: expediente.id, estado: expediente.estado } : null];
    }),
  ) as CandidatoRecepcion["modulos"];
  return { estudiante, modulos };
}

export function crearBuscarParaRecepcion({ estudiantes, repositorio }: Lecturas) {
  return async function buscarParaRecepcion(consulta: string): Promise<CandidatoRecepcion[]> {
    const texto = consulta.trim();
    if (texto.length < LARGO_MINIMO_BUSQUEDA) return [];
    const encontrados = await estudiantes.buscar(texto);
    return Promise.all(encontrados.map((estudiante) => aCandidato(repositorio, estudiante)));
  };
}

export function crearObtenerCandidatoRecepcion({ estudiantes, repositorio }: Lecturas) {
  return async function obtenerCandidatoRecepcion(estudianteId: string): Promise<CandidatoRecepcion | null> {
    const estudiante = await estudiantes.buscarPorId(estudianteId);
    return estudiante ? aCandidato(repositorio, estudiante) : null;
  };
}

export type ErrorAltaEstudiante =
  | { tipo: "DATOS_INVALIDOS"; campos: ErroresEstudiante }
  | { tipo: "DEPENDENCIA_NO_AUTORIZADA" | ErrorRegistroEstudiante };

export type SolicitudAltaEstudiante = {
  /** Lo pone el servidor desde la sesión, nunca el cliente. */
  actor: Actor;
  datos: EntradaEstudiante;
};

/**
 * Registra a un estudiante nuevo. Lo hace la dependencia que abre los
 * expedientes (la del estado inicial): quien recibe la carpeta.
 */
export function crearRegistrarEstudiante({ estudiantes }: Pick<DependenciasTramitacion, "estudiantes">) {
  return async function registrarEstudiante({
    actor,
    datos,
  }: SolicitudAltaEstudiante): Promise<Resultado<FichaEstudiante, ErrorAltaEstudiante>> {
    if (!puedeRegistrar(actor.dependencia, ESTADO_INICIAL)) return fallo({ tipo: "DEPENDENCIA_NO_AUTORIZADA" });

    const validos = validarDatosEstudiante(datos);
    if (!validos.ok) return fallo({ tipo: "DATOS_INVALIDOS", campos: validos.error });

    const registrado = await estudiantes.registrar(validos.valor);
    if (!registrado.ok) return fallo({ tipo: registrado.error });
    return exito(registrado.valor);
  };
}
