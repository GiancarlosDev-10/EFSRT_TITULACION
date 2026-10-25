import { exito, fallo } from "../domain";
import { coincideConEstudiante, type DirectorioEstudiantes, type FichaEstudiante } from "../application";

/** Adaptador de prueba: estudiantes en memoria; sin sesiones, ve a todos. */
export function crearDirectorioEnMemoria(
  iniciales: readonly FichaEstudiante[] = [],
  generarId: () => string = () => crypto.randomUUID(),
): DirectorioEstudiantes {
  const estudiantes = [...iniciales];

  return {
    async buscarPorUsuario() {
      return null;
    },

    async buscar(consulta) {
      if (consulta.trim().length < 2) return [];
      return estudiantes.filter((e) => coincideConEstudiante(e, consulta)).slice(0, 20);
    },

    async buscarPorId(id) {
      return estudiantes.find((e) => e.id === id) ?? null;
    },

    async registrar(datos) {
      const mismoDocumento = estudiantes.some(
        (e) => e.tipoDocumento === datos.tipoDocumento && e.numeroDocumento === datos.numeroDocumento,
      );
      if (mismoDocumento) return fallo("DOCUMENTO_YA_REGISTRADO");
      // Como en la base: cada columna de correo es única por separado.
      const mismoCorreo = estudiantes.some(
        (e) =>
          (datos.correoInstitucional !== null && e.correoInstitucional === datos.correoInstitucional) ||
          (datos.correoPersonal !== null && e.correoPersonal === datos.correoPersonal),
      );
      if (mismoCorreo) return fallo("CORREO_YA_REGISTRADO");

      const ficha = { ...datos, id: generarId() };
      estudiantes.push(ficha);
      return exito(ficha);
    },
  };
}
