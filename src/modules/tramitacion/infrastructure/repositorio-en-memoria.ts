import { exito, fallo, permiteCambiarDocente, type Expediente } from "../domain";
import type { ExpedienteRepository } from "../application";

/** Adaptador de prueba: guarda los expedientes en memoria (se pierden al reiniciar). */
export function crearRepositorioEnMemoria(iniciales: readonly Expediente[] = []): ExpedienteRepository {
  const expedientes = new Map(iniciales.map((expediente) => [expediente.id, expediente]));

  return {
    async buscarPorId(id) {
      return expedientes.get(id) ?? null;
    },

    async listarPorEstudiante(estudianteId) {
      return [...expedientes.values()].filter((e) => e.estudianteId === estudianteId);
    },

    async crear(expediente) {
      const duplicado = [...expedientes.values()].some(
        (e) => e.estudianteId === expediente.estudianteId && e.modulo === expediente.modulo,
      );
      if (duplicado) return fallo("EXPEDIENTE_YA_EXISTE");
      expedientes.set(expediente.id, expediente);
      return exito(undefined);
    },

    async registrarCambio(expedienteId, registro) {
      const actual = expedientes.get(expedienteId);
      if (!actual) return fallo("EXPEDIENTE_NO_ENCONTRADO");
      if (actual.estado !== registro.estadoAnterior) return fallo("CONFLICTO_DE_ESTADO");
      expedientes.set(expedienteId, {
        ...actual,
        estado: registro.estadoNuevo,
        historial: [...actual.historial, registro],
        docente: registro.docente ?? actual.docente,
      });
      return exito(undefined);
    },

    async registrarCambioDocente(expedienteId, cambio) {
      const actual = expedientes.get(expedienteId);
      if (!actual) return fallo("EXPEDIENTE_NO_ENCONTRADO");
      if (actual.docente?.id !== cambio.anterior.id || !permiteCambiarDocente(actual.estado)) {
        return fallo("CONFLICTO_DE_ESTADO");
      }
      expedientes.set(expedienteId, { ...actual, docente: cambio.nuevo, cambiosDocente: [...actual.cambiosDocente, cambio] });
      return exito(undefined);
    },
  };
}
