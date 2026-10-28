// Puertos: lo que los casos de uso necesitan del exterior, sin saber cómo se
// implementa. La aplicación usa los adaptadores de Supabase; las pruebas, los
// de memoria.
import type {
  CambioDocente,
  DatosEstudiante,
  DocenteAsignado,
  EventoTramitacion,
  Expediente,
  RegistroHistorial,
  Resultado,
} from "../domain";

export type ErrorRepositorio =
  | "EXPEDIENTE_NO_ENCONTRADO"
  | "EXPEDIENTE_YA_EXISTE"
  | "CONFLICTO_DE_ESTADO"
  /** El docente elegido no existe, no es docente o está desactivado. */
  | "DOCENTE_NO_VALIDO";

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
  ): Promise<Resultado<void, "EXPEDIENTE_NO_ENCONTRADO" | "CONFLICTO_DE_ESTADO" | "DOCENTE_NO_VALIDO">>;
  /**
   * Añade un cambio de docente. Falla con CONFLICTO_DE_ESTADO si el docente
   * vigente ya no es `cambio.anterior` o el estado ya no permite cambiarlo.
   */
  registrarCambioDocente(
    expedienteId: string,
    cambio: CambioDocente,
  ): Promise<Resultado<void, "EXPEDIENTE_NO_ENCONTRADO" | "CONFLICTO_DE_ESTADO" | "DOCENTE_NO_VALIDO">>;
}

/** Datos del estudiante que necesita su vista de seguimiento. */
export type EstudianteRegistrado = {
  id: string;
  nombre: string;
  /** Identificador de la carrera (los nombres de módulos se buscan con él). */
  carrera: string;
};

/** Datos del estudiante que ve una oficina (D38). */
export type FichaEstudiante = DatosEstudiante & { id: string };

export type ErrorRegistroEstudiante = "DOCUMENTO_YA_REGISTRADO" | "CORREO_YA_REGISTRADO";

export interface DirectorioEstudiantes {
  /** Estudiante enlazado a la cuenta `usuarioId`, o `null` si no hay ninguno. */
  buscarPorUsuario(usuarioId: string): Promise<EstudianteRegistrado | null>;
  /** Búsqueda de Mesa de Partes (D38): por documento si lleva dígitos; si no, por nombre. Hasta 20. */
  buscar(consulta: string): Promise<readonly FichaEstudiante[]>;
  /** `null` si no existe o la sesión no puede verlo. */
  buscarPorId(id: string): Promise<FichaEstudiante | null>;
  /** Registra a un estudiante nuevo. Falla si su documento o alguno de sus correos ya está registrado. */
  registrar(datos: DatosEstudiante): Promise<Resultado<FichaEstudiante, ErrorRegistroEstudiante>>;
}

export type ExpedienteConEstudiante = {
  expediente: Expediente;
  estudiante: FichaEstudiante;
};

/** Lecturas de las pantallas de oficina. Qué expedientes ve cada sesión lo decide la base (RLS). */
export interface ConsultasDeOficina {
  /** Todos los expedientes que la sesión puede ver, con su estudiante. */
  listarExpedientes(): Promise<readonly ExpedienteConEstudiante[]>;
  /** `null` si no existe o la sesión no puede verlo. */
  buscarExpediente(id: string): Promise<ExpedienteConEstudiante | null>;
}

/** Docente Supervisor del personal, con cuántos expedientes supervisa ahora. */
export type DocenteDelDirectorio = DocenteAsignado & {
  activo: boolean;
  enSupervision: number;
};

export interface DirectorioDocentes {
  /** Todos los docentes, también los desactivados (sus expedientes hay que reasignarlos). */
  listar(): Promise<readonly DocenteDelDirectorio[]>;
}

export interface PublicadorDeEventos {
  publicar(evento: EventoTramitacion): Promise<void>;
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
  estudiantes: DirectorioEstudiantes;
  consultas: ConsultasDeOficina;
  docentes: DirectorioDocentes;
  publicador: PublicadorDeEventos;
  reloj: Reloj;
  ids: GeneradorDeIds;
};

/** Docente activo con ese id, con el nombre que tiene hoy; `null` si no existe o está desactivado. */
export async function buscarDocenteActivo(docentes: DirectorioDocentes, id: string): Promise<DocenteAsignado | null> {
  const docente = (await docentes.listar()).find((d) => d.id === id && d.activo);
  return docente ? { id: docente.id, nombre: docente.nombre } : null;
}
