import { describe, expect, test } from "bun:test";
import type { DatosAviso } from "../domain/aviso";
import { crearEnviarPendientes } from "./enviar-pendientes";
import type { AvisoPorEnviar, BandejaDeSalida, CorreoSaliente, Notificador } from "./puertos";

const datos: DatosAviso = {
  nombres: "Valeria",
  modulo: "I",
  nombreModulo: null,
  estado: { codigo: "03", nombre: "Pago conforme (derivado a Coordinación)", tipo: "conforme" },
  apertura: false,
  ahora: "pasa a Coordinación de Carrera",
  motivo: null,
  subsanar: null,
  constancia: null,
  fecha: new Date("2026-10-25T19:39:00Z"),
  enlace: "http://localhost:3000/alumno/seguimiento/I",
};

/** Bandeja en memoria: registra qué se marcó como enviado o fallido. */
function bandejaCon(avisos: AvisoPorEnviar[]) {
  const enviados: number[] = [];
  const fallidos: { id: number; error: string }[] = [];
  const bandeja: BandejaDeSalida = {
    reclamar: async (limite) => avisos.splice(0, limite),
    marcarEnviado: async (id) => void enviados.push(id),
    marcarFallido: async (id, error) => void fallidos.push({ id, error }),
  };
  return { bandeja, enviados, fallidos };
}

const aviso = (id: number, para = ["valeria@gmail.com"]): AvisoPorEnviar => ({ id, para, datos });

describe("enviarPendientes", () => {
  test("envía cada aviso a sus destinatarios y lo marca como enviado", async () => {
    const { bandeja, enviados } = bandejaCon([aviso(1, ["a@iestpgildaballivian.edu.pe", "a@gmail.com"]), aviso(2)]);
    const correos: CorreoSaliente[] = [];
    const notificador: Notificador = { enviar: async (correo) => void correos.push(correo) };

    expect(await crearEnviarPendientes({ bandeja, notificador })()).toEqual({ enviados: 2, fallidos: 0 });
    expect(enviados).toEqual([1, 2]);
    expect(correos[0].para).toEqual(["a@iestpgildaballivian.edu.pe", "a@gmail.com"]);
    expect(correos[0].asunto).toBe("Tu expediente del Módulo I: Pago conforme (derivado a Coordinación)");
    expect(correos[0].html).toContain("<!doctype html>");
  });

  test("un correo que falla queda como fallido con su error y no detiene a los demás", async () => {
    const { bandeja, enviados, fallidos } = bandejaCon([aviso(1), aviso(2), aviso(3)]);
    let llamada = 0;
    const notificador: Notificador = {
      enviar: async () => {
        if (++llamada === 2) throw new Error("535 Username and Password not accepted");
      },
    };

    expect(await crearEnviarPendientes({ bandeja, notificador })()).toEqual({ enviados: 2, fallidos: 1 });
    expect(enviados).toEqual([1, 3]);
    expect(fallidos).toEqual([{ id: 2, error: "535 Username and Password not accepted" }]);
  });

  test("respeta el límite de avisos por envío", async () => {
    const { bandeja } = bandejaCon([aviso(1), aviso(2), aviso(3)]);
    const notificador: Notificador = { enviar: async () => {} };
    expect(await crearEnviarPendientes({ bandeja, notificador })(2)).toEqual({ enviados: 2, fallidos: 0 });
  });

  test("guarda como máximo 500 caracteres del error", async () => {
    const { bandeja, fallidos } = bandejaCon([aviso(1)]);
    const notificador: Notificador = {
      enviar: async () => {
        throw new Error("x".repeat(2000));
      },
    };
    await crearEnviarPendientes({ bandeja, notificador })();
    expect(fallidos[0].error).toHaveLength(500);
  });
});
