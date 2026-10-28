import { beforeAll, describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteComo, type Cliente } from "../../scripts/db/clientes-prueba";
import { CARRERA_DE_PRUEBAS, USUARIOS_PRUEBA } from "../../scripts/db/usuarios-prueba";

// Avisos de la campana (D58). Cada corrida registra un estudiante nuevo en la
// carrera de pruebas y lleva su expediente de 01 a 09, con un cambio de docente
// en 07: Mesa de Partes → Coordinación (03) → docente (06) → Bienestar (09).
let admin: Cliente;
let estudianteId: string;
let expedienteId: string;

async function idDePersonal(correo: string) {
  const { data } = await admin.from("personal").select("id").eq("correo", correo).single();
  return data!.id;
}

/** Avisos del expediente de la corrida, vistos con la clave secreta. */
async function avisos() {
  const { data } = await admin.from("avisos").select("*").eq("expediente_id", expedienteId).order("id");
  return data ?? [];
}

/** Lo que un perfil ve del expediente de la corrida (pasa por RLS). */
async function vistosPor(cliente: Cliente) {
  const { data, error } = await cliente.from("avisos").select("*").eq("expediente_id", expedienteId).order("id");
  expect(error).toBeNull();
  return data ?? [];
}

async function cambiar(cliente: Cliente, desde: string, hacia: string, docenteId?: string) {
  const { error } = await cliente.rpc("registrar_cambio", {
    p_expediente_id: expedienteId,
    p_estado_anterior: desde,
    p_estado_nuevo: hacia,
    p_docente_id: docenteId,
  });
  expect(error).toBeNull();
}

describe.skipIf(!PRUEBAS_SUPABASE)("Avisos de la campana", () => {
  beforeAll(async () => {
    admin = clienteAdmin();
    const [mesa, coordinacion, docente, docenteAjeno] = await Promise.all([
      clienteComo("mesaPartes"),
      clienteComo("coordinacion"),
      clienteComo("docente"),
      clienteComo("docenteAjeno"),
    ]);
    const documento = String(90_000_000 + Math.floor(Math.random() * 9_999_999));
    const alta = await mesa
      .from("estudiantes")
      .insert({
        tipo_documento: "DNI",
        numero_documento: documento,
        nombres: "Campana",
        apellidos: "Automática Avisos",
        carrera: CARRERA_DE_PRUEBAS,
        correo_personal: `campana-${documento}@efsrt.test`,
      })
      .select("id")
      .single();
    expect(alta.error).toBeNull();
    estudianteId = alta.data!.id;
    expedienteId = crypto.randomUUID();
    const apertura = await mesa.rpc("abrir_expediente", { p_id: expedienteId, p_estudiante_id: estudianteId, p_modulo: "I" });
    expect(apertura.error).toBeNull();

    await cambiar(mesa, "01", "03");
    await cambiar(coordinacion, "03", "05");
    await cambiar(coordinacion, "05", "06", await idDePersonal(USUARIOS_PRUEBA.docente.correo));
    await cambiar(docente, "06", "07");
    const cambio = await coordinacion.rpc("cambiar_docente", {
      p_expediente_id: expedienteId,
      p_docente_anterior_id: await idDePersonal(USUARIOS_PRUEBA.docente.correo),
      p_docente_nuevo_id: await idDePersonal(USUARIOS_PRUEBA.docenteAjeno.correo),
      p_motivo: "Renunció el docente.",
    });
    expect(cambio.error).toBeNull();
    await cambiar(docenteAjeno, "07", "09");
  });

  test("el estudiante recibe un aviso por cada cambio de estado y por el cambio de docente", async () => {
    const suyos = (await avisos()).filter((a) => a.estudiante_id === estudianteId);
    expect(suyos.map((a) => [a.estado_codigo, a.cambio_docente_id !== null])).toEqual([
      ["01", false],
      ["03", false],
      ["05", false],
      ["06", false],
      ["07", false],
      ["07", true],
      ["09", false],
    ]);
    expect(suyos[3]).toMatchObject({ docente_nombre: USUARIOS_PRUEBA.docente.nombre });
    expect(suyos[5]).toMatchObject({
      docente_nombre: USUARIOS_PRUEBA.docenteAjeno.nombre,
      docente_anterior_nombre: USUARIOS_PRUEBA.docente.nombre,
    });
    expect(suyos.every((a) => a.estudiante_nombre === "Campana Automática Avisos" && a.modulo === "I")).toBe(true);
  });

  test("también por correo: el 06 lleva al docente y el cambio de docente deja su propio aviso, sin el motivo", async () => {
    const { data } = await admin.from("notificaciones").select("*").eq("estudiante_id", estudianteId).order("id");
    const correos = data ?? [];
    expect(correos.find((c) => c.estado_codigo === "06")).toMatchObject({ docente_nombre: USUARIOS_PRUEBA.docente.nombre });
    const cambio = correos.filter((c) => c.cambio_docente_id !== null);
    expect(cambio).toHaveLength(1);
    expect(cambio[0]).toMatchObject({
      historial_id: null,
      estado_codigo: "07",
      apertura: false,
      motivo: null,
      docente_nombre: USUARIOS_PRUEBA.docenteAjeno.nombre,
      docente_anterior_nombre: USUARIOS_PRUEBA.docente.nombre,
    });
  });

  test("Coordinación de la carrera recibe el 03; la de otra carrera, nada", async () => {
    const vistos = await vistosPor(await clienteComo("coordinacion"));
    expect(vistos.map((a) => [a.oficina, a.carrera, a.estado_codigo])).toEqual([["coordinacion", CARRERA_DE_PRUEBAS, "03"]]);
    expect(await vistosPor(await clienteComo("coordinacionAjena"))).toHaveLength(0);
  });

  test("Bienestar recibe el 09", async () => {
    const vistos = await vistosPor(await clienteComo("bienestar"));
    expect(vistos.map((a) => [a.oficina, a.carrera, a.estado_codigo])).toEqual([["bienestar", null, "09"]]);
  });

  test("el docente asignado recibe el 06 y el nuevo recibe el cambio; al anterior no se le avisa del cambio", async () => {
    const anterior = await vistosPor(await clienteComo("docente"));
    expect(anterior.map((a) => [a.estado_codigo, a.cambio_docente_id !== null])).toEqual([["06", false]]);
    const nuevo = await vistosPor(await clienteComo("docenteAjeno"));
    expect(nuevo).toHaveLength(1);
    expect(nuevo[0]).toMatchObject({
      cambio_docente_id: expect.any(Number),
      docente_nombre: USUARIOS_PRUEBA.docenteAjeno.nombre,
      docente_anterior_nombre: USUARIOS_PRUEBA.docente.nombre,
    });
  });

  test("Mesa de Partes no recibe avisos y otro estudiante no ve los ajenos", async () => {
    expect(await vistosPor(await clienteComo("mesaPartes"))).toHaveLength(0);
    expect(await vistosPor(await clienteComo("estudiante"))).toHaveLength(0);
    expect((await avisos()).some((a) => a.oficina === "mesa-partes")).toBe(false);
  });

  test("marcar como leído solo toca los propios y hasta el último que se vio", async () => {
    const coordinacion = await clienteComo("coordinacion");
    const [suyo] = await vistosPor(coordinacion);

    // Hasta un id anterior al suyo: no marca el aviso de esta corrida.
    await coordinacion.rpc("marcar_avisos_leidos", { p_hasta_id: suyo.id - 1 });
    expect((await vistosPor(coordinacion))[0].leido_en).toBeNull();

    // Otra Coordinación no puede marcarlo.
    await (await clienteComo("coordinacionAjena")).rpc("marcar_avisos_leidos", { p_hasta_id: suyo.id });
    expect((await vistosPor(coordinacion))[0].leido_en).toBeNull();

    const { data: marcados, error } = await coordinacion.rpc("marcar_avisos_leidos", { p_hasta_id: suyo.id });
    expect(error).toBeNull();
    expect(marcados).toBeGreaterThanOrEqual(1);
    expect((await vistosPor(coordinacion))[0].leido_en).not.toBeNull();

    // Los del estudiante y de las demás oficinas siguen sin leer.
    const resto = (await avisos()).filter((a) => a.id !== suyo.id);
    expect(resto.every((a) => a.leido_en === null)).toBe(true);
  });

  test("nadie crea, edita ni borra avisos por la API", async () => {
    const bienestar = await clienteComo("bienestar");
    const [suyo] = await vistosPor(bienestar);

    const edicion = await bienestar.from("avisos").update({ leido_en: new Date().toISOString() }).eq("id", suyo.id).select();
    expect(edicion.data ?? []).toHaveLength(0);
    const borrado = await bienestar.from("avisos").delete().eq("id", suyo.id).select();
    expect(borrado.data ?? []).toHaveLength(0);
    const alta = await bienestar.from("avisos").insert({ ...suyo, id: undefined });
    expect(alta.error).not.toBeNull();

    const [despues] = await vistosPor(bienestar);
    expect(despues).toEqual(suyo);
  });
});
