// Pruebas del control de ingreso (D45): quién puede tener cuenta, cómo se
// enlaza con sus datos y qué pasa al desactivar a alguien del personal.
// Solo con `bun run test:db`. Requiere el hook "Before User Created" activado
// en el panel de Supabase. Cada prueba borra las cuentas y filas que crea.
import { afterEach, describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteAnonimo, clienteComo } from "../../scripts/db/clientes-prueba";

const admin = PRUEBAS_SUPABASE ? clienteAdmin() : null!;
const limpiezas: (() => PromiseLike<unknown>)[] = [];

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0).reverse()) await limpiar();
});

function correoNuevo(prefijo: string) {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@efsrt.test`;
}

const CLAVE = `Clave-${crypto.randomUUID()}`;

async function crearCuenta(correo: string, confirmada: boolean) {
  const { data, error } = await admin.auth.admin.createUser({ email: correo, password: CLAVE, email_confirm: confirmada });
  if (error) throw new Error(`crear ${correo}: ${error.message}`);
  limpiezas.push(() => admin.auth.admin.deleteUser(data.user.id));
  return data.user.id;
}

async function registrarEstudiante(correo: string) {
  const { data, error } = await admin
    .from("estudiantes")
    .insert({
      tipo_documento: "DNI",
      numero_documento: `8${String(Date.now()).slice(-7)}`,
      nombres: "Ingreso",
      apellidos: "De Prueba",
      carrera: "desarrollo-sistemas",
      correo_personal: correo,
    })
    .select("id")
    .single();
  if (error) throw new Error(`registrar estudiante: ${error.message}`);
  limpiezas.push(() => admin.from("estudiantes").delete().eq("id", data.id));
  return data.id;
}

describe.skipIf(!PRUEBAS_SUPABASE)("Control de ingreso", () => {
  test("un correo no registrado no puede crear su cuenta", async () => {
    const correo = correoNuevo("intruso");
    const { data, error } = await clienteAnonimo().auth.signUp({ email: correo, password: CLAVE });
    if (data.user) limpiezas.push(() => admin.auth.admin.deleteUser(data.user!.id));
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  test("el estudiante registrado queda enlazado a su cuenta al ingresar", async () => {
    const correo = correoNuevo("estudiante");
    const estudianteId = await registrarEstudiante(correo);
    const usuarioId = await crearCuenta(correo, true);

    const { data: perfil } = await admin.from("perfiles").select("nombre, rol").eq("id", usuarioId).single();
    expect(perfil).toEqual({ nombre: "Ingreso De Prueba", rol: "estudiante" });
    const { data: estudiante } = await admin.from("estudiantes").select("usuario_id").eq("id", estudianteId).single();
    expect(estudiante?.usuario_id).toBe(usuarioId);
  });

  test("una cuenta sin confirmar el correo no se enlaza (nadie se apropia de un estudiante)", async () => {
    const correo = correoNuevo("sin-confirmar");
    const estudianteId = await registrarEstudiante(correo);
    const usuarioId = await crearCuenta(correo, false);

    const { data: perfiles } = await admin.from("perfiles").select("id").eq("id", usuarioId);
    expect(perfiles).toEqual([]);
    const { data: estudiante } = await admin.from("estudiantes").select("usuario_id").eq("id", estudianteId).single();
    expect(estudiante?.usuario_id).toBeNull();
  });

  test("el personal desactivado pierde su rol al instante", async () => {
    const correo = correoNuevo("mesa");
    const { data: fila, error } = await admin
      .from("personal")
      .insert({ correo, nombre: "Mesa Temporal", rol: "mesa-partes" })
      .select("id")
      .single();
    if (error) throw new Error(`registrar personal: ${error.message}`);
    limpiezas.push(() => admin.from("personal").delete().eq("id", fila.id));
    await crearCuenta(correo, true);

    const cliente = clienteAnonimo();
    const ingreso = await cliente.auth.signInWithPassword({ email: correo, password: CLAVE });
    expect(ingreso.error).toBeNull();
    expect((await cliente.rpc("mi_perfil")).data).toEqual([{ nombre: "Mesa Temporal", rol: "mesa-partes" }]);
    expect((await cliente.rpc("buscar_estudiantes", { p_consulta: "70000001" })).data).toHaveLength(1);

    await admin.from("personal").update({ activo: false }).eq("id", fila.id);
    expect((await cliente.rpc("mi_perfil")).data).toEqual([]);
    expect((await cliente.rpc("buscar_estudiantes", { p_consulta: "70000001" })).data).toEqual([]);
  });

  test("un estudiante no puede leer la lista del personal ni darse un rol", async () => {
    const estudiante = await clienteComo("estudiante");
    const lectura = await estudiante.from("personal").select("correo");
    expect(lectura.data ?? []).toEqual([]);

    const { data: sesion } = await estudiante.auth.getUser();
    const escalada = await estudiante.from("perfiles").update({ rol: "mesa-partes" }).eq("id", sesion.user!.id).select();
    expect(escalada.data ?? []).toEqual([]);
    const alta = await estudiante.from("personal").insert({ correo: correoNuevo("yo"), nombre: "Yo", rol: "bienestar" });
    expect(alta.error).not.toBeNull();
    expect((await estudiante.rpc("mi_perfil")).data).toEqual([
      expect.objectContaining({ rol: "estudiante" }),
    ]);
  });
});
