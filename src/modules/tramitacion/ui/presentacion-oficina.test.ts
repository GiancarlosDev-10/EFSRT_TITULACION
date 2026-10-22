import { describe, expect, test } from "bun:test";
import { ORDEN_DEPENDENCIAS } from "../domain";
import {
  ayudaDeAccion,
  diasDeEspera,
  nombreBreve,
  nombreParaSaludo,
  registraObservaciones,
  textoDePildora,
} from "./presentacion-oficina";

describe("ayudaDeAccion", () => {
  test.each([
    ["01", "02", "mesa-partes", "El expediente queda detenido en tu oficina hasta que el estudiante corrija lo indicado."],
    ["01", "03", "mesa-partes", "El expediente pasa a Coordinación de Carrera."],
    ["02", "03", "mesa-partes", "El estudiante entregó la corrección. El expediente pasa a Coordinación de Carrera."],
    ["03", "05", "coordinacion", "El expediente sigue en tu oficina."],
    ["05", "06", "coordinacion", "Elige al docente: el expediente pasa a su bandeja."],
    ["06", "07", "docente", "El expediente sigue en tu oficina."],
    ["07", "09", "docente", "El expediente pasa a Bienestar y Empleabilidad."],
    ["08", "07", "docente", "El estudiante entregó la corrección. El expediente sigue en tu oficina."],
    ["09", "10", "bienestar", "El estudiante recibirá el aviso para recoger su constancia en físico."],
  ] as const)("%s→%s (%s)", (desde, hacia, dependencia, esperado) => {
    expect(ayudaDeAccion(desde, hacia, dependencia)).toBe(esperado);
  });
});

describe("textos", () => {
  test("nombreBreve quita la aclaración entre paréntesis", () => {
    expect(nombreBreve("03")).toBe("Pago conforme");
    expect(nombreBreve("07")).toBe("En supervisión");
  });

  test("píldora: oficina, observación o constancia lista", () => {
    expect(textoDePildora("03")).toBe("Mesa de Partes");
    expect(textoDePildora("08")).toBe("Observado · Docente");
    expect(textoDePildora("10")).toBe("Constancia lista");
  });

  test("solo Bienestar no registra observaciones", () => {
    expect(ORDEN_DEPENDENCIAS.filter(registraObservaciones)).toEqual(["mesa-partes", "coordinacion", "docente"]);
  });

  test("saludo sin títulos; con una inicial, el nombre completo", () => {
    expect(nombreParaSaludo("Lic. Patricia Gutiérrez")).toBe("Patricia");
    expect(nombreParaSaludo("Carla Ramírez")).toBe("Carla");
    expect(nombreParaSaludo("Mg. R. Paredes")).toBe("Mg. R. Paredes");
  });

  test("la espera se resalta desde el tercer día", () => {
    const ahora = new Date("2026-10-22T10:00:00-05:00");
    expect(diasDeEspera(new Date("2026-10-20T18:00:00-05:00"), ahora)).toBeNull();
    expect(diasDeEspera(new Date("2026-10-19T08:00:00-05:00"), ahora)).toBe(3);
  });
});
