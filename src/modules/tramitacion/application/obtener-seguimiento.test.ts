import { describe, expect, test } from "bun:test";
import { abrirExpediente, aplicarCambioEstado, exigeDocente, ubicacionDe, type CodigoEstado } from "../domain";
import { ACTORES, DOCENTES, FECHA } from "../domain/ayudas-prueba";
import { EXPEDIENTES_DE_PRUEBA, ESTUDIANTE_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { crearDependenciasDePrueba } from "./ayudas-prueba";
import { crearObtenerSeguimientoDelEstudiante, type SeguimientoModulo } from "./obtener-seguimiento";

async function seguimientoDelEstudiante(): Promise<SeguimientoModulo[]> {
  const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
  return crearObtenerSeguimientoDelEstudiante(dependencias)(ESTUDIANTE_DE_PRUEBA.id);
}

describe("obtenerSeguimientoDelEstudiante (datos del mockup)", () => {
  test("siempre devuelve los tres módulos en orden", async () => {
    expect((await seguimientoDelEstudiante()).map((s) => s.modulo)).toEqual(["I", "II", "III"]);
  });

  test("Módulo I: constancia lista, todas las etapas completadas", async () => {
    const [moduloI] = await seguimientoDelEstudiante();
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
    const [, moduloII] = await seguimientoDelEstudiante();
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
    const [, moduloII] = await seguimientoDelEstudiante();
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
    const [, , moduloIII] = await seguimientoDelEstudiante();
    expect(moduloIII).toEqual({ modulo: "III", expediente: null });
  });

  describe("cuando el expediente ya pasó a la oficina siguiente (D56)", () => {
    /** Módulo III de Giancarlos, llevado por el camino sin observaciones hasta `hasta`. */
    async function seguimientoEn(hasta: CodigoEstado) {
      const camino: CodigoEstado[] = ["03", "05", "06", "07", "09", "10"];
      let expediente = abrirExpediente(
        { id: "exp-III", estudianteId: ESTUDIANTE_DE_PRUEBA.id, modulo: "III" },
        { actor: ACTORES["mesa-partes"], fecha: FECHA },
      );
      for (const hacia of camino.slice(0, camino.indexOf(hasta) + 1)) {
        if (!expediente.ok) break;
        expediente = aplicarCambioEstado(expediente.valor.expediente, {
          hacia,
          actor: ACTORES[ubicacionDe(hacia)],
          fecha: FECHA,
          docente: exigeDocente(hacia) ? DOCENTES.paredes : undefined,
        });
      }
      if (!expediente.ok) throw new Error(expediente.error);
      const { dependencias } = crearDependenciasDePrueba([expediente.valor.expediente]);
      const [, , moduloIII] = await crearObtenerSeguimientoDelEstudiante(dependencias)(ESTUDIANTE_DE_PRUEBA.id);
      return moduloIII.expediente!;
    }

    test.each([
      ["03", "coordinacion", ["completada", "actual", "pendiente", "pendiente"]],
      ["06", "docente", ["completada", "completada", "actual", "pendiente"]],
      ["09", "bienestar", ["completada", "completada", "completada", "actual"]],
    ] as const)("en %s ya está en %s", async (codigo, dependencia, situaciones) => {
      const expediente = await seguimientoEn(codigo);
      expect(expediente.ubicacion.dependencia).toBe(dependencia);
      expect(expediente.etapas.map((e) => e.situacion)).toEqual([...situaciones]);
    });

    test("el registro sigue en la etapa de la oficina que lo hizo", async () => {
      const [mesaPartes, coordinacion] = (await seguimientoEn("03")).etapas;
      expect(mesaPartes.eventos.map((e) => e.codigo)).toEqual(["01", "03"]);
      expect(coordinacion.eventos).toEqual([]);
    });
  });

  test("un estudiante no ve expedientes de otro", async () => {
    const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
    const seguimiento = await crearObtenerSeguimientoDelEstudiante(dependencias)("est-otro");
    expect(seguimiento.every((s) => s.expediente === null)).toBe(true);
  });
});
