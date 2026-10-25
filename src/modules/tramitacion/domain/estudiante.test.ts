import { describe, expect, test } from "bun:test";
import { validarDatosEstudiante, type EntradaEstudiante } from "./estudiante";

const VALIDO: EntradaEstudiante = {
  tipoDocumento: "DNI",
  numeroDocumento: "72458190",
  nombres: "Valeria",
  apellidos: "Quispe Huamán",
  carrera: "desarrollo-sistemas",
  correoInstitucional: "",
  correoPersonal: "valeria.quispe@gmail.com",
};

describe("validarDatosEstudiante", () => {
  test("normaliza como la base: espacios, documento y correos", () => {
    const resultado = validarDatosEstudiante({
      ...VALIDO,
      tipoDocumento: "CE",
      numeroDocumento: " 001-234 567 ",
      nombres: "  Kevin   Rafael ",
      apellidos: "Chávez  Soto",
      correoInstitucional: "  KCHAVEZ@iestpgildaballivian.edu.pe ",
      correoPersonal: "",
    });
    expect(resultado).toEqual({
      ok: true,
      valor: {
        tipoDocumento: "CE",
        numeroDocumento: "001234567",
        nombres: "Kevin Rafael",
        apellidos: "Chávez Soto",
        carrera: "desarrollo-sistemas",
        correoInstitucional: "kchavez@iestpgildaballivian.edu.pe",
        correoPersonal: null,
      },
    });
  });

  test.each([
    ["DNI", "7245819"],
    ["DNI", "724581900"],
    ["DNI", "7245819A"],
  ])("%s %s no es válido", (tipoDocumento, numeroDocumento) => {
    expect(validarDatosEstudiante({ ...VALIDO, tipoDocumento, numeroDocumento })).toEqual({
      ok: false,
      error: { numeroDocumento: "DNI_INVALIDO" },
    });
  });

  test("el carné admite letras y hasta 12 caracteres", () => {
    expect(validarDatosEstudiante({ ...VALIDO, tipoDocumento: "CE", numeroDocumento: "ab12345" }).ok).toBe(true);
    expect(validarDatosEstudiante({ ...VALIDO, tipoDocumento: "CE", numeroDocumento: "1234567890123" })).toEqual({
      ok: false,
      error: { numeroDocumento: "CE_INVALIDO" },
    });
  });

  test("devuelve todos los errores a la vez", () => {
    const resultado = validarDatosEstudiante({
      tipoDocumento: "PASAPORTE",
      numeroDocumento: "X",
      nombres: "  ",
      apellidos: undefined,
      carrera: "Desarrollo de Sistemas",
      correoInstitucional: "alguien@gmail.com",
      correoPersonal: "sin-arroba",
    });
    expect(resultado).toEqual({
      ok: false,
      error: {
        tipoDocumento: "TIPO_DOCUMENTO_INVALIDO",
        nombres: "NOMBRES_REQUERIDOS",
        apellidos: "APELLIDOS_REQUERIDOS",
        carrera: "CARRERA_INVALIDA",
        correoInstitucional: "CORREO_INSTITUCIONAL_INVALIDO",
        correoPersonal: "CORREO_INVALIDO",
      },
    });
  });

  test("exige al menos un correo", () => {
    expect(validarDatosEstudiante({ ...VALIDO, correoPersonal: " " })).toEqual({
      ok: false,
      error: { correoPersonal: "CORREO_REQUERIDO" },
    });
  });

  test("nombres de más de 100 caracteres", () => {
    expect(validarDatosEstudiante({ ...VALIDO, nombres: "a".repeat(101) })).toEqual({
      ok: false,
      error: { nombres: "NOMBRE_DEMASIADO_LARGO" },
    });
  });
});
