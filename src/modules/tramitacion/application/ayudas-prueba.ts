// Dependencias falsas para probar los casos de uso. No se exporta en index.ts.
import type { Expediente, ExpedienteCambioDeEstado } from "../domain";
import { DOCENTES } from "../domain/ayudas-prueba";
import { crearRepositorioEnMemoria } from "../infrastructure/repositorio-en-memoria";
import type { DependenciasTramitacion, DocenteDelDirectorio } from "./puertos";

export const AHORA = new Date("2026-10-10T12:00:00-05:00");

/** Paredes y Vargas en actividad; Salazar, desactivado. */
export const DOCENTES_DEL_DIRECTORIO: readonly DocenteDelDirectorio[] = [
  { ...DOCENTES.paredes, activo: true, enSupervision: 2 },
  { ...DOCENTES.vargas, activo: true, enSupervision: 0 },
  { id: "doc-salazar", nombre: "Lic. C. Salazar", activo: false, enSupervision: 1 },
];

export function crearDependenciasDePrueba(iniciales: readonly Expediente[] = []) {
  const eventosPublicados: ExpedienteCambioDeEstado[] = [];
  let contador = 0;

  const dependencias: DependenciasTramitacion = {
    repositorio: crearRepositorioEnMemoria(iniciales),
    docentes: { listar: async () => DOCENTES_DEL_DIRECTORIO },
    publicador: { publicar: async (evento) => void eventosPublicados.push(evento) },
    reloj: { ahora: () => AHORA },
    ids: { nuevoId: () => `exp-${++contador}` },
  };

  return { dependencias, eventosPublicados };
}
