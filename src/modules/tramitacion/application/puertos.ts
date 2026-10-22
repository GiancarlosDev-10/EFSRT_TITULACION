// Puertos: lo que los casos de uso necesitan del exterior, sin saber cómo se
// implementa. Hoy se conectan adaptadores en memoria; después, Supabase.
import type { Expediente, ExpedienteCambioDeEstado, RegistroHistorial, Resultado } from "../domain";

export type ErrorRepositorio = "EXPEDIENTE_NO_ENCONTRADO" | "EXPEDIENTE_YA_EXISTE" | "CONFLICTO_DE_ESTADO";

export interface ExpedienteRepository {
  buscarPorId(id: string): Promise<Expediente | null>;
  listarPorEstudiante(estudianteId: string): Promise<readonly Expediente[]>;
  /** Guarda un expediente recién abierto. Falla si el estudiante ya tiene uno en ese módulo. */
  crear(expediente: Expediente): Promise<Resultado<void, "EXPEDIENTE_YA_EXISTE">>;
  /**
   * Añade `registro` al final del historial y actualiza el estado. Falla con
   * CONFLICTO_DE_ESTADO si el estado guardado ya no es `registro.estadoAnterior`
   * (otra persona lo cambió entre la lectura y la escritura).
   */
  registrarCambio(
    expedienteId: string,
    registro: RegistroHistorial,
  ): Promise<Resultado<void, "EXPEDIENTE_NO_ENCONTRADO" | "CONFLICTO_DE_ESTADO">>;
}

/** Datos del estudiante que necesita su vista de seguimiento. */
export type EstudianteRegistrado = {
  id: string;
  nombre: string;
  /** Identificador de la carrera (los nombres de módulos se buscan con él). */
  carrera: string;
};

export interface DirectorioEstudiantes {
  /** Estudiante enlazado a la cuenta `usuarioId`, o `null` si no hay ninguno. */
  buscarPorUsuario(usuarioId: string): Promise<EstudianteRegistrado | null>;
}

export interface PublicadorDeEventos {
  publicar(evento: ExpedienteCambioDeEstado): Promise<void>;
}

export interface Reloj {
  ahora(): Date;
}

export interface GeneradorDeIds {
  nuevoId(): string;
}

/** Todo lo que pueden necesitar los casos de uso; cada uno toma solo lo suyo. */
export type DependenciasTramitacion = {
  repositorio: ExpedienteRepository;
  publicador: PublicadorDeEventos;
  reloj: Reloj;
  ids: GeneradorDeIds;
};
