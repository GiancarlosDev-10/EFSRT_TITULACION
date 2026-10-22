import { describe, expect, test } from "bun:test";
import { config } from "../../proxy";
import { RUTA_DE_ROL, esRol } from "./roles";

describe("proxy", () => {
  // El matcher debe ser un literal (Next.js lo lee al compilar), así que repite
  // las rutas de los roles; esta prueba evita que se desincronicen.
  test("su matcher cubre exactamente la ruta de cada rol", () => {
    expect([...config.matcher].sort()).toEqual(Object.values(RUTA_DE_ROL).map((ruta) => `${ruta}/:path*`).sort());
  });
});

describe("esRol", () => {
  test("acepta solo los roles conocidos", () => {
    expect(esRol("docente")).toBe(true);
    expect(esRol("admin")).toBe(false);
    expect(esRol("toString")).toBe(false);
    expect(esRol(null)).toBe(false);
  });
});
