// Contrato de ExpedienteRepository: las mismas pruebas para todos los adaptadores
// (memoria y Supabase). Si ambos las pasan, cambiar uno por otro en
// contenedor.ts no cambia el comportamiento de los casos de uso.
import { describe, expect, test } from "bun:test";
import {
  abrirExpediente,
  aplicarCambioEstado,
  type CodigoEstado,
  type Dependencia,
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
};

function nuevoExpediente(estudianteId: string, modulo: Modulo = "I", nota?: string): Expediente {
  const apertura = abrirExpediente(
    { id: crypto.randomUUID(), estudianteId, modulo },
    { actor: ACTORES["mesa-partes"], fecha: FECHA, motivo: nota },
  );
  if (!apertura.ok) throw new Error(apertura.error);
  return apertura.valor.expediente;
}

function cambio(expediente: Expediente, hacia: CodigoEstado, dependencia: Dependencia, motivo?: string) {
  const resultado = aplicarCambioEstado(expediente, { hacia, actor: ACTORES[dependencia], fecha: FECHA, motivo });
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.valor;
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
