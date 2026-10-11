// Dependencias falsas para probar los casos de uso. No se exporta en index.ts.
import type { Expediente, ExpedienteCambioDeEstado } from "../domain";
import { crearRepositorioEnMemoria } from "../infrastructure/repositorio-en-memoria";
import type { DependenciasTramitacion } from "./puertos";

export const AHORA = new Date("2026-10-10T12:00:00-05:00");

export function crearDependenciasDePrueba(iniciales: readonly Expediente[] = []) {
  const eventosPublicados: ExpedienteCambioDeEstado[] = [];
  let contador = 0;

  const dependencias: DependenciasTramitacion = {
    repositorio: crearRepositorioEnMemoria(iniciales),
    publicador: { publicar: async (evento) => void eventosPublicados.push(evento) },
    reloj: { ahora: () => AHORA },
    ids: { nuevoId: () => `exp-${++contador}` },
  };

  return { dependencias, eventosPublicados };
}
