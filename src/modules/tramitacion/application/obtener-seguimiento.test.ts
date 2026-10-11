import { describe, expect, test } from "bun:test";
import { EXPEDIENTES_DE_PRUEBA, ESTUDIANTE_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { crearDependenciasDePrueba } from "./ayudas-prueba";
import { crearObtenerSeguimientoDelEstudiante, type SeguimientoModulo } from "./obtener-seguimiento";

async function seguimientoDeLucia(): Promise<SeguimientoModulo[]> {
  const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
  return crearObtenerSeguimientoDelEstudiante(dependencias)(ESTUDIANTE_DE_PRUEBA.id);
}

describe("obtenerSeguimientoDelEstudiante (datos del mockup)", () => {
  test("siempre devuelve los tres módulos en orden", async () => {
    expect((await seguimientoDeLucia()).map((s) => s.modulo)).toEqual(["I", "II", "III"]);
  });

  test("Módulo I: constancia lista, todas las etapas completadas", async () => {
    const [moduloI] = await seguimientoDeLucia();
    expect(moduloI.expediente?.estado).toEqual({
      codigo: "10",
      nombre: "Constancia lista para recoger",
      tipo: "final",
    });
    expect(moduloI.expediente?.ubicacion.dependencia).toBe("bienestar");
    expect(moduloI.expediente?.desde).toEqual(new Date("2026-08-28T16:05:00-05:00"));
    expect(moduloI.expediente?.etapas.map((e) => e.situacion)).toEqual([
      "completada", "completada", "completada", "completada",
    ]);
  });

  test("Módulo II: observado en supervisión, Bienestar pendiente", async () => {
    const [, moduloII] = await seguimientoDeLucia();
    const etapas = moduloII.expediente!.etapas;

    expect(moduloII.expediente?.ubicacion).toEqual({ dependencia: "docente", nombre: "Docente Supervisor" });
    expect(etapas.map((e) => e.situacion)).toEqual(["completada", "completada", "observada", "pendiente"]);
    expect(etapas.map((e) => e.eventos.map((ev) => ev.codigo))).toEqual([
      ["01", "02", "03"],
      ["05", "06"],
      ["07", "08"],
      [],
    ]);
  });

  test("Módulo II: la observación de pago figura subsanada y la de supervisión vigente", async () => {
    const [, moduloII] = await seguimientoDeLucia();
    const [mesaPartes, , docente] = moduloII.expediente!.etapas;

    const pagoObservado = mesaPartes.eventos.find((e) => e.codigo === "02");
    expect(pagoObservado?.observacion).toEqual({ subsanadaEl: new Date("2026-08-04T11:26:00-05:00") });

    const supervisionObservada = docente.eventos.find((e) => e.codigo === "08");
    expect(supervisionObservada).toMatchObject({
      actor: "Mg. R. Paredes",
      nota: "Anexo 4: falta la firma y el sello del jefe inmediato en la página 3.",
      observacion: { subsanadaEl: null },
    });

    const recibido = mesaPartes.eventos.find((e) => e.codigo === "01");
    expect(recibido?.observacion).toBeNull();
  });

  test("Módulo III: sin expediente", async () => {
    const [, , moduloIII] = await seguimientoDeLucia();
    expect(moduloIII).toEqual({ modulo: "III", expediente: null });
  });

  test("un estudiante no ve expedientes de otro", async () => {
    const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
    const seguimiento = await crearObtenerSeguimientoDelEstudiante(dependencias)("est-otro");
    expect(seguimiento.every((s) => s.expediente === null)).toBe(true);
  });
});
