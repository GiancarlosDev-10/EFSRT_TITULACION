import { describe, expect, test } from "bun:test";
import { ACTORES, DOCENTES } from "../domain/ayudas-prueba";
import { EXPEDIENTES_DE_PRUEBA } from "../infrastructure/datos-prueba";
import { AHORA, crearDependenciasDePrueba } from "./ayudas-prueba";
import { crearCambiarDocente } from "./cambiar-docente";

// En los datos de prueba, exp-giancarlos-II está en 08 con Mg. R. Paredes.
function preparar() {
  const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
  return { dependencias, cambiarDocente: crearCambiarDocente(dependencias) };
}

const solicitud = {
  actor: ACTORES.coordinacion,
  expedienteId: "exp-giancarlos-II",
  docenteId: DOCENTES.vargas.id,
  motivo: "Renuncia del docente.",
};

describe("cambiarDocente", () => {
  test("guarda el cambio con la fecha del servidor; el estado sigue igual", async () => {
    const { dependencias, cambiarDocente } = preparar();

    expect((await cambiarDocente(solicitud)).ok).toBe(true);
    const guardado = await dependencias.repositorio.buscarPorId("exp-giancarlos-II");
    expect(guardado?.estado).toBe("08");
    expect(guardado?.docente).toEqual(DOCENTES.vargas);
    expect(guardado?.cambiosDocente).toEqual([
      { anterior: DOCENTES.paredes, nuevo: DOCENTES.vargas, motivo: "Renuncia del docente.", actor: ACTORES.coordinacion, fecha: AHORA },
    ]);
  });

  test("no acepta un docente desactivado", async () => {
    const { cambiarDocente } = preparar();
    expect(await cambiarDocente({ ...solicitud, docenteId: "doc-salazar" })).toEqual({ ok: false, error: "DOCENTE_NO_VALIDO" });
  });

  test("después de aprobada la supervisión ya no se cambia", async () => {
    const { cambiarDocente } = preparar();
    expect(await cambiarDocente({ ...solicitud, expedienteId: "exp-giancarlos-I" })).toEqual({
      ok: false,
      error: "CAMBIO_DE_DOCENTE_NO_PERMITIDO",
    });
  });

  test("si otra persona ya cambió al docente, hay conflicto", async () => {
    const { dependencias } = preparar();
    const repositorio = dependencias.repositorio;
    // Justo después de leer, otra persona de Coordinación pone a Vargas.
    const cambiarDocente = crearCambiarDocente({
      ...dependencias,
      repositorio: {
        ...repositorio,
        async buscarPorId(id) {
          const leido = await repositorio.buscarPorId(id);
          await repositorio.registrarCambioDocente(id, {
            anterior: DOCENTES.paredes,
            nuevo: DOCENTES.vargas,
            motivo: "Otro cambio.",
            actor: ACTORES.coordinacion,
            fecha: AHORA,
          });
          return leido;
        },
      },
    });

    const resultado = await cambiarDocente({ ...solicitud, docenteId: DOCENTES.vargas.id });
    expect(resultado).toEqual({ ok: false, error: "CONFLICTO_DE_ESTADO" });
    expect((await repositorio.buscarPorId("exp-giancarlos-II"))?.cambiosDocente).toHaveLength(1);
  });
});
