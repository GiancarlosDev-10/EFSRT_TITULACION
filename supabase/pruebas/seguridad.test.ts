// Pruebas de ataque (CLAUDE.md, "Seguridad"): se llama a la API de Supabase
// directamente, como lo haría alguien desde la consola del navegador o curl,
// con la sesión de cada perfil. Ninguna debe poder saltarse las reglas.
//
// Solo con `bun run test:db`, sobre los datos de `bun run db:sembrar`.
// Ninguna prueba escribe: todas intentan algo prohibido y comprueban que el
// expediente siguió igual.
import { beforeAll, describe, expect, test } from "bun:test";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteAnonimo, clienteComo, type Cliente } from "../../scripts/db/clientes-prueba";
import { ESTUDIANTES_PRUEBA, USUARIOS_PRUEBA } from "../../scripts/db/usuarios-prueba";

// Expedientes sembrados para las pruebas: el estudiante de prueba tiene I (10) y
// II (08, con el docente de prueba), en la carrera real; la estudiante ajena, en
// la carrera de pruebas (la coordina el usuario de prueba), I (10), II (05, sin
// docente) y III (08, con el docente de prueba).
let expedienteObservado: string;
let expedienteAjeno: string;
let expedientePorAsignar: string;
let expedienteAjenoObservado: string;
let admin: Cliente;
/** Filas de `personal` (no cuentas): lo que se guarda como docente asignado. */
let personal: Record<"docente" | "docenteAjeno" | "mesaPartes", string>;

async function estadoDe(expedienteId: string) {
  const { data } = await admin.from("expedientes").select("estado, docente_id").eq("id", expedienteId).single();
  const { count } = await admin.from("historial").select("id", { count: "exact", head: true }).eq("expediente_id", expedienteId);
  const cambios = await admin.from("cambios_docente").select("id", { count: "exact", head: true }).eq("expediente_id", expedienteId);
  return { estado: data?.estado, docente: data?.docente_id, registros: count, cambiosDocente: cambios.count };
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
    expedientePorAsignar = expedientes!.find((e) => e.estudiante_id === id(documentos[1]) && e.modulo === "II")!.id;
    expedienteAjenoObservado = expedientes!.find((e) => e.estudiante_id === id(documentos[1]) && e.modulo === "III")!.id;
    const claves = ["docente", "docenteAjeno", "mesaPartes"] as const;
    const { data: filas } = await admin
      .from("personal")
      .select("id, correo")
      .in("correo", claves.map((c) => USUARIOS_PRUEBA[c].correo));
    personal = Object.fromEntries(
      claves.map((c) => [c, filas!.find((f) => f.correo === USUARIOS_PRUEBA[c].correo)!.id]),
    ) as typeof personal;
    expect((await estadoDe(expedientePorAsignar)).estado).toBe("05");
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
    test("solo Mesa de Partes registra estudiantes y abre expedientes", async () => {
      const { data: ajena } = await admin
        .from("estudiantes")
        .select("id")
        .eq("numero_documento", ESTUDIANTES_PRUEBA.estudianteAjeno.numero_documento)
        .single();
      for (const quien of ["coordinacion", "docente", "bienestar"] as const) {
        const cliente = await clienteComo(quien);
        const registro = await cliente.from("estudiantes").insert({
          tipo_documento: "DNI",
          numero_documento: "80000001",
          nombres: "Falso",
          apellidos: "Registro",
          carrera: "pruebas-automaticas",
          correo_personal: `falso-${quien}@efsrt.test`,
        });
        expect(registro.error?.code).toBe("42501");

        // La función rechaza por la oficina antes de mirar nada más.
        const apertura = await cliente.rpc("abrir_expediente", {
          p_id: crypto.randomUUID(),
          p_estudiante_id: ajena!.id,
          p_modulo: "III",
        });
        expect(apertura.error?.message).toBe("DEPENDENCIA_NO_AUTORIZADA");
      }
      const { count } = await admin.from("estudiantes").select("id", { count: "exact", head: true }).eq("numero_documento", "80000001");
      expect(count).toBe(0);
    });

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
      const { data } = await docenteAjeno.from("expedientes").select("id, docente_id");
      const visibles = data?.map((e) => e.id) ?? [];
      expect(visibles).not.toContain(expedienteObservado);
      expect(visibles).not.toContain(expedienteAjeno);
      // Lo que vea (si algo) está asignado a él.
      expect(data?.every((e) => e.docente_id === personal.docenteAjeno)).toBe(true);

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

  describe("Docente Supervisor (D49)", () => {
    test("asignar (05→06) exige un docente activo: no sirve otra persona del personal ni un id inventado", async () => {
      const coordinacion = await clienteComo("coordinacion");
      const antesDeAsignar = await estadoDe(expedientePorAsignar);
      const asignar = (docenteId?: string) =>
        coordinacion.rpc("registrar_cambio", {
          p_expediente_id: expedientePorAsignar,
          p_estado_anterior: "05",
          p_estado_nuevo: "06",
          p_docente_id: docenteId,
        });

      expect((await asignar()).error?.message).toBe("DOCENTE_REQUERIDO");
      expect((await asignar(personal.mesaPartes)).error?.message).toBe("DOCENTE_NO_VALIDO");
      expect((await asignar(crypto.randomUUID())).error?.message).toBe("DOCENTE_NO_VALIDO");
      expect(await estadoDe(expedientePorAsignar)).toEqual(antesDeAsignar);
    });

    test("solo Coordinación cambia al docente; ni el propio docente ni el estudiante", async () => {
      for (const quien of ["docente", "estudiante", "mesaPartes"] as const) {
        const cliente = await clienteComo(quien);
        const { error } = await cliente.rpc("cambiar_docente", {
          p_expediente_id: expedienteObservado,
          p_docente_anterior_id: personal.docente,
          p_docente_nuevo_id: personal.docenteAjeno,
          p_motivo: "Me cambio de docente.",
        });
        expect(error?.message).toBe("DEPENDENCIA_NO_AUTORIZADA");
      }
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("no se cambia al docente fuera de la supervisión ni con una lectura vieja", async () => {
      const coordinacion = await clienteComo("coordinacion");
      const cambiar = (expedienteId: string, anteriorId: string) =>
        coordinacion.rpc("cambiar_docente", {
          p_expediente_id: expedienteId,
          p_docente_anterior_id: anteriorId,
          p_docente_nuevo_id: personal.docenteAjeno,
          p_motivo: "Renuncia del docente.",
        });

      // Expediente ajeno en 10: la supervisión ya terminó.
      expect((await cambiar(expedienteAjeno, personal.docente)).error?.message).toBe("CAMBIO_DE_DOCENTE_NO_PERMITIDO");
      // En 08, pero diciendo que reemplaza a quien no es el docente vigente.
      const antesDelCambio = await estadoDe(expedienteAjenoObservado);
      expect((await cambiar(expedienteAjenoObservado, personal.docenteAjeno)).error?.message).toBe("CONFLICTO_DE_ESTADO");
      expect(await estadoDe(expedienteAjenoObservado)).toEqual(antesDelCambio);
    });

    test("no se puede falsificar el actor, la fecha ni los nombres de un cambio de docente", async () => {
      const coordinacion = await clienteComo("coordinacion");
      const { error } = await coordinacion.from("cambios_docente").insert({
        expediente_id: expedienteObservado,
        docente_anterior_id: personal.docente,
        docente_anterior_nombre: "Otro",
        docente_nuevo_id: personal.docenteAjeno,
        docente_nuevo_nombre: "Nombre inventado",
        motivo: "Renuncia del docente.",
        actor_id: crypto.randomUUID(),
        actor_nombre: "Otra persona",
        fecha: "2020-01-01T00:00:00Z",
      });
      expect(error?.code).toBe("42501");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

    test("la lista de docentes solo la recibe Coordinación", async () => {
      const coordinacion = await clienteComo("coordinacion");
      const { data: paraCoordinacion } = await coordinacion.rpc("docentes");
      expect(paraCoordinacion?.map((d) => d.id)).toEqual(expect.arrayContaining([personal.docente, personal.docenteAjeno]));

      for (const quien of ["mesaPartes", "docente", "estudiante"] as const) {
        const { data } = await (await clienteComo(quien)).rpc("docentes");
        expect(data).toEqual([]);
      }
    });
  });

  describe("Coordinación de otra carrera (D50)", () => {
    test("no ve expedientes, historial ni estudiantes de Desarrollo de Sistemas", async () => {
      const ajena = await clienteComo("coordinacionAjena");
      expect((await ajena.from("expedientes").select("id")).data).toEqual([]);
      expect((await ajena.from("historial").select("id").eq("expediente_id", expedientePorAsignar)).data).toEqual([]);
      expect((await ajena.from("estudiantes").select("id")).data).toEqual([]);
      expect((await ajena.rpc("buscar_estudiantes", { p_consulta: "ormeno" })).data).toEqual([]);
    });

    test("no puede registrar estados en expedientes de otra carrera", async () => {
      const ajena = await clienteComo("coordinacionAjena");
      const antesDeAsignar = await estadoDe(expedientePorAsignar);
      const { error } = await ajena.rpc("registrar_cambio", {
        p_expediente_id: expedientePorAsignar,
        p_estado_anterior: "05",
        p_estado_nuevo: "06",
        p_docente_id: personal.docente,
      });
      expect(error?.code).toBe("42501");
      expect(await estadoDe(expedientePorAsignar)).toEqual(antesDeAsignar);
    });

    test("cada Coordinación ve solo su carrera", async () => {
      // El coordinador de prueba es de la carrera de pruebas: ve a la estudiante
      // ajena, pero no a Estudiante De Prueba (carrera real).
      const propia = await clienteComo("coordinacion");
      const { data } = await propia
        .from("expedientes")
        .select("id")
        .in("id", [expedienteObservado, expedientePorAsignar, expedienteAjenoObservado]);
      expect(data?.map((e) => e.id).sort()).toEqual([expedientePorAsignar, expedienteAjenoObservado].sort());
    });
  });

  describe("incluso con la clave secreta (servidor)", () => {
    test("el docente del expediente solo cambia desde el historial o un cambio de docente", async () => {
      const edicion = await admin.from("expedientes").update({ docente_id: personal.docenteAjeno }).eq("id", expedienteObservado);
      expect(edicion.error?.message).toBe("DOCENTE_SOLO_DESDE_HISTORIAL");

      // Tampoco puede nacer con docente.
      const { data: ajena } = await admin.from("expedientes").select("estudiante_id").eq("id", expedienteAjeno).single();
      const nacimiento = await admin.from("expedientes").insert({
        id: crypto.randomUUID(),
        estudiante_id: ajena!.estudiante_id,
        modulo: "III",
        estado: "01",
        docente_id: personal.docente,
        docente_nombre: USUARIOS_PRUEBA.docente.nombre,
      });
      expect(nacimiento.error?.message).toBe("DOCENTE_SOLO_DESDE_HISTORIAL");
      expect(await estadoDe(expedienteObservado)).toEqual(antes);
    });

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
