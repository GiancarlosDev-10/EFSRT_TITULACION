import { describe, expect, test } from "bun:test";
import { ACTORES, DATOS_EXPEDIENTE, DOCENTES, FECHA } from "./ayudas-prueba";
import type { CodigoEstado } from "./catalogo";
import { abrirExpediente, aplicarCambioEstado, cambiarDocente, type Expediente } from "./expediente";
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
    expect(resultado.valor.expediente).toEqual({ ...DATOS_EXPEDIENTE, estado: "01", historial: [registro], docente: null, cambiosDocente: [] });
    expect(resultado.valor.evento).toEqual({
      tipo: "ExpedienteCambioDeEstado",
      expedienteId: "exp-1",
      estudianteId: "est-giancarlos",
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
      { hacia: "06", actor: ACTORES.coordinacion, docente: DOCENTES.paredes },
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

  test("el docente solo se guarda en el registro de asignación", () => {
    const enCinco: Expediente = { ...abrir(), estado: "05" };
    const asignado = aplicarCambioEstado(enCinco, { hacia: "06", actor: ACTORES.coordinacion, fecha: FECHA, docente: DOCENTES.paredes });
    if (!asignado.ok) throw new Error(asignado.error);
    expect(asignado.valor.evento.registro.docente).toEqual(DOCENTES.paredes);
    expect(asignado.valor.expediente.docente).toEqual(DOCENTES.paredes);

    const enSupervision = aplicarCambioEstado(asignado.valor.expediente, {
      hacia: "07",
      actor: ACTORES.docente,
      fecha: FECHA,
      docente: DOCENTES.vargas,
    });
    if (!enSupervision.ok) throw new Error(enSupervision.error);
    expect(enSupervision.valor.evento.registro).not.toHaveProperty("docente");
    expect(enSupervision.valor.expediente.docente).toEqual(DOCENTES.paredes);
  });
});

/** Expediente en `estado` con Paredes asignado en 06 (si ya pasó por ahí). */
function conDocente(estado: CodigoEstado): Expediente {
  const base = abrir();
  const asignacion: RegistroHistorial = {
    estadoAnterior: "05",
    estadoNuevo: "06",
    actor: ACTORES.coordinacion,
    motivo: null,
    fecha: FECHA,
    docente: DOCENTES.paredes,
  };
  return { ...base, estado, historial: [...base.historial, asignacion], docente: DOCENTES.paredes };
}

describe("cambiarDocente", () => {
  const solicitud = { docente: DOCENTES.vargas, actor: ACTORES.coordinacion, fecha: FECHA, motivo: "  Renuncia del docente.  " };

  test("añade el cambio sin tocar el estado ni el historial", () => {
    const original = conDocente("08");
    const resultado = cambiarDocente(original, solicitud);
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.cambio).toEqual({
      anterior: DOCENTES.paredes,
      nuevo: DOCENTES.vargas,
      motivo: "Renuncia del docente.",
      actor: ACTORES.coordinacion,
      fecha: FECHA,
    });
    expect(resultado.valor.expediente.estado).toBe("08");
    expect(resultado.valor.expediente.docente).toEqual(DOCENTES.vargas);
    expect(resultado.valor.expediente.historial).toBe(original.historial);
    expect(original.cambiosDocente).toEqual([]);
  });

  test.each(["06", "07", "08"] as const)("se permite en %s", (estado) => {
    expect(cambiarDocente(conDocente(estado), solicitud).ok).toBe(true);
  });

  test.each(["05", "09", "10"] as const)("no se permite en %s", (estado) => {
    expect(cambiarDocente(conDocente(estado), solicitud)).toEqual({ ok: false, error: "CAMBIO_DE_DOCENTE_NO_PERMITIDO" });
  });

  test("sin docente asignado no hay a quién cambiar", () => {
    const sinAsignar: Expediente = { ...abrir(), estado: "07" };
    expect(cambiarDocente(sinAsignar, solicitud)).toEqual({ ok: false, error: "CAMBIO_DE_DOCENTE_NO_PERMITIDO" });
  });

  test("solo Coordinación puede cambiarlo", () => {
    for (const actor of [ACTORES["mesa-partes"], ACTORES.docente, ACTORES.bienestar]) {
      expect(cambiarDocente(conDocente("07"), { ...solicitud, actor })).toEqual({ ok: false, error: "DEPENDENCIA_NO_AUTORIZADA" });
    }
  });

  test("exige motivo y un docente distinto", () => {
    expect(cambiarDocente(conDocente("07"), { ...solicitud, motivo: "  " })).toEqual({ ok: false, error: "MOTIVO_REQUERIDO" });
    expect(cambiarDocente(conDocente("07"), { ...solicitud, docente: DOCENTES.paredes })).toEqual({
      ok: false,
      error: "MISMO_DOCENTE",
    });
  });
});
