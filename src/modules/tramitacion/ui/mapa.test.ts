import { describe, expect, test } from "bun:test";
import type { SituacionEtapa } from "../application";
import { CARAS_EDIFICIOS, estadoDeEdificio, proyectar, tramos } from "./mapa";

const MODULO_II: SituacionEtapa[] = ["completada", "completada", "observada", "pendiente"];
const MODULO_I: SituacionEtapa[] = ["completada", "completada", "completada", "completada"];

describe("mapa del recorrido", () => {
  test("proyección isométrica del origen", () => {
    expect(proyectar([0, 0, 0])).toEqual([310, 118]);
  });

  test("los tramos recorridos son los que llevan de una etapa terminada a una ya iniciada", () => {
    expect(tramos(MODULO_II).map((t) => t.recorrido)).toEqual([false, true, true, false]);
    expect(tramos(MODULO_I).map((t) => t.recorrido)).toEqual([false, true, true, true]);
  });

  test("estado visual de los edificios", () => {
    expect(estadoDeEdificio("tesoreria", MODULO_II, 2, false)).toBe("externo");
    expect(estadoDeEdificio(2, MODULO_II, 2, false)).toBe("observado");
    expect(estadoDeEdificio(3, MODULO_II, 2, false)).toBe("pendiente");
    expect(estadoDeEdificio(3, MODULO_I, 3, true)).toBe("listo");
    expect(estadoDeEdificio(0, MODULO_I, 3, true)).toBe("conforme");
  });

  test("se dibujan los cinco edificios", () => {
    expect(CARAS_EDIFICIOS.map((c) => c.id).sort()).toEqual([0, 1, 2, 3, "tesoreria"]);
  });
});
