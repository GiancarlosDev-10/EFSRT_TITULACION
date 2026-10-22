// Pruebas de ataque (CLAUDE.md, "Seguridad"): se llama a la API de Supabase
// directamente, como lo haría alguien desde la consola del navegador o curl,
// con la sesión de cada perfil. Ninguna debe poder saltarse las reglas.
//
// Solo con `bun run test:db`, sobre los datos de `bun run db:sembrar`.
// Ninguna prueba escribe: todas intentan algo prohibido y comprueban que el
// expediente siguió igual.
import { beforeAll, describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteAnonimo, clienteComo, type Cliente } from "../../scripts/db/clientes-prueba";
import { ESTUDIANTES_PRUEBA } from "../../scripts/db/usuarios-prueba";

// Expedientes sembrados para las pruebas: el estudiante de prueba tiene I (10) y
// II (08, docente R. Paredes); la estudiante ajena, I (10).
let expedienteObservado: string;
let expedienteAjeno: string;
let admin: Cliente;

async function estadoDe(expedienteId: string) {
  const { data } = await admin.from("expedientes").select("estado").eq("id", expedienteId).single();
  const { count } = await admin.from("historial").select("id", { count: "exact", head: true }).eq("expediente_id", expedienteId);
  return { estado: data?.estado, registros: count };
}

describe.skipIf(!PRUEBAS_SUPABASE)("Seguridad de la base (RLS, permisos y triggers)", () => {
  let antes: Awaited<ReturnType<typeof estadoDe>>;

  beforeAll(async () => {
    admin = clienteAdmin();
    const documentos = [ESTUDIANTES_PRUEBA.estudiante.numero_documento, ESTUDIANTES_PRUEBA.estudianteAjeno.numero_documento];
    const { data: estudiantes } = await admin.from("estudiantes").select("id, numero_documento").in("numero_documento", documentos);
    const id = (documento: string) => estudiantes!.find((e) => e.numero_documento === documento)!.id;
    const { data: expedientes } = await admin.from("expedientes").select("id, estudiante_id, modulo");
    expedienteObservado = expedientes!.find((e) => e.estudiante_id === id(documentos[0]) && e.modulo === "II")!.id;
    expedienteAjeno = expedientes!.find((e) => e.estudiante_id === id(documentos[1]) && e.modulo === "I")!.id;
    antes = await estadoDe(expedienteObservado);
    expect(antes.estado).toBe("08");
  });

  describe("sin sesión (solo la clave pública)", () => {
    test("no lee expedientes, historial ni estudiantes", async () => {
      const anonimo = clienteAnonimo();
      for (const tabla of ["expedientes", "historial", "estudiantes", "perfiles"] as const) {
        const { data, error } = await anonimo.from(tabla).select("*");
        expect(error?.code ?? "sin filas").toMatch(/42501|sin filas/);
        expect(data ?? []).toHaveLength(0);
      }
    });

    test("no puede llamar a las funciones de cambio de estado", async () => {
      const anonimo = clienteAnonimo();
      const { error } = await anonimo.rpc("registrar_cambio", {
        p_expediente_id: expedienteObservado,
        p_estado_anterior: "08",
        p_estado_nuevo: "07",
      });
      expect(error).not.toBeNull();
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });
  });

  describe("con sesión de estudiante", () => {
    test("ve solo sus expedientes (no los de otra estudiante)", async () => {
      const estudiante = await clienteComo("estudiante");
      const { data } = await estudiante.from("expedientes").select("id, modulo");
      expect(data?.map((e) => e.modulo).sort()).toEqual(["I", "II"]);

      const ajeno = await estudiante.from("expedientes").select("id").eq("id", expedienteAjeno);
      expect(ajeno.data).toEqual([]);
      const historialAjeno = await estudiante.from("historial").select("id").eq("expediente_id", expedienteAjeno);
      expect(historialAjeno.data).toEqual([]);
    });

    test("no ve datos de otros estudiantes ni perfiles del personal", async () => {
      const estudiante = await clienteComo("estudiante");
      const { data: estudiantes } = await estudiante.from("estudiantes").select("numero_documento");
      expect(estudiantes?.map((e) => e.numero_documento)).toEqual([ESTUDIANTES_PRUEBA.estudiante.numero_documento]);
      const { data: perfiles } = await estudiante.from("perfiles").select("rol");
      expect(perfiles).toEqual([{ rol: "estudiante" }]);
      const { data: busqueda } = await estudiante.rpc("buscar_estudiantes", { p_consulta: "chavez" });
      expect(busqueda).toEqual([]);
    });

    test("no puede cambiar el estado de su propio expediente", async () => {
      const estudiante = await clienteComo("estudiante");

      const porFuncion = await estudiante.rpc("registrar_cambio", {
        p_expediente_id: expedienteObservado,
        p_estado_anterior: "08",
        p_estado_nuevo: "07",
      });
      expect(porFuncion.error?.message).toBe("DEPENDENCIA_NO_AUTORIZADA");

      const porInsercion = await estudiante
        .from("historial")
        .insert({ expediente_id: expedienteObservado, estado_anterior: "08", estado_nuevo: "07" } as never);
      expect(porInsercion.error).not.toBeNull();

      const porActualizacion = await estudiante.from("expedientes").update({ estado: "10" }).eq("id", expedienteObservado);
      expect(porActualizacion.error?.code).toBe("42501");

      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("no puede abrir expedientes ni registrar estudiantes", async () => {
      const estudiante = await clienteComo("estudiante");
      const apertura = await estudiante.rpc("abrir_expediente", {
        p_id: crypto.randomUUID(),
        p_estudiante_id: crypto.randomUUID(),
        p_modulo: "III",
      });
      expect(apertura.error?.message).toBe("DEPENDENCIA_NO_AUTORIZADA");

      const registro = await estudiante.from("estudiantes").insert({
        tipo_documento: "DNI",
        numero_documento: "80000000",
        nombres: "Falso",
        apellidos: "Intruso",
        carrera: "desarrollo-sistemas",
        correo_personal: "intruso@efsrt.test",
      });
      expect(registro.error?.code).toBe("42501");
    });
  });

  describe("con sesión de una oficina", () => {
    test("Coordinación no puede registrar un estado del Docente Supervisor", async () => {
      const coordinacion = await clienteComo("coordinacion");
      const { error } = await coordinacion.rpc("registrar_cambio", {
        p_expediente_id: expedienteObservado,
        p_estado_anterior: "08",
        p_estado_nuevo: "07",
      });
      expect(error?.message).toBe("DEPENDENCIA_NO_AUTORIZADA");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("nadie puede saltarse estados (08→10)", async () => {
      const bienestar = await clienteComo("bienestar");
      const { error } = await bienestar.rpc("registrar_cambio", {
        p_expediente_id: expedienteObservado,
        p_estado_anterior: "08",
        p_estado_nuevo: "10",
      });
      expect(error?.message).toBe("TRANSICION_NO_PERMITIDA");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("un docente no ve ni modifica expedientes que no tiene asignados", async () => {
      const docenteAjeno = await clienteComo("docenteAjeno");
      const { data } = await docenteAjeno.from("expedientes").select("id");
      expect(data).toEqual([]);

      // Transición válida y dependencia correcta, pero el expediente no es suyo.
      const { error } = await docenteAjeno.rpc("registrar_cambio", {
        p_expediente_id: expedienteObservado,
        p_estado_anterior: "08",
        p_estado_nuevo: "07",
      });
      expect(error?.code).toBe("42501");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("el docente asignado sí ve el expediente, pero con estado desactualizado hay conflicto", async () => {
      const docente = await clienteComo("docente");
      const { data } = await docente.from("expedientes").select("id").eq("id", expedienteObservado);
      expect(data).toHaveLength(1);

      const { error } = await docente.rpc("registrar_cambio", {
        p_expediente_id: expedienteObservado,
        p_estado_anterior: "07",
        p_estado_nuevo: "08",
        p_motivo: "Observación sobre una lectura vieja.",
      });
      expect(error?.message).toBe("CONFLICTO_DE_ESTADO");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("no se puede falsificar el actor ni la fecha del historial", async () => {
      const docente = await clienteComo("docente");
      // Cualquier perfil de Coordinación (hay el de pruebas y el del video).
      const { data: coordinacion } = await admin.from("perfiles").select("id").eq("rol", "coordinacion").limit(1).single();
      const { error } = await docente.from("historial").insert({
        expediente_id: expedienteObservado,
        estado_anterior: "08",
        estado_nuevo: "07",
        actor_id: coordinacion!.id,
        actor_nombre: "Otra persona",
        actor_dependencia: "coordinacion",
        fecha: "2020-01-01T00:00:00Z",
      });
      // Sin permiso sobre esas columnas: la petición entera se rechaza.
      expect(error?.code).toBe("42501");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("Mesa de Partes encuentra estudiantes por documento o por nombre", async () => {
      const mesa = await clienteComo("mesaPartes");
      const buscar = async (consulta: string) =>
        (await mesa.rpc("buscar_estudiantes", { p_consulta: consulta })).data?.map((e) => e.nombres) ?? [];

      expect(await buscar("70000001")).toEqual(["Giancarlos"]);
      expect(await buscar("1234567")).toEqual(["Valeria"]); // carné sin ceros iniciales
      expect(await buscar("ormeno")).toEqual(["Giancarlos"]); // sin tilde
      expect(await buscar("GIAN orm")).toEqual(["Giancarlos"]); // partes de nombre y apellido
      expect(await buscar("chávez rojas")).toEqual(["Valeria"]);
    });
  });

  describe("incluso con la clave secreta (servidor)", () => {
    test("el historial no se puede editar ni borrar", async () => {
      const { data: fila } = await admin.from("historial").select("id").eq("expediente_id", expedienteObservado).limit(1).single();

      const edicion = await admin.from("historial").update({ motivo: "editado" }).eq("id", fila!.id);
      expect(edicion.error?.message).toBe("HISTORIAL_INMUTABLE");
      const borrado = await admin.from("historial").delete().eq("id", fila!.id);
      expect(borrado.error?.message).toBe("HISTORIAL_INMUTABLE");

      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("el estado del expediente solo cambia registrando en el historial", async () => {
      const { error } = await admin.from("expedientes").update({ estado: "10" }).eq("id", expedienteObservado);
      expect(error?.message).toBe("ESTADO_SOLO_DESDE_HISTORIAL");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });
  });
});
