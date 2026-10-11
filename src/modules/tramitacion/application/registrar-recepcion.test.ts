import { describe, expect, test } from "bun:test";
import { ACTORES } from "../domain/ayudas-prueba";
import { AHORA, crearDependenciasDePrueba } from "./ayudas-prueba";
import { crearRegistrarRecepcion } from "./registrar-recepcion";

const solicitud = { actor: ACTORES["mesa-partes"], estudianteId: "est-1", modulo: "I" } as const;

describe("registrarRecepcion", () => {
  test("abre el expediente en 01, lo guarda y publica el evento", async () => {
    const { dependencias, eventosPublicados } = crearDependenciasDePrueba();
    const resultado = await crearRegistrarRecepcion(dependencias)(solicitud);

    expect(resultado.ok).toBe(true);
    const guardado = await dependencias.repositorio.buscarPorId("exp-1");
    expect(guardado?.estado).toBe("01");
    expect(guardado?.historial[0].fecha).toBe(AHORA);
    expect(eventosPublicados).toHaveLength(1);
    expect(eventosPublicados[0].registro.estadoNuevo).toBe("01");
  });

  test("rechaza un segundo expediente para el mismo estudiante y módulo", async () => {
    const { dependencias, eventosPublicados } = crearDependenciasDePrueba();
    const registrarRecepcion = crearRegistrarRecepcion(dependencias);

    await registrarRecepcion(solicitud);
    const segundo = await registrarRecepcion(solicitud);

    expect(segundo).toEqual({ ok: false, error: "EXPEDIENTE_YA_EXISTE" });
    expect(eventosPublicados).toHaveLength(1);
  });

  test("el mismo estudiante puede tener expedientes de módulos distintos", async () => {
    const { dependencias } = crearDependenciasDePrueba();
    const registrarRecepcion = crearRegistrarRecepcion(dependencias);

    await registrarRecepcion(solicitud);
    const otroModulo = await registrarRecepcion({ ...solicitud, modulo: "II" });

    expect(otroModulo.ok).toBe(true);
  });

  test("solo Mesa de Partes puede registrar la recepción", async () => {
    const { dependencias, eventosPublicados } = crearDependenciasDePrueba();
    const resultado = await crearRegistrarRecepcion(dependencias)({ ...solicitud, actor: ACTORES.docente });

    expect(resultado).toEqual({ ok: false, error: "DEPENDENCIA_NO_AUTORIZADA" });
    expect(await dependencias.repositorio.listarPorEstudiante("est-1")).toHaveLength(0);
    expect(eventosPublicados).toHaveLength(0);
  });
});
