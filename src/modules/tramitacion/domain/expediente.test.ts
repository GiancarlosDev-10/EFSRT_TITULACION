import { describe, expect, test } from "bun:test";
import { ACTORES, DATOS_EXPEDIENTE, FECHA } from "./ayudas-prueba";
import { abrirExpediente, aplicarCambioEstado, type Expediente } from "./expediente";
import type { RegistroHistorial } from "./historial";

function abrir(): Expediente {
  const resultado = abrirExpediente(DATOS_EXPEDIENTE, { actor: ACTORES["mesa-partes"], fecha: FECHA });
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.valor.expediente;
}

describe("abrirExpediente", () => {
  test("nace en 01 con un registro sin estado anterior y emite el evento", () => {
    const resultado = abrirExpediente(DATOS_EXPEDIENTE, { actor: ACTORES["mesa-partes"], fecha: FECHA });
    if (!resultado.ok) throw new Error(resultado.error);

    const registro: RegistroHistorial = {
      estadoAnterior: null,
      estadoNuevo: "01",
      actor: ACTORES["mesa-partes"],
      motivo: null,
      fecha: FECHA,
    };
    expect(resultado.valor.expediente).toEqual({ ...DATOS_EXPEDIENTE, estado: "01", historial: [registro] });
    expect(resultado.valor.evento).toEqual({
      tipo: "ExpedienteCambioDeEstado",
      expedienteId: "exp-1",
      estudianteId: "est-lucia",
      modulo: "II",
      registro,
    });
  });

  test("solo Mesa de Partes puede abrirlo", () => {
    const resultado = abrirExpediente(DATOS_EXPEDIENTE, { actor: ACTORES.coordinacion, fecha: FECHA });
    expect(resultado).toEqual({ ok: false, error: "DEPENDENCIA_NO_AUTORIZADA" });
  });
});

describe("aplicarCambioEstado", () => {
  test("añade una fila al final del historial sin modificar el expediente original", () => {
    const original = abrir();
    const fechaObservacion = new Date("2026-10-11T10:30:00-05:00");

    const resultado = aplicarCambioEstado(original, {
      hacia: "02",
      actor: ACTORES["mesa-partes"],
      fecha: fechaObservacion,
      motivo: "El voucher está ilegible.",
    });
    if (!resultado.ok) throw new Error(resultado.error);

    const { expediente, evento } = resultado.valor;
    expect(expediente.estado).toBe("02");
    expect(expediente.historial).toHaveLength(2);
    expect(expediente.historial[0]).toBe(original.historial[0]);
    expect(expediente.historial[1]).toEqual({
      estadoAnterior: "01",
      estadoNuevo: "02",
      actor: ACTORES["mesa-partes"],
      motivo: "El voucher está ilegible.",
      fecha: fechaObservacion,
    });
    expect(evento.registro).toBe(expediente.historial[1]);

    expect(original.estado).toBe("01");
    expect(original.historial).toHaveLength(1);
  });

  test("si la regla falla, devuelve el error y no produce cambios", () => {
    const original = abrir();
    const resultado = aplicarCambioEstado(original, { hacia: "02", actor: ACTORES["mesa-partes"], fecha: FECHA });
    expect(resultado).toEqual({ ok: false, error: "MOTIVO_REQUERIDO" });
    expect(original.historial).toHaveLength(1);
  });

  test("recorrido completo con una observación subsanada llega a 10", () => {
    const pasos = [
      { hacia: "03", actor: ACTORES["mesa-partes"] },
      { hacia: "05", actor: ACTORES.coordinacion },
      { hacia: "06", actor: ACTORES.coordinacion, motivo: "Asignado a Mg. R. Paredes" },
      { hacia: "07", actor: ACTORES.docente },
      { hacia: "08", actor: ACTORES.docente, motivo: "Falta la ficha de evaluación firmada." },
      { hacia: "07", actor: ACTORES.docente },
      { hacia: "09", actor: ACTORES.docente },
      { hacia: "10", actor: ACTORES.bienestar },
    ] as const;

    let expediente = abrir();
    for (const paso of pasos) {
      const resultado = aplicarCambioEstado(expediente, { ...paso, fecha: FECHA });
      if (!resultado.ok) throw new Error(`${paso.hacia}: ${resultado.error}`);
      expediente = resultado.valor.expediente;
    }

    expect(expediente.estado).toBe("10");
    expect(expediente.historial.map((r) => r.estadoNuevo)).toEqual([
      "01", "03", "05", "06", "07", "08", "07", "09", "10",
    ]);
  });

  test("un expediente en 10 ya no admite cambios", () => {
    const enDiez: Expediente = { ...abrir(), estado: "10" };
    const resultado = aplicarCambioEstado(enDiez, { hacia: "09", actor: ACTORES.docente, fecha: FECHA });
    expect(resultado).toEqual({ ok: false, error: "TRANSICION_NO_PERMITIDA" });
  });
});
