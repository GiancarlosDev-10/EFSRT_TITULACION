// Contrato de ExpedienteRepository: las mismas pruebas para todos los adaptadores
// (memoria y Supabase). Si ambos las pasan, cambiar uno por otro en
// contenedor.ts no cambia el comportamiento de los casos de uso.
import { describe, expect, test } from "bun:test";
import {
  abrirExpediente,
  aplicarCambioEstado,
  cambiarDocente,
  type CodigoEstado,
  type Dependencia,
  type DocenteAsignado,
  type Expediente,
  type Modulo,
} from "../domain";
import { ACTORES, FECHA } from "../domain/ayudas-prueba";
import type { ExpedienteRepository } from "../application";

export type EntornoContrato = {
  /** Repositorio con la sesión de un usuario de esa dependencia. */
  repositorioDe(dependencia: Dependencia): ExpedienteRepository;
  /** Un estudiante sin expedientes, distinto en cada llamada. */
  nuevoEstudiante(): Promise<string>;
  /** Dos docentes activos distintos (el nombre, como lo guarda el directorio). */
  docentes: readonly [DocenteAsignado, DocenteAsignado];
};

function nuevoExpediente(estudianteId: string, modulo: Modulo = "I", nota?: string): Expediente {
  const apertura = abrirExpediente(
    { id: crypto.randomUUID(), estudianteId, modulo },
    { actor: ACTORES["mesa-partes"], fecha: FECHA, motivo: nota },
  );
  if (!apertura.ok) throw new Error(apertura.error);
  return apertura.valor.expediente;
}

function cambio(
  expediente: Expediente,
  hacia: CodigoEstado,
  dependencia: Dependencia,
  motivo?: string,
  docente?: DocenteAsignado,
) {
  const resultado = aplicarCambioEstado(expediente, { hacia, actor: ACTORES[dependencia], fecha: FECHA, motivo, docente });
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.valor;
}

/** Guarda los cambios uno tras otro, cada uno con la sesión de su oficina, y devuelve el expediente como quedó. */
async function avanzar(
  repositorioDe: EntornoContrato["repositorioDe"],
  expediente: Expediente,
  pasos: [CodigoEstado, Dependencia, DocenteAsignado?][],
): Promise<Expediente> {
  let actual = expediente;
  for (const [hacia, dependencia, docente] of pasos) {
    const { expediente: siguiente, evento } = cambio(actual, hacia, dependencia, undefined, docente);
    const guardado = await repositorioDe(dependencia).registrarCambio(actual.id, evento.registro);
    if (!guardado.ok) throw new Error(`${actual.estado}→${hacia}: ${guardado.error}`);
    actual = siguiente;
  }
  return actual;
}

export function probarContratoRepositorio(nombre: string, preparar: () => Promise<EntornoContrato>, opciones?: { omitir?: boolean }) {
  describe.skipIf(opciones?.omitir ?? false)(`ExpedienteRepository (${nombre})`, () => {
    test("guarda un expediente nuevo con su registro de apertura", async () => {
      const { repositorioDe, nuevoEstudiante } = await preparar();
      const mesa = repositorioDe("mesa-partes");
      const expediente = nuevoExpediente(await nuevoEstudiante(), "I", "Carpeta completa.");

      expect(await mesa.crear(expediente)).toEqual({ ok: true, valor: undefined });

      const guardado = await mesa.buscarPorId(expediente.id);
      expect(guardado).toMatchObject({ id: expediente.id, estudianteId: expediente.estudianteId, modulo: "I", estado: "01" });
      expect(guardado?.historial).toHaveLength(1);
      expect(guardado?.historial[0]).toMatchObject({
        estadoAnterior: null,
        estadoNuevo: "01",
        motivo: "Carpeta completa.",
        actor: { dependencia: "mesa-partes" },
      });
    });

    test("rechaza un segundo expediente del mismo estudiante en el mismo módulo", async () => {
      const { repositorioDe, nuevoEstudiante } = await preparar();
      const mesa = repositorioDe("mesa-partes");
      const estudianteId = await nuevoEstudiante();
      await mesa.crear(nuevoExpediente(estudianteId, "II"));

      expect(await mesa.crear(nuevoExpediente(estudianteId, "II"))).toEqual({ ok: false, error: "EXPEDIENTE_YA_EXISTE" });
      expect(await mesa.listarPorEstudiante(estudianteId)).toHaveLength(1);
    });

    test("lista solo los expedientes del estudiante pedido", async () => {
      const { repositorioDe, nuevoEstudiante } = await preparar();
      const mesa = repositorioDe("mesa-partes");
      const [uno, otro] = [await nuevoEstudiante(), await nuevoEstudiante()];
      await mesa.crear(nuevoExpediente(uno, "I"));
      await mesa.crear(nuevoExpediente(uno, "III"));
      await mesa.crear(nuevoExpediente(otro, "I"));

      const modulos = (await mesa.listarPorEstudiante(uno)).map((e) => e.modulo).sort();
      expect(modulos).toEqual(["I", "III"]);
    });

    test("un cambio se añade al final del historial y actualiza el estado", async () => {
      const { repositorioDe, nuevoEstudiante } = await preparar();
      const mesa = repositorioDe("mesa-partes");
      const expediente = nuevoExpediente(await nuevoEstudiante());
      await mesa.crear(expediente);

      const { evento } = cambio(expediente, "02", "mesa-partes", "Voucher ilegible.");
      expect(await mesa.registrarCambio(expediente.id, evento.registro)).toEqual({ ok: true, valor: undefined });

      const guardado = await mesa.buscarPorId(expediente.id);
      expect(guardado?.estado).toBe("02");
      expect(guardado?.historial.map((r) => [r.estadoAnterior, r.estadoNuevo])).toEqual([
        [null, "01"],
        ["01", "02"],
      ]);
      expect(guardado?.historial[1]).toMatchObject({ motivo: "Voucher ilegible.", actor: { dependencia: "mesa-partes" } });
    });

    test("si el estado cambió entre la lectura y la escritura, hay conflicto y no se guarda nada", async () => {
      const { repositorioDe, nuevoEstudiante } = await preparar();
      const mesa = repositorioDe("mesa-partes");
      const expediente = nuevoExpediente(await nuevoEstudiante());
      await mesa.crear(expediente);

      // Dos personas leen el expediente en 01; la primera lo pasa a 03.
      await mesa.registrarCambio(expediente.id, cambio(expediente, "03", "mesa-partes").evento.registro);
      // La segunda intenta 01→02 sobre su lectura desactualizada.
      const tardio = await mesa.registrarCambio(expediente.id, cambio(expediente, "02", "mesa-partes", "x").evento.registro);

      expect(tardio).toEqual({ ok: false, error: "CONFLICTO_DE_ESTADO" });
      const guardado = await mesa.buscarPorId(expediente.id);
      expect(guardado?.estado).toBe("03");
      expect(guardado?.historial).toHaveLength(2);
    });

    test("la asignación (06) guarda al docente en el registro y como docente vigente", async () => {
      const { repositorioDe, nuevoEstudiante, docentes } = await preparar();
      const expediente = nuevoExpediente(await nuevoEstudiante());
      await repositorioDe("mesa-partes").crear(expediente);
      await avanzar(repositorioDe, expediente, [
        ["03", "mesa-partes"],
        ["05", "coordinacion"],
        ["06", "coordinacion", docentes[0]],
      ]);

      const guardado = await repositorioDe("coordinacion").buscarPorId(expediente.id);
      expect(guardado?.estado).toBe("06");
      expect(guardado?.docente).toEqual(docentes[0]);
      expect(guardado?.historial.at(-1)?.docente).toEqual(docentes[0]);
      expect(guardado?.historial.slice(0, -1).every((r) => r.docente === undefined)).toBe(true);
      expect(guardado?.cambiosDocente).toEqual([]);
    });

    test("un cambio de docente reemplaza al vigente sin tocar el estado; uno tardío choca", async () => {
      const { repositorioDe, nuevoEstudiante, docentes } = await preparar();
      const coordinacion = repositorioDe("coordinacion");
      const expediente = nuevoExpediente(await nuevoEstudiante());
      await repositorioDe("mesa-partes").crear(expediente);
      const asignado = await avanzar(repositorioDe, expediente, [
        ["03", "mesa-partes"],
        ["05", "coordinacion"],
        ["06", "coordinacion", docentes[0]],
      ]);

      const solicitud = { docente: docentes[1], actor: ACTORES.coordinacion, fecha: FECHA, motivo: "Renuncia del docente." };
      const primero = cambiarDocente(asignado, solicitud);
      if (!primero.ok) throw new Error(primero.error);
      expect(await coordinacion.registrarCambioDocente(expediente.id, primero.valor.cambio)).toEqual({ ok: true, valor: undefined });

      const guardado = await coordinacion.buscarPorId(expediente.id);
      expect(guardado?.estado).toBe("06");
      expect(guardado?.docente).toEqual(docentes[1]);
      expect(guardado?.cambiosDocente).toHaveLength(1);
      expect(guardado?.cambiosDocente[0]).toMatchObject({
        anterior: docentes[0],
        nuevo: docentes[1],
        motivo: "Renuncia del docente.",
        actor: { dependencia: "coordinacion" },
      });

      // Otra persona, con la lectura de antes (docente 0), intenta otro cambio.
      const tardio = cambiarDocente(asignado, { ...solicitud, docente: docentes[1], motivo: "Otro motivo." });
      if (!tardio.ok) throw new Error(tardio.error);
      expect(await coordinacion.registrarCambioDocente(expediente.id, tardio.valor.cambio)).toEqual({
        ok: false,
        error: "CONFLICTO_DE_ESTADO",
      });
      expect((await coordinacion.buscarPorId(expediente.id))?.cambiosDocente).toHaveLength(1);
    });

    test("expediente inexistente", async () => {
      const { repositorioDe } = await preparar();
      const mesa = repositorioDe("mesa-partes");
      const fantasma = nuevoExpediente(crypto.randomUUID());

      expect(await mesa.buscarPorId(fantasma.id)).toBeNull();
      expect(await mesa.registrarCambio(fantasma.id, cambio(fantasma, "03", "mesa-partes").evento.registro)).toEqual({
        ok: false,
        error: "EXPEDIENTE_NO_ENCONTRADO",
      });
    });
  });
}
