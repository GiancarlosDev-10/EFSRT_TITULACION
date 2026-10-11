import { describe, expect, test } from "bun:test";
import { CODIGOS_ESTADO, LONGITUD_MAXIMA_MOTIVO, type CodigoEstado, type Dependencia } from "./catalogo";
import {
  esModulo,
  estaPermitida,
  indicacionDe,
  transicionesDisponibles,
  ubicacionDe,
  validarTransicion,
} from "./reglas";

// Copia escrita a mano de CLAUDE.md, a propósito: si alguien edita el
// catálogo por error, esta prueba lo detecta.
const PERMITIDAS = [
  "01→02", "01→03", "02→03", "03→04", "03→05", "04→05",
  "05→06", "06→07", "07→08", "07→09", "08→07", "09→10",
];

const todasLasCombinaciones = CODIGOS_ESTADO.flatMap((desde) =>
  CODIGOS_ESTADO.map((hacia) => [desde, hacia] as const),
);

describe("estaPermitida", () => {
  test.each(todasLasCombinaciones)("%s→%s", (desde, hacia) => {
    expect(estaPermitida(desde, hacia)).toBe(PERMITIDAS.includes(`${desde}→${hacia}`));
  });

  test("un expediente nuevo solo nace en 01", () => {
    for (const hacia of CODIGOS_ESTADO) {
      expect(estaPermitida(null, hacia)).toBe(hacia === "01");
    }
  });
});

describe("validarTransicion: autorización por dependencia del estado destino", () => {
  const casos: [CodigoEstado, CodigoEstado, Dependencia][] = [
    ["01", "03", "mesa-partes"],
    ["03", "05", "coordinacion"],
    ["06", "07", "docente"],
    ["09", "10", "bienestar"],
  ];

  test.each(casos)("%s→%s solo lo registra %s", (desde, hacia, responsable) => {
    for (const dependencia of ["mesa-partes", "coordinacion", "docente", "bienestar"] as const) {
      const resultado = validarTransicion({ desde, hacia, dependencia });
      expect(resultado.ok).toBe(dependencia === responsable);
      if (!resultado.ok) expect(resultado.error).toBe("DEPENDENCIA_NO_AUTORIZADA");
    }
  });

  test("una transición inexistente se rechaza aunque la dependencia sea la correcta", () => {
    expect(validarTransicion({ desde: "01", hacia: "10", dependencia: "bienestar" })).toEqual({
      ok: false,
      error: "TRANSICION_NO_PERMITIDA",
    });
  });
});

describe("validarTransicion: motivo", () => {
  const observaciones: [CodigoEstado, CodigoEstado, Dependencia][] = [
    ["01", "02", "mesa-partes"],
    ["03", "04", "coordinacion"],
    ["07", "08", "docente"],
  ];

  test.each(observaciones)("%s→%s sin motivo se rechaza", (desde, hacia, dependencia) => {
    for (const motivo of [undefined, "", "   "]) {
      expect(validarTransicion({ desde, hacia, dependencia, motivo })).toEqual({
        ok: false,
        error: "MOTIVO_REQUERIDO",
      });
    }
  });

  test("el motivo se guarda sin espacios sobrantes", () => {
    const resultado = validarTransicion({
      desde: "07",
      hacia: "08",
      dependencia: "docente",
      motivo: "  Falta la firma del jefe inmediato.  ",
    });
    expect(resultado).toEqual({ ok: true, valor: { motivo: "Falta la firma del jefe inmediato." } });
  });

  test("en estados normales la nota es opcional", () => {
    expect(validarTransicion({ desde: "05", hacia: "06", dependencia: "coordinacion" })).toEqual({
      ok: true,
      valor: { motivo: null },
    });
  });

  test(`acepta hasta ${LONGITUD_MAXIMA_MOTIVO} caracteres y rechaza uno más`, () => {
    const base = { desde: "07", hacia: "08", dependencia: "docente" } as const;
    expect(validarTransicion({ ...base, motivo: "a".repeat(LONGITUD_MAXIMA_MOTIVO) }).ok).toBe(true);
    expect(validarTransicion({ ...base, motivo: "a".repeat(LONGITUD_MAXIMA_MOTIVO + 1) })).toEqual({
      ok: false,
      error: "MOTIVO_DEMASIADO_LARGO",
    });
  });
});

describe("consultas", () => {
  test("esModulo valida valores externos", () => {
    expect(["I", "II", "III"].every(esModulo)).toBe(true);
    for (const valor of ["IV", "i", "", undefined, ["II"], 2]) expect(esModulo(valor)).toBe(false);
  });

  test("solo las observaciones tienen indicación", () => {
    for (const codigo of CODIGOS_ESTADO) {
      expect(indicacionDe(codigo) !== null).toBe(["02", "04", "08"].includes(codigo));
    }
  });

  test("la ubicación es la dependencia del estado actual", () => {
    expect(ubicacionDe("03")).toBe("mesa-partes");
    expect(ubicacionDe("08")).toBe("docente");
  });

  test("transicionesDisponibles filtra por dependencia", () => {
    expect(transicionesDisponibles("03", "coordinacion")).toEqual(["04", "05"]);
    expect(transicionesDisponibles("03", "mesa-partes")).toEqual([]);
    expect(transicionesDisponibles("10", "bienestar")).toEqual([]);
  });
});
