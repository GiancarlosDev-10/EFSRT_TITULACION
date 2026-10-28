import { describe, expect, test } from "bun:test";
import { redactarAvisoCampana, type DatosAvisoCampana } from "./campana";

const base: DatosAvisoCampana = {
  para: "estudiante",
  estudiante: "Valeria Quispe Huamán",
  modulo: "II",
  estado: { codigo: "05", nombre: "Requisitos conformes", tipo: "conforme" },
  apertura: false,
  pasaA: null,
  docenteAsignado: null,
  cambioDeDocente: null,
};

const pagoConforme: DatosAvisoCampana = {
  ...base,
  estado: { codigo: "03", nombre: "Pago conforme (derivado a Coordinación)", tipo: "conforme" },
  pasaA: "a Coordinación de Carrera",
};

const asignacion: DatosAvisoCampana = {
  ...base,
  estado: { codigo: "06", nombre: "Docente supervisor asignado", tipo: "conforme" },
  pasaA: "al Docente Supervisor",
  docenteAsignado: "Mg. R. Paredes",
};

const cambio: DatosAvisoCampana = {
  ...base,
  estado: { codigo: "07", nombre: "En supervisión", tipo: "proceso" },
  cambioDeDocente: { nuevo: "Ing. M. Vargas", anterior: "Mg. R. Paredes" },
};

describe("redactarAvisoCampana: estudiante", () => {
  test("cambio normal: el módulo y el estado", () => {
    expect(redactarAvisoCampana(base)).toEqual({ titulo: "Módulo II: Requisitos conformes", detalle: "05 · Requisitos conformes" });
  });

  test("apertura, observación y constancia lista", () => {
    expect(redactarAvisoCampana({ ...base, apertura: true, estado: { codigo: "01", nombre: "Expediente recibido", tipo: "proceso" } }).titulo).toBe(
      "Módulo II: recibimos tu expediente",
    );
    expect(redactarAvisoCampana({ ...base, estado: { codigo: "08", nombre: "Supervisión observada", tipo: "observacion" } }).titulo).toBe(
      "Módulo II: tu expediente tiene una observación",
    );
    expect(redactarAvisoCampana({ ...base, estado: { codigo: "10", nombre: "Constancia lista para recoger", tipo: "final" } }).titulo).toBe(
      "Módulo II: tu constancia está lista para recoger",
    );
  });

  test("pasa a otra oficina (D56)", () => {
    expect(redactarAvisoCampana(pagoConforme)).toEqual({
      titulo: "Módulo II pasó a Coordinación de Carrera",
      detalle: "03 · Pago conforme (derivado a Coordinación)",
    });
  });

  test("asignación: quién es su docente", () => {
    expect(redactarAvisoCampana(asignacion).titulo).toBe("Módulo II: tu Docente Supervisor es Mg. R. Paredes");
  });

  test("cambio de docente: quién es ahora", () => {
    expect(redactarAvisoCampana(cambio)).toEqual({ titulo: "Módulo II: cambió tu Docente Supervisor", detalle: "Ahora es Ing. M. Vargas" });
  });
});

describe("redactarAvisoCampana: oficinas y docente", () => {
  test("a la oficina le llega el expediente; el estado va sin la aclaración", () => {
    expect(redactarAvisoCampana({ ...pagoConforme, para: "oficina" })).toEqual({
      titulo: "Llegó el expediente de Valeria Quispe Huamán",
      detalle: "Módulo II · Pago conforme",
    });
  });

  test("al docente se lo asignan; si reemplaza a otro, lo dice", () => {
    expect(redactarAvisoCampana({ ...asignacion, para: "docente" })).toEqual({
      titulo: "Te asignaron a Valeria Quispe Huamán",
      detalle: "Módulo II · Coordinación de Carrera",
    });
    expect(redactarAvisoCampana({ ...cambio, para: "docente" }).detalle).toBe("Módulo II · Reemplazas a Mg. R. Paredes");
  });
});
