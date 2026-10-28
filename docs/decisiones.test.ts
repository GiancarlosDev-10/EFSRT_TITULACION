// La bitácora es insumo de la tesis: el índice debe coincidir con las entradas.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const texto = readFileSync(join(import.meta.dir, "decisiones.md"), "utf8");

/** Títulos de las entradas: número → título completo. */
const titulos = new Map(
  [...texto.matchAll(/^### (D\d+) — (.+)$/gm)].map(([, numero, titulo]) => [numero, titulo]),
);

/** Filas del índice: número → estado (última columna). */
const indice = new Map(
  [...texto.matchAll(/^\| (D\d+) \|.*\| ([^|]+) \|$/gm)].map(([, numero, estado]) => [numero, estado.trim()]),
);

describe("bitácora de decisiones", () => {
  test("cada entrada tiene su fila en el índice y viceversa", () => {
    expect([...indice.keys()].sort()).toEqual([...titulos.keys()].sort());
  });

  test("un título que dice (pendiente) coincide con el estado del índice", () => {
    const desfasadas = [...titulos]
      .filter(([numero, titulo]) => titulo.includes("(pendiente)") && !indice.get(numero)?.startsWith("pendiente"))
      .map(([numero]) => numero);
    expect(desfasadas).toEqual([]);
  });

  test("una decisión pendiente en el índice lo dice en su título", () => {
    const desfasadas = [...indice]
      .filter(([numero, estado]) => estado.startsWith("pendiente") && !titulos.get(numero)?.includes("(pendiente)"))
      .map(([numero]) => numero);
    expect(desfasadas).toEqual([]);
  });
});
