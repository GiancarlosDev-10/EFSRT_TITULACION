import { describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteComo } from "../../scripts/db/clientes-prueba";
import { CARRERA_DE_PRUEBAS } from "../../scripts/db/usuarios-prueba";

// Limpieza de los datos de las pruebas automáticas (D57): borra solo lo que
// ellas crean y deja intacto el resto; el historial sigue sin poder borrarse.

/** Filas de historial de los estudiantes que NO son de prueba (sembrados y reales). */
async function historialQueSeConserva(): Promise<number> {
  const admin = clienteAdmin();
  const { data: protegidos } = await admin
    .from("estudiantes")
    .select("id")
    .or(`carrera.neq.${CARRERA_DE_PRUEBAS},usuario_id.not.is.null`);
  const ids = (protegidos ?? []).map((e) => e.id);
  const { data: expedientes } = await admin.from("expedientes").select("id").in("estudiante_id", ids);
  const { count } = await admin
    .from("historial")
    .select("id", { count: "exact", head: true })
    .in("expediente_id", (expedientes ?? []).map((e) => e.id));
  return count ?? 0;
}

/** Mesa de Partes registra un estudiante de prueba, le abre un expediente y lo observa. */
async function crearEstudianteDePrueba(): Promise<{ estudianteId: string; expedienteId: string }> {
  const mesa = await clienteComo("mesaPartes");
  const documento = String(90_000_000 + Math.floor(Math.random() * 9_999_999));
  const { data, error } = await mesa
    .from("estudiantes")
    .insert({
      tipo_documento: "DNI",
      numero_documento: documento,
      nombres: "Prueba",
      apellidos: "Automática Limpieza",
      carrera: CARRERA_DE_PRUEBAS,
      correo_personal: `limpieza-${documento}@efsrt.test`,
    })
    .select("id")
    .single();
  expect(error).toBeNull();
  const expedienteId = crypto.randomUUID();
  expect((await mesa.rpc("abrir_expediente", { p_id: expedienteId, p_estudiante_id: data!.id, p_modulo: "I" })).error).toBeNull();
  const observacion = await mesa.rpc("registrar_cambio", {
    p_expediente_id: expedienteId,
    p_estado_anterior: "01",
    p_estado_nuevo: "02",
    p_motivo: "Prueba de limpieza.",
  });
  expect(observacion.error).toBeNull();
  return { estudianteId: data!.id, expedienteId };
}

describe.skipIf(!PRUEBAS_SUPABASE)("Limpieza de los datos de prueba (D57)", () => {
  test("sin la limpieza, el historial de prueba tampoco se puede borrar", async () => {
    const admin = clienteAdmin();
    const { expedienteId } = await crearEstudianteDePrueba();
    const { error } = await admin.from("historial").delete().eq("expediente_id", expedienteId);
    expect(error?.message).toBe("HISTORIAL_INMUTABLE");
  });

  test("un usuario no puede ejecutar la limpieza", async () => {
    for (const quien of ["mesaPartes", "estudiante"] as const) {
      const { error } = await (await clienteComo(quien)).rpc("limpiar_datos_de_prueba");
      expect(error).not.toBeNull();
    }
  });

  test("borra lo que crean las pruebas y nada más", async () => {
    const admin = clienteAdmin();
    const { estudianteId, expedienteId } = await crearEstudianteDePrueba();
    const conservado = await historialQueSeConserva();

    const { data: borrados, error } = await admin.rpc("limpiar_datos_de_prueba");
    expect(error).toBeNull();
    expect(borrados).toBeGreaterThanOrEqual(1);

    const quedan = async (tabla: "estudiantes" | "expedientes" | "historial" | "notificaciones", columna: string, id: string) =>
      (await admin.from(tabla).select("*", { count: "exact", head: true }).eq(columna, id)).count;
    expect(await quedan("estudiantes", "id", estudianteId)).toBe(0);
    expect(await quedan("expedientes", "id", expedienteId)).toBe(0);
    expect(await quedan("historial", "expediente_id", expedienteId)).toBe(0);
    expect(await quedan("notificaciones", "estudiante_id", estudianteId)).toBe(0);

    // Giancarlos, Valeria, Estudiante De Prueba y la estudiante ajena siguen igual.
    expect(await historialQueSeConserva()).toBe(conservado);
    const { count } = await admin
      .from("estudiantes")
      .select("id", { count: "exact", head: true })
      .eq("carrera", CARRERA_DE_PRUEBAS)
      .is("usuario_id", null);
    expect(count).toBe(0);
  });
});
