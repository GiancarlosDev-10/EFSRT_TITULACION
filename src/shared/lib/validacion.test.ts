import { describe, expect, test } from "bun:test";
import { esUuid } from "./validacion";

describe("esUuid", () => {
  test("acepta UUID en minúsculas o mayúsculas", () => {
    expect(esUuid("5f0c6a52-7d1e-4b8a-9c3e-2a1b0c9d8e7f")).toBe(true);
    expect(esUuid("5F0C6A52-7D1E-4B8A-9C3E-2A1B0C9D8E7F")).toBe(true);
  });

  test.each([["exp-1"], [""], ["5f0c6a52-7d1e-4b8a-9c3e-2a1b0c9d8e7f' or 1=1"], [null], [42]])("rechaza %p", (valor) => {
    expect(esUuid(valor)).toBe(false);
  });
});
