import { describe, expect, test } from "bun:test";
import {
  abrirExpediente,
  aplicarCambioEstado,
  ubicacionDe,
  type CodigoEstado,
  type DocenteAsignado,
  type Expediente,
  type Modulo,
} from "../domain";
import { ACTORES, DOCENTES } from "../domain/ayudas-prueba";
import { EXPEDIENTES_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { FICHA_DE_PRUEBA, crearDependenciasDePrueba } from "./ayudas-prueba";
import {
  coincideConEstudiante,
  crearObtenerBandeja,
  crearObtenerExpedienteDeOficina,
  type FilaBandeja,
} from "./consultas-oficina";
import type { FichaEstudiante } from "./puertos";

const BEATRIZ: FichaEstudiante = {
  id: "est-beatriz",
  nombres: "Beatriz Ángela",
  apellidos: "Quispe Ñahui",
  tipoDocumento: "DNI",
  numeroDocumento: "72458190",
  carrera: "desarrollo-sistemas",
  correoInstitucional: null,
  correoPersonal: "beatriz@gmail.com",
};
const CARLOS: FichaEstudiante = {
  id: "est-carlos",
  nombres: "Carlos",
  apellidos: "Chávez Soto",
  tipoDocumento: "CE",
  numeroDocumento: "001234567",
  carrera: "desarrollo-sistemas",
  correoInstitucional: null,
  correoPersonal: "carlos@hotmail.com",
};
const SALAZAR = { id: "doc-salazar", nombre: "Lic. C. Salazar" }; // desactivado en el directorio de prueba

/** Expediente que recorre `pasos`, un día por paso desde `dia` de octubre. */
function construir(
  id: string,
  estudianteId: string,
  modulo: Modulo,
  dia: number,
  pasos: CodigoEstado[],
  docente: DocenteAsignado = DOCENTES.paredes,
): Expediente {
  const fecha = (n: number) => new Date(`2026-10-${String(dia + n).padStart(2, "0")}T09:00:00-05:00`);
  let resultado = abrirExpediente({ id, estudianteId, modulo }, { actor: ACTORES["mesa-partes"], fecha: fecha(0) });
  pasos.forEach((hacia, i) => {
    if (!resultado.ok) return;
    resultado = aplicarCambioEstado(resultado.valor.expediente, {
      hacia,
      actor: ACTORES[ubicacionDe(hacia)],
      fecha: fecha(i + 1),
      motivo: ["02", "04", "08"].includes(hacia) ? "Falta un documento." : undefined,
      docente,
    });
  });
  if (!resultado.ok) throw new Error(`${id}: ${resultado.error}`);
  return resultado.valor.expediente;
}

// Giancarlos: I en 10 y II en 08 (Paredes), de los datos de prueba.
const EXPEDIENTES = [
  ...EXPEDIENTES_DE_PRUEBA,
  construir("b-I", BEATRIZ.id, "I", 1, ["03", "05"]), // por asignar docente
  construir("b-II", BEATRIZ.id, "II", 2, ["03", "04"]), // observado por Coordinación
  construir("b-III", BEATRIZ.id, "III", 10, ["03"]), // recién derivado a Coordinación
  construir("c-I", CARLOS.id, "I", 3, ["03", "05", "06", "07"], SALAZAR), // con un docente desactivado
  construir("c-II", CARLOS.id, "II", 15, []), // recién recibido en Mesa de Partes
];

function preparar() {
  const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES, [FICHA_DE_PRUEBA, BEATRIZ, CARLOS]);
  return {
    obtenerBandeja: crearObtenerBandeja(dependencias),
    obtenerExpediente: crearObtenerExpedienteDeOficina(dependencias),
  };
}

const ids = (filas: FilaBandeja[]) => filas.map((fila) => fila.expedienteId);

describe("obtenerBandeja", () => {
  test("Coordinación: lo que espera de ella (más antiguo primero), incluido el docente desactivado", async () => {
    const bandeja = await preparar().obtenerBandeja("coordinacion");
    expect(ids(bandeja.porAtender)).toEqual(["b-I", "c-I", "b-III"]);
    expect(bandeja.porAtender.find((f) => f.expedienteId === "c-I")?.docenteDesactivado).toBe(true);
    expect(ids(bandeja.observados)).toEqual(["b-II"]);
  });

  test("Docente: sus estados en curso; la observación vigente va aparte", async () => {
    const bandeja = await preparar().obtenerBandeja("docente");
    expect(ids(bandeja.porAtender)).toEqual(["c-I"]);
    expect(ids(bandeja.observados)).toEqual(["exp-giancarlos-II"]);
    // El aviso de docente desactivado solo lo recibe quien puede cambiarlo.
    expect(bandeja.porAtender[0].docenteDesactivado).toBe(false);
  });

  test("Mesa de Partes y Bienestar", async () => {
    const { obtenerBandeja } = preparar();
    expect(ids((await obtenerBandeja("mesa-partes")).porAtender)).toEqual(["c-II"]);
    expect(ids((await obtenerBandeja("bienestar")).porAtender)).toEqual([]);
    expect((await obtenerBandeja("bienestar")).observados).toEqual([]);
  });

  test("Estudiantes: uno por fila con sus tres módulos, el de movimiento más reciente primero", async () => {
    const { estudiantes } = await preparar().obtenerBandeja("mesa-partes");
    expect(estudiantes.map((e) => e.estudiante.nombre)).toEqual(["Carlos Chávez Soto", "Beatriz Ángela Quispe Ñahui", "Giancarlos Ormeño"]);
    expect(estudiantes[2].estudiante.documento).toBe("DNI 70000001");
    expect(Object.fromEntries(Object.entries(estudiantes[2].modulos).map(([m, fila]) => [m, fila?.estado ?? null]))).toEqual({
      I: "10",
      II: "08",
      III: null,
    });
  });

  test("la búsqueda filtra las tres listas", async () => {
    const bandeja = await preparar().obtenerBandeja("coordinacion", "quispe");
    expect(ids(bandeja.porAtender)).toEqual(["b-I", "b-III"]);
    expect(bandeja.estudiantes.map((e) => e.estudiante.id)).toEqual([BEATRIZ.id]);
  });
});

describe("coincideConEstudiante", () => {
  test.each([
    ["", true],
    ["giancarlos", true],
    ["ORMENO", true], // sin tilde ni mayúsculas
    ["gian orm", true], // partes de nombre y apellido
    ["70000001", true],
    ["7000", true], // inicio del documento
    ["000001", false],
    ["ormeño quispe", false],
  ])("Giancarlos con %p → %p", (consulta, esperado) => {
    expect(coincideConEstudiante(FICHA_DE_PRUEBA, consulta)).toBe(esperado);
  });

  test("el carné se encuentra con o sin ceros iniciales, y con guiones o espacios", () => {
    for (const consulta of ["001234567", "1234567", "001-234 567"]) expect(coincideConEstudiante(CARLOS, consulta)).toBe(true);
    expect(coincideConEstudiante(BEATRIZ, "ñahui angela")).toBe(true);
  });
});

describe("obtenerExpedienteDeOficina", () => {
  test("el docente ve qué puede registrar; el historial va de lo más reciente a lo más antiguo", async () => {
    const expediente = await preparar().obtenerExpediente("exp-giancarlos-II", "docente");
    expect(expediente?.acciones).toEqual(["07"]);
    expect(expediente?.puedeCambiarDocente).toBe(false);
    expect(expediente?.docentesDisponibles).toEqual([]);
    expect(expediente?.estudiante).toEqual(FICHA_DE_PRUEBA);

    const movimientos = expediente!.movimientos;
    expect(movimientos.map((m) => (m.tipo === "estado" ? m.codigo : "cambio"))).toEqual(["08", "07", "06", "05", "03", "02", "01"]);
    expect(movimientos[0]).toMatchObject({ observacion: "vigente" });
    expect(movimientos.find((m) => m.tipo === "estado" && m.codigo === "02")).toMatchObject({ observacion: "subsanada" });
    expect(movimientos.find((m) => m.tipo === "estado" && m.codigo === "06")).toMatchObject({ docente: "Mg. R. Paredes" });
  });

  test("Coordinación puede cambiar al docente en supervisión y recibe solo docentes activos", async () => {
    const expediente = await preparar().obtenerExpediente("c-I", "coordinacion");
    expect(expediente?.acciones).toEqual([]);
    expect(expediente?.puedeCambiarDocente).toBe(true);
    expect(expediente?.docenteDesactivado).toBe(true);
    expect(expediente?.docentesDisponibles.map((d) => d.id)).toEqual([DOCENTES.paredes.id, DOCENTES.vargas.id]);
  });

  test("Coordinación asigna en 05 (acción 06) pero aún no hay docente que cambiar", async () => {
    const expediente = await preparar().obtenerExpediente("b-I", "coordinacion");
    expect(expediente?.acciones).toEqual(["06"]);
    expect(expediente?.puedeCambiarDocente).toBe(false);
  });

  test("expediente inexistente", async () => {
    expect(await preparar().obtenerExpediente("no-existe", "coordinacion")).toBeNull();
  });
});
