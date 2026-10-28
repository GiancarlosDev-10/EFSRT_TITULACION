import { describe, expect, test } from "bun:test";
import type { DatosAvisoCampana } from "../domain/campana";
import { MAXIMO_AVISOS, crearMarcarAvisosLeidos, crearObtenerCampana } from "./campana";
import type { AvisoRecibido, BandejaDeEntrada } from "./puertos";

const datos: DatosAvisoCampana = {
  para: "oficina",
  estudiante: "Valeria Quispe Huamán",
  modulo: "II",
  estado: { codigo: "03", nombre: "Pago conforme (derivado a Coordinación)", tipo: "conforme" },
  apertura: false,
  pasaA: "a Coordinación de Carrera",
  docenteAsignado: null,
  cambioDeDocente: null,
};

const aviso = (id: number, leido = false): AvisoRecibido => ({
  id,
  datos,
  fecha: new Date("2026-10-27T15:00:00Z"),
  leido,
  enlace: `/coordinacion/expediente/exp-${id}`,
});

/** Bandeja en memoria: guarda hasta dónde se marcó como leído y el límite pedido. */
function bandejaCon(avisos: AvisoRecibido[], sinLeer: number) {
  const registro = { marcadoHasta: null as number | null, limite: null as number | null };
  const bandeja: BandejaDeEntrada = {
    recientes: async (limite) => {
      registro.limite = limite;
      return avisos.slice(0, limite);
    },
    contarSinLeer: async () => sinLeer,
    marcarLeidos: async (hastaId) => void (registro.marcadoHasta = hastaId),
  };
  return { bandeja, registro };
}

describe("obtenerCampana", () => {
  test("pide los últimos 20, los redacta y da el id más reciente", async () => {
    const { bandeja, registro } = bandejaCon([aviso(12), aviso(9, true)], 30);
    const campana = await crearObtenerCampana({ bandeja })();

    expect(registro.limite).toBe(MAXIMO_AVISOS);
    expect(campana.sinLeer).toBe(30);
    expect(campana.ultimoId).toBe(12);
    expect(campana.avisos[0]).toEqual({
      id: 12,
      titulo: "Llegó el expediente de Valeria Quispe Huamán",
      detalle: "Módulo II · Pago conforme",
      fecha: new Date("2026-10-27T15:00:00Z"),
      leido: false,
      enlace: "/coordinacion/expediente/exp-12",
    });
  });

  test("sin avisos: lista vacía y nada que marcar", async () => {
    const { bandeja } = bandejaCon([], 0);
    expect(await crearObtenerCampana({ bandeja })()).toEqual({ avisos: [], sinLeer: 0, ultimoId: null });
  });
});

describe("marcarAvisosLeidos", () => {
  test("marca hasta el id recibido", async () => {
    const { bandeja, registro } = bandejaCon([], 0);
    expect(await crearMarcarAvisosLeidos({ bandeja })(12)).toBe(true);
    expect(registro.marcadoHasta).toBe(12);
  });

  test("rechaza lo que no es un id válido (viene del navegador) sin tocar la base", async () => {
    const { bandeja, registro } = bandejaCon([], 0);
    const marcar = crearMarcarAvisosLeidos({ bandeja });
    for (const valor of [0, -3, 1.5, Number.NaN, "12", null, undefined, 2 ** 60]) {
      expect(await marcar(valor)).toBe(false);
    }
    expect(registro.marcadoHasta).toBeNull();
  });
});
