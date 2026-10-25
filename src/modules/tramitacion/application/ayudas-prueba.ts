// Dependencias falsas para probar los casos de uso. No se exporta en index.ts.
import type { Expediente, ExpedienteCambioDeEstado } from "../domain";
import { DOCENTES } from "../domain/ayudas-prueba";
import { crearConsultasEnMemoria } from "../infrastructure/consultas-en-memoria";
import { crearDirectorioEnMemoria } from "../infrastructure/directorio-en-memoria";
import { ESTUDIANTE_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { crearRepositorioEnMemoria } from "../infrastructure/repositorio-en-memoria";
import type { DependenciasTramitacion, DocenteDelDirectorio, FichaEstudiante } from "./puertos";

export const AHORA = new Date("2026-10-10T12:00:00-05:00");

/** Paredes y Vargas en actividad; Salazar, desactivado. */
export const DOCENTES_DEL_DIRECTORIO: readonly DocenteDelDirectorio[] = [
  { ...DOCENTES.paredes, activo: true, enSupervision: 2 },
  { ...DOCENTES.vargas, activo: true, enSupervision: 0 },
  { id: "doc-salazar", nombre: "Lic. C. Salazar", activo: false, enSupervision: 1 },
];

/** Ficha del estudiante de los datos de prueba (dueño de EXPEDIENTES_DE_PRUEBA). */
export const FICHA_DE_PRUEBA: FichaEstudiante = {
  id: ESTUDIANTE_DE_PRUEBA.id,
  nombres: "Giancarlos",
  apellidos: "Ormeño",
  tipoDocumento: "DNI",
  numeroDocumento: "70000001",
  carrera: ESTUDIANTE_DE_PRUEBA.carrera,
  correoInstitucional: ESTUDIANTE_DE_PRUEBA.correo,
  correoPersonal: null,
};

export function crearDependenciasDePrueba(
  iniciales: readonly Expediente[] = [],
  estudiantes: readonly FichaEstudiante[] = [FICHA_DE_PRUEBA],
) {
  const eventosPublicados: ExpedienteCambioDeEstado[] = [];
  let contador = 0;
  const repositorio = crearRepositorioEnMemoria(iniciales);

  const dependencias: DependenciasTramitacion = {
    repositorio,
    estudiantes: crearDirectorioEnMemoria(estudiantes, () => `est-${++contador}`),
    consultas: crearConsultasEnMemoria(repositorio, estudiantes),
    docentes: { listar: async () => DOCENTES_DEL_DIRECTORIO },
    publicador: { publicar: async (evento) => void eventosPublicados.push(evento) },
    reloj: { ahora: () => AHORA },
    ids: { nuevoId: () => `exp-${++contador}` },
  };

  return { dependencias, eventosPublicados };
}
