// Genera la migración con las filas del catálogo a partir de domain/catalogo.ts
// (D41): el catálogo se escribe una sola vez, en TypeScript, y la base lo copia.
// Uso: bun run db:catalogo  → crea supabase/migrations/AAAAMMDDNN_tramitacion_cargar_catalogo.sql
// Si el catálogo cambia (p. ej. tras las entrevistas), se vuelve a ejecutar y se
// aplica la nueva migración con `bun run db:aplicar`.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARPETA_MIGRACIONES, siguienteMigracion } from "./nombre-migracion";
import {
  CODIGOS_ESTADO,
  DEPENDENCIAS,
  ESTADO_INICIAL,
  ESTADOS,
  LONGITUD_MAXIMA_MOTIVO,
  MODULOS,
  ORDEN_DEPENDENCIAS,
  TRANSICIONES,
} from "../../src/modules/tramitacion/domain/catalogo";

const texto = (valor: string) => `'${valor.replaceAll("'", "''")}'`;
const filas = (valores: string[][]) => valores.map((v) => `  (${v.join(", ")})`).join(",\n");

export function sqlDelCatalogo(): string {
  const dependencias = ORDEN_DEPENDENCIAS.map((codigo, i) => [texto(codigo), texto(DEPENDENCIAS[codigo].nombre), String(i + 1)]);
  const estados = CODIGOS_ESTADO.map((codigo) => {
    const { nombre, dependencia, tipo } = ESTADOS[codigo];
    return [texto(codigo), texto(nombre), texto(dependencia), texto(tipo), String(codigo === ESTADO_INICIAL)];
  });
  const transiciones = CODIGOS_ESTADO.flatMap((desde) =>
    TRANSICIONES[desde].map((hacia) => [texto(desde), texto(hacia)]),
  );
  const modulos = MODULOS.map((codigo, i) => [texto(codigo), String(i + 1)]);

  return `-- GENERADO por scripts/db/generar-catalogo.ts desde domain/catalogo.ts. No editar a mano.

insert into public.dependencias (codigo, nombre, orden) values
${filas(dependencias)}
on conflict (codigo) do update set nombre = excluded.nombre, orden = excluded.orden;

insert into public.estados (codigo, nombre, dependencia, tipo, es_inicial) values
${filas(estados)}
on conflict (codigo) do update set
  nombre = excluded.nombre, dependencia = excluded.dependencia,
  tipo = excluded.tipo, es_inicial = excluded.es_inicial;

delete from public.transiciones;
insert into public.transiciones (desde, hacia) values
${filas(transiciones)};

insert into public.modulos (codigo, orden) values
${filas(modulos)}
on conflict (codigo) do update set orden = excluded.orden;

create or replace function privado.longitud_maxima_motivo()
returns integer
language sql
immutable
set search_path = ''
as $$ select ${LONGITUD_MAXIMA_MOTIVO} $$;
`;
}

if (import.meta.main) {
  const ruta = join(CARPETA_MIGRACIONES, siguienteMigracion("tramitacion_cargar_catalogo"));
  writeFileSync(ruta, sqlDelCatalogo());
  console.log(`Migración creada: ${ruta}`);
}
