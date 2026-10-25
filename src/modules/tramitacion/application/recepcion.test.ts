import { describe, expect, test } from "bun:test";
import type { EntradaEstudiante } from "../domain";
import { ACTORES } from "../domain/ayudas-prueba";
import { EXPEDIENTES_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { FICHA_DE_PRUEBA, crearDependenciasDePrueba } from "./ayudas-prueba";
import { crearBuscarParaRecepcion, crearObtenerCandidatoRecepcion, crearRegistrarEstudiante } from "./recepcion";

// Giancarlos: Módulo I en 10, II en 08, III libre.
function preparar() {
  const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
  return {
    dependencias,
    buscar: crearBuscarParaRecepcion(dependencias),
    obtenerCandidato: crearObtenerCandidatoRecepcion(dependencias),
    registrarEstudiante: crearRegistrarEstudiante(dependencias),
  };
}

const NUEVA: EntradaEstudiante = {
  tipoDocumento: "DNI",
  numeroDocumento: "72458190",
  nombres: " Valeria ",
  apellidos: "Quispe Huamán",
  carrera: "desarrollo-sistemas",
  correoInstitucional: "",
  correoPersonal: "valeria.quispe@gmail.com",
};

describe("buscarParaRecepcion", () => {
  test("cada resultado trae lo que tiene en cada módulo", async () => {
    const [candidato] = await preparar().buscar("ormeño");
    expect(candidato.estudiante).toEqual(FICHA_DE_PRUEBA);
    expect(candidato.modulos).toEqual({
      I: { expedienteId: "exp-giancarlos-I", estado: "10" },
      II: { expedienteId: "exp-giancarlos-II", estado: "08" },
      III: null,
    });
  });

  test("con menos de dos caracteres no busca", async () => {
    expect(await preparar().buscar(" o ")).toEqual([]);
  });

  test("obtenerCandidato por id; null si no existe", async () => {
    const { obtenerCandidato } = preparar();
    expect((await obtenerCandidato(FICHA_DE_PRUEBA.id))?.modulos.III).toBeNull();
    expect(await obtenerCandidato("no-existe")).toBeNull();
  });
});

describe("registrarEstudiante", () => {
  test("Mesa de Partes registra con los datos normalizados; luego se encuentra", async () => {
    const { registrarEstudiante, buscar } = preparar();
    const resultado = await registrarEstudiante({ actor: ACTORES["mesa-partes"], datos: NUEVA });

    expect(resultado).toMatchObject({ ok: true, valor: { nombres: "Valeria", correoInstitucional: null } });
    expect((await buscar("72458190")).map((c) => c.estudiante.apellidos)).toEqual(["Quispe Huamán"]);
  });

  test("las demás oficinas no registran estudiantes", async () => {
    const { registrarEstudiante } = preparar();
    for (const actor of [ACTORES.coordinacion, ACTORES.docente, ACTORES.bienestar]) {
      expect(await registrarEstudiante({ actor, datos: NUEVA })).toEqual({ ok: false, error: { tipo: "DEPENDENCIA_NO_AUTORIZADA" } });
    }
  });

  test("datos inválidos: un error por campo", async () => {
    const { registrarEstudiante } = preparar();
    expect(await registrarEstudiante({ actor: ACTORES["mesa-partes"], datos: { ...NUEVA, numeroDocumento: "123", correoPersonal: "" } })).toEqual({
      ok: false,
      error: { tipo: "DATOS_INVALIDOS", campos: { numeroDocumento: "DNI_INVALIDO", correoPersonal: "CORREO_REQUERIDO" } },
    });
  });

  test("documento ya registrado", async () => {
    const { registrarEstudiante } = preparar();
    const repetido = { ...NUEVA, numeroDocumento: FICHA_DE_PRUEBA.numeroDocumento };
    expect(await registrarEstudiante({ actor: ACTORES["mesa-partes"], datos: repetido })).toEqual({
      ok: false,
      error: { tipo: "DOCUMENTO_YA_REGISTRADO" },
    });
  });
});
