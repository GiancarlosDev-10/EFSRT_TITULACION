import { beforeAll, describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteComo, type Cliente } from "../../scripts/db/clientes-prueba";
import { CARRERA_DE_PRUEBAS, ESTUDIANTES_PRUEBA } from "../../scripts/db/usuarios-prueba";

// Bandeja de salida de los avisos (D20, D55). Cada corrida registra un
// estudiante nuevo con correo .test (nunca se le envía nada) en la carrera de
// pruebas y le abre un expediente como Mesa de Partes.
let admin: Cliente;
let estudianteId: string;
let expedienteId: string;

async function avisosDe(expediente: string) {
  const { data: historial } = await admin.from("historial").select("id").eq("expediente_id", expediente).order("id");
  const ids = (historial ?? []).map((h) => h.id);
  const { data } = await admin.from("notificaciones").select("*").in("historial_id", ids).order("id");
  return data ?? [];
}

describe.skipIf(!PRUEBAS_SUPABASE)("Bandeja de salida de notificaciones", () => {
  beforeAll(async () => {
    admin = clienteAdmin();
    const mesa = await clienteComo("mesaPartes");
    const documento = String(90_000_000 + Math.floor(Math.random() * 9_999_999));
    const alta = await mesa
      .from("estudiantes")
      .insert({
        tipo_documento: "DNI",
        numero_documento: documento,
        nombres: "Aviso",
        apellidos: "Automática Notificaciones",
        carrera: CARRERA_DE_PRUEBAS,
        correo_personal: `aviso-${documento}@efsrt.test`,
      })
      .select("id")
      .single();
    expect(alta.error).toBeNull();
    estudianteId = alta.data!.id;
    expedienteId = crypto.randomUUID();
    const apertura = await mesa.rpc("abrir_expediente", { p_id: expedienteId, p_estudiante_id: estudianteId, p_modulo: "I" });
    expect(apertura.error).toBeNull();
  });

  test("abrir un expediente crea su aviso en la misma operación, con los datos del momento", async () => {
    const [aviso] = await avisosDe(expedienteId);
    expect(aviso).toMatchObject({
      estudiante_id: estudianteId,
      nombres: "Aviso",
      carrera: CARRERA_DE_PRUEBAS,
      modulo: "I",
      estado_codigo: "01",
      apertura: true,
    });
  });

  test("cada cambio de estado crea otro aviso, con el motivo", async () => {
    const mesa = await clienteComo("mesaPartes");
    const cambio = await mesa.rpc("registrar_cambio", {
      p_expediente_id: expedienteId,
      p_estado_anterior: "01",
      p_estado_nuevo: "02",
      p_motivo: "El voucher no es legible.",
    });
    expect(cambio.error).toBeNull();
    const avisos = await avisosDe(expedienteId);
    expect(avisos).toHaveLength(2);
    expect(avisos[1]).toMatchObject({ estado_codigo: "02", apertura: false, motivo: "El voucher no es legible." });
  });

  test("a un correo de prueba (.test) no se envía: el aviso queda omitido y sin destinatarios", async () => {
    for (const aviso of await avisosDe(expedienteId)) {
      expect(aviso.envio).toBe("omitido");
      expect(aviso.destinatarios).toEqual([]);
    }
  });

  test("un cambio rechazado no deja aviso", async () => {
    const coordinacion = await clienteComo("coordinacion");
    const { error } = await coordinacion.rpc("registrar_cambio", {
      p_expediente_id: expedienteId,
      p_estado_anterior: "02",
      p_estado_nuevo: "03",
    });
    expect(error).not.toBeNull();
    expect(await avisosDe(expedienteId)).toHaveLength(2);
  });

  test("lo que se carga con la clave secreta (la siembra) no crea avisos", async () => {
    const { data: sembrado } = await admin
      .from("estudiantes")
      .select("id")
      .eq("numero_documento", ESTUDIANTES_PRUEBA.estudiante.numero_documento)
      .single();
    const { data: expedientes } = await admin.from("expedientes").select("id").eq("estudiante_id", sembrado!.id);
    for (const { id } of expedientes ?? []) {
      const { data: historial } = await admin.from("historial").select("id, actor_id").eq("expediente_id", id).order("id").limit(1);
      const { count } = await admin
        .from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("historial_id", historial![0].id);
      expect(count).toBe(0);
    }
  });

  test("el estudiante solo lee sus avisos; las oficinas no los ven", async () => {
    const estudiante = await clienteComo("estudiante");
    const { data: propio } = await admin
      .from("estudiantes")
      .select("id")
      .eq("numero_documento", ESTUDIANTES_PRUEBA.estudiante.numero_documento)
      .single();
    const { data: suyos, error } = await estudiante.from("notificaciones").select("estudiante_id");
    expect(error).toBeNull();
    for (const fila of suyos ?? []) expect(fila.estudiante_id).toBe(propio!.id);

    for (const oficina of ["mesaPartes", "coordinacion", "bienestar"] as const) {
      const { data } = await (await clienteComo(oficina)).from("notificaciones").select("id");
      expect(data ?? []).toHaveLength(0);
    }
  });

  test("nadie crea, edita, borra ni reclama avisos por la API", async () => {
    const mesa = await clienteComo("mesaPartes");
    const [aviso] = await avisosDe(expedienteId);

    const edicion = await mesa.from("notificaciones").update({ envio: "enviado" }).eq("id", aviso.id).select();
    expect(edicion.data ?? []).toHaveLength(0);
    const borrado = await mesa.from("notificaciones").delete().eq("id", aviso.id).select();
    expect(borrado.data ?? []).toHaveLength(0);
    const alta = await mesa.from("notificaciones").insert({ ...aviso, id: undefined, historial_id: aviso.historial_id });
    expect(alta.error).not.toBeNull();
    const reclamo = await mesa.rpc("reclamar_notificaciones", {});
    expect(reclamo.error).not.toBeNull();

    const [despues] = await avisosDe(expedienteId);
    expect(despues).toEqual(aviso);
  });
});
