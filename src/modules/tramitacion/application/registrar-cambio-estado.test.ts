import { describe, expect, test } from "bun:test";
import { ACTORES } from "../domain/ayudas-prueba";
import { EXPEDIENTES_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { AHORA, crearDependenciasDePrueba } from "./ayudas-prueba";
import { crearRegistrarCambioEstado } from "./registrar-cambio-estado";

// En los datos de prueba, exp-lucia-II está en 08 (supervisión observada).
function preparar() {
  const { dependencias, eventosPublicados } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
  return { dependencias, eventosPublicados, registrarCambioEstado: crearRegistrarCambioEstado(dependencias) };
}

describe("registrarCambioEstado", () => {
  test("guarda el cambio con la fecha del servidor y publica el evento", async () => {
    const { dependencias, eventosPublicados, registrarCambioEstado } = preparar();

    const resultado = await registrarCambioEstado({
      actor: ACTORES.docente,
      expedienteId: "exp-lucia-II",
      hacia: "07",
    });

    expect(resultado.ok).toBe(true);
    const guardado = await dependencias.repositorio.buscarPorId("exp-lucia-II");
    expect(guardado?.estado).toBe("07");
    expect(guardado?.historial.at(-1)).toMatchObject({ estadoAnterior: "08", estadoNuevo: "07", fecha: AHORA });
    expect(eventosPublicados).toEqual([
      {
        tipo: "ExpedienteCambioDeEstado",
        expedienteId: "exp-lucia-II",
        estudianteId: "est-lucia-ramos",
        modulo: "II",
        registro: guardado!.historial.at(-1)!,
      },
    ]);
  });

  test("expediente inexistente", async () => {
    const { eventosPublicados, registrarCambioEstado } = preparar();
    const resultado = await registrarCambioEstado({ actor: ACTORES.docente, expedienteId: "no-existe", hacia: "07" });

    expect(resultado).toEqual({ ok: false, error: "EXPEDIENTE_NO_ENCONTRADO" });
    expect(eventosPublicados).toHaveLength(0);
  });

  test("una oficina que no corresponde no puede cambiar el estado", async () => {
    const { dependencias, eventosPublicados, registrarCambioEstado } = preparar();
    const resultado = await registrarCambioEstado({
      actor: ACTORES.bienestar,
      expedienteId: "exp-lucia-II",
      hacia: "07",
    });

    expect(resultado).toEqual({ ok: false, error: "DEPENDENCIA_NO_AUTORIZADA" });
    expect((await dependencias.repositorio.buscarPorId("exp-lucia-II"))?.estado).toBe("08");
    expect(eventosPublicados).toHaveLength(0);
  });

  test("si otra persona cambió el estado entre la lectura y la escritura, hay conflicto", async () => {
    const { dependencias, eventosPublicados } = preparar();

    // Simula que, justo después de leer, otro docente registra 08→07.
    const repositorio = dependencias.repositorio;
    const registrarCambioEstado = crearRegistrarCambioEstado({
      ...dependencias,
      repositorio: {
        ...repositorio,
        async buscarPorId(id) {
          const leido = await repositorio.buscarPorId(id);
          await repositorio.registrarCambio(id, {
            estadoAnterior: "08",
            estadoNuevo: "07",
            actor: ACTORES.docente,
            motivo: null,
            fecha: AHORA,
          });
          return leido;
        },
      },
    });

    const resultado = await registrarCambioEstado({
      actor: ACTORES.docente,
      expedienteId: "exp-lucia-II",
      hacia: "07",
    });

    expect(resultado).toEqual({ ok: false, error: "CONFLICTO_DE_ESTADO" });
    expect((await repositorio.buscarPorId("exp-lucia-II"))?.historial.filter((r) => r.fecha === AHORA)).toHaveLength(1);
    expect(eventosPublicados).toHaveLength(0);
  });
});
