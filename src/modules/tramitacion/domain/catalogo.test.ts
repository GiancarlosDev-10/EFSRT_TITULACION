// Coherencia del catálogo: protege contra ediciones futuras que rompan el flujo.
import { describe, expect, test } from "bun:test";
import {
  CODIGOS_ESTADO,
  ESTADO_INICIAL,
  ESTADOS,
  ORDEN_DEPENDENCIAS,
  TRANSICIONES,
  type CodigoEstado,
} from "./catalogo";

describe("catálogo de estados", () => {
  test("los códigos van en orden 01…10", () => {
    expect(CODIGOS_ESTADO).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  });

  test("ninguna transición retrocede a una dependencia anterior", () => {
    const posicion = (codigo: CodigoEstado) => ORDEN_DEPENDENCIAS.indexOf(ESTADOS[codigo].dependencia);
    for (const desde of CODIGOS_ESTADO) {
      for (const hacia of TRANSICIONES[desde]) {
        expect(posicion(hacia)).toBeGreaterThanOrEqual(posicion(desde));
      }
    }
  });

  test("todo estado es alcanzable desde el estado inicial", () => {
    const alcanzados = new Set<CodigoEstado>([ESTADO_INICIAL]);
    const pendientes: CodigoEstado[] = [ESTADO_INICIAL];
    while (pendientes.length > 0) {
      for (const siguiente of TRANSICIONES[pendientes.pop()!]) {
        if (!alcanzados.has(siguiente)) {
          alcanzados.add(siguiente);
          pendientes.push(siguiente);
        }
      }
    }
    expect([...alcanzados].sort()).toEqual(CODIGOS_ESTADO);
  });

  test("solo los estados finales no tienen salida", () => {
    for (const codigo of CODIGOS_ESTADO) {
      const esFinal = ESTADOS[codigo].tipo === "final";
      expect(TRANSICIONES[codigo].length === 0).toBe(esFinal);
    }
  });

  test("toda observación se puede subsanar sin salir de su dependencia ni retroceder a otra", () => {
    for (const codigo of CODIGOS_ESTADO.filter((c) => ESTADOS[c].tipo === "observacion")) {
      expect(TRANSICIONES[codigo].length).toBeGreaterThan(0);
      for (const siguiente of TRANSICIONES[codigo]) {
        expect(ESTADOS[siguiente].dependencia).toBe(ESTADOS[codigo].dependencia);
      }
    }
  });
});
