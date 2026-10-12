// D41: el catálogo de la base debe ser idéntico a domain/catalogo.ts. Si alguien
// edita el catálogo y olvida `bun run db:catalogo` + `bun run db:aplicar`, falla aquí.
import { describe, expect, test } from "bun:test";
import {
  CODIGOS_ESTADO,
  ESTADO_INICIAL,
  ESTADOS,
  LONGITUD_MAXIMA_MOTIVO,
  MODULOS,
  ORDEN_DEPENDENCIAS,
  TRANSICIONES,
} from "../../src/modules/tramitacion/domain/catalogo";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteComo } from "../../scripts/db/clientes-prueba";

describe.skipIf(!PRUEBAS_SUPABASE)("Catálogo de la base = catalogo.ts", () => {
  test("estados, dependencias, transiciones y módulos coinciden", async () => {
    const cliente = await clienteComo("estudiante");
    const [estados, dependencias, transiciones, modulos] = await Promise.all([
      cliente.from("estados").select("codigo, nombre, dependencia, tipo, es_inicial").order("codigo"),
      cliente.from("dependencias").select("codigo").order("orden"),
      cliente.from("transiciones").select("desde, hacia").order("desde").order("hacia"),
      cliente.from("modulos").select("codigo").order("orden"),
    ]);

    expect(estados.data).toEqual(
      CODIGOS_ESTADO.map((codigo) => ({
        codigo,
        nombre: ESTADOS[codigo].nombre,
        dependencia: ESTADOS[codigo].dependencia,
        tipo: ESTADOS[codigo].tipo,
        es_inicial: codigo === ESTADO_INICIAL,
      })),
    );
    expect(dependencias.data?.map((d) => d.codigo)).toEqual(ORDEN_DEPENDENCIAS);
    expect(transiciones.data).toEqual(
      CODIGOS_ESTADO.flatMap((desde) => [...TRANSICIONES[desde]].sort().map((hacia) => ({ desde, hacia }))),
    );
    expect(modulos.data?.map((m) => m.codigo)).toEqual([...MODULOS]);
  });

  test(`el motivo no puede pasar de ${LONGITUD_MAXIMA_MOTIVO} caracteres`, async () => {
    // Insert directo con la clave secreta: el CHECK de la tabla lo rechaza antes que nada.
    const { error } = await clienteAdmin()
      .from("historial")
      .insert({
        expediente_id: crypto.randomUUID(),
        estado_nuevo: "01",
        actor_id: crypto.randomUUID(),
        actor_nombre: "",
        actor_dependencia: "mesa-partes",
        motivo: "x".repeat(LONGITUD_MAXIMA_MOTIVO + 1),
      });
    expect(error).not.toBeNull();
  });
});
