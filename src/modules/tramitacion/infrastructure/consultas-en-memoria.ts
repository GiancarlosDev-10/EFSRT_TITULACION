import type { ConsultasDeOficina, ExpedienteRepository, FichaEstudiante } from "../application";

/**
 * Adaptador de prueba: lee del repositorio en memoria. Sin sesiones, ve todo
 * (en Supabase, el RLS recorta lo que ve cada oficina).
 */
export function crearConsultasEnMemoria(
  repositorio: ExpedienteRepository,
  estudiantes: readonly FichaEstudiante[],
): ConsultasDeOficina {
  return {
    async listarExpedientes() {
      const porEstudiante = await Promise.all(
        estudiantes.map(async (estudiante) =>
          (await repositorio.listarPorEstudiante(estudiante.id)).map((expediente) => ({ expediente, estudiante })),
        ),
      );
      return porEstudiante.flat();
    },

    async buscarExpediente(id) {
      const expediente = await repositorio.buscarPorId(id);
      const estudiante = expediente && estudiantes.find((e) => e.id === expediente.estudianteId);
      return expediente && estudiante ? { expediente, estudiante } : null;
    },
  };
}
