// Contrato de DirectorioEstudiantes (búsqueda y alta de Mesa de Partes): las
// mismas pruebas para memoria y Supabase (D42).
import { describe, expect, test } from "bun:test";
import type { DatosEstudiante } from "../domain";
import type { DirectorioEstudiantes } from "../application";

export type EntornoDirectorio = {
  /** Directorio con la sesión de Mesa de Partes. */
  directorio: DirectorioEstudiantes;
  /** Datos válidos de un estudiante nuevo, distintos en cada llamada. */
  datosNuevos(): DatosEstudiante;
};

export function probarContratoDirectorio(nombre: string, preparar: () => Promise<EntornoDirectorio>, opciones?: { omitir?: boolean }) {
  describe.skipIf(opciones?.omitir ?? false)(`DirectorioEstudiantes (${nombre})`, () => {
    test("registra al estudiante y lo encuentra por documento, nombre e id", async () => {
      const { directorio, datosNuevos } = await preparar();
      const datos = datosNuevos();

      const registrado = await directorio.registrar(datos);
      if (!registrado.ok) throw new Error(registrado.error);
      expect(registrado.valor).toEqual({ ...datos, id: registrado.valor.id });

      const ids = async (consulta: string) => (await directorio.buscar(consulta)).map((e) => e.id);
      expect(await ids(datos.numeroDocumento)).toContain(registrado.valor.id);
      expect(await ids(datos.apellidos)).toContain(registrado.valor.id);
      expect(await directorio.buscarPorId(registrado.valor.id)).toEqual(registrado.valor);
    });

    test("rechaza un documento ya registrado", async () => {
      const { directorio, datosNuevos } = await preparar();
      const datos = datosNuevos();
      await directorio.registrar(datos);

      const otro = datosNuevos();
      expect(await directorio.registrar({ ...otro, numeroDocumento: datos.numeroDocumento })).toEqual({
        ok: false,
        error: "DOCUMENTO_YA_REGISTRADO",
      });
    });

    test("rechaza un correo personal ya registrado", async () => {
      const { directorio, datosNuevos } = await preparar();
      const datos = datosNuevos();
      await directorio.registrar(datos);

      expect(await directorio.registrar({ ...datosNuevos(), correoPersonal: datos.correoPersonal })).toEqual({
        ok: false,
        error: "CORREO_YA_REGISTRADO",
      });
    });

    test("una búsqueda de menos de dos caracteres no devuelve nada", async () => {
      const { directorio } = await preparar();
      expect(await directorio.buscar("a")).toEqual([]);
    });

    test("id inexistente", async () => {
      const { directorio } = await preparar();
      expect(await directorio.buscarPorId(crypto.randomUUID())).toBeNull();
    });
  });
}
