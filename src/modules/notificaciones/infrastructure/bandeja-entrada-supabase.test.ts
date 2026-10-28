import { describe, expect, mock, test } from "bun:test";
import type { Tables } from "@/shared/lib/supabase/tipos-db";

// El adaptador usa la API pública de `tramitacion`, que también exporta su
// contenedor ("server-only"). Fuera de Next.js ese marcador lanza un error.
mock.module("server-only", () => ({}));
const { avisoRecibido } = await import("./bandeja-entrada-supabase");

const fila: Tables<"avisos"> = {
  id: 7,
  expediente_id: "exp-1",
  historial_id: 40,
  cambio_docente_id: null,
  estudiante_id: null,
  oficina: "coordinacion",
  carrera: "desarrollo-sistemas",
  docente_id: null,
  estudiante_nombre: "Valeria Quispe Huamán",
  modulo: "II",
  estado_codigo: "03",
  motivo: null,
  docente_nombre: null,
  docente_anterior_nombre: null,
  fecha: "2026-10-27T15:00:00Z",
  leido_en: null,
};

describe("avisoRecibido", () => {
  test("a una oficina: lleva a la ficha del expediente en su ruta", () => {
    const aviso = avisoRecibido(fila);
    expect(aviso.datos.para).toBe("oficina");
    expect(aviso.enlace).toBe("/coordinacion/expediente/exp-1");
    expect(aviso.datos.pasaA).toBe("a Coordinación de Carrera");
    expect(aviso.leido).toBe(false);
  });

  test("al estudiante: lleva al seguimiento del módulo; la apertura se reconoce por el estado inicial", () => {
    const aviso = avisoRecibido({ ...fila, oficina: null, carrera: null, estudiante_id: "est-1", estado_codigo: "01" });
    expect(aviso.datos).toMatchObject({ para: "estudiante", apertura: true });
    expect(aviso.enlace).toBe("/alumno/seguimiento/II");
  });

  test("al docente, por un cambio de docente: lleva a su ficha y no es apertura ni 'pasó a'", () => {
    const aviso = avisoRecibido({
      ...fila,
      oficina: null,
      carrera: null,
      docente_id: "doc-1",
      historial_id: null,
      cambio_docente_id: 3,
      estado_codigo: "07",
      docente_nombre: "Ing. M. Vargas",
      docente_anterior_nombre: "Mg. R. Paredes",
      leido_en: "2026-10-27T16:00:00Z",
    });
    expect(aviso.enlace).toBe("/docente/expediente/exp-1");
    expect(aviso.datos).toMatchObject({
      para: "docente",
      apertura: false,
      pasaA: null,
      docenteAsignado: null,
      cambioDeDocente: { nuevo: "Ing. M. Vargas", anterior: "Mg. R. Paredes" },
    });
    expect(aviso.leido).toBe(true);
  });
});
