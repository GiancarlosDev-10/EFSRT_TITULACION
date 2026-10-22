// Contra el proyecto de desarrollo: solo con `bun run test:db`, sobre los datos
// de `bun run db:sembrar`. Comprueba que la lectura de oficina trae al
// estudiante y que el RLS recorta lo que ve cada sesión.
import { beforeAll, describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteComo } from "../../../../scripts/db/clientes-prueba";
import { ESTUDIANTES_PRUEBA } from "../../../../scripts/db/usuarios-prueba";
import { crearConsultasSupabase } from "./consultas-supabase";

// El estudiante de prueba tiene el Módulo II en 08, supervisado por el docente de prueba.
let expedienteObservado: string;

describe.skipIf(!PRUEBAS_SUPABASE)("ConsultasDeOficina (Supabase)", () => {
  beforeAll(async () => {
    const admin = clienteAdmin();
    const { data: estudiante } = await admin
      .from("estudiantes")
      .select("id")
      .eq("numero_documento", ESTUDIANTES_PRUEBA.estudiante.numero_documento)
      .single();
    const { data: expediente } = await admin
      .from("expedientes")
      .select("id")
      .eq("estudiante_id", estudiante!.id)
      .eq("modulo", "II")
      .single();
    expedienteObservado = expediente!.id;
  });

  test("Mesa de Partes lista expedientes con los datos del estudiante", async () => {
    const consultas = crearConsultasSupabase(await clienteComo("mesaPartes"));
    const lista = await consultas.listarExpedientes();
    const fila = lista.find((dato) => dato.expediente.id === expedienteObservado);

    expect(fila?.expediente.estado).toBe("08");
    expect(fila?.estudiante).toMatchObject({
      nombres: ESTUDIANTES_PRUEBA.estudiante.nombres,
      tipoDocumento: "DNI",
      numeroDocumento: ESTUDIANTES_PRUEBA.estudiante.numero_documento,
      carrera: "desarrollo-sistemas",
    });
  });

  test("el docente asignado lo encuentra; otro docente, no", async () => {
    const delDocente = await crearConsultasSupabase(await clienteComo("docente")).buscarExpediente(expedienteObservado);
    expect(delDocente?.estudiante.numeroDocumento).toBe(ESTUDIANTES_PRUEBA.estudiante.numero_documento);

    const ajeno = await crearConsultasSupabase(await clienteComo("docenteAjeno")).buscarExpediente(expedienteObservado);
    expect(ajeno).toBeNull();
  });

  test("Coordinación de otra carrera no lista nada de Desarrollo de Sistemas", async () => {
    const consultas = crearConsultasSupabase(await clienteComo("coordinacionAjena"));
    expect(await consultas.listarExpedientes()).toEqual([]);
  });
});
