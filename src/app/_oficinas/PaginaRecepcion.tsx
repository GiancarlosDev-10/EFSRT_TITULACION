// Recepción de la carpeta física (solo Mesa de Partes): paso 1, buscar al
// estudiante (?q=…); paso 2, elegir el módulo (?estudiante=…).
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirRol } from "@/modules/auth";
import {
  ChipsModulos,
  ESTADO_INICIAL,
  ESTADOS,
  FormularioRecepcion,
  PasosRecepcion,
  RUTAS_OFICINA,
  RUTAS_RECEPCION,
  RecepcionBuscar,
  buscarParaRecepcion,
  nombreCompleto,
  nombresDeModulos,
  obtenerCandidatoRecepcion,
} from "@/modules/tramitacion";
import { Avatar, CargandoPagina, EncabezadoPagina, IconoCheck, MarcoPagina, esUuid } from "@/shared";
import { registrarRecepcionDeOficina } from "./acciones";

type Parametros = Promise<Record<string, string | string[] | undefined>>;

const LARGO_MAXIMO_BUSQUEDA = 80;

export function Encabezado() {
  return (
    <EncabezadoPagina
      volverA={RUTAS_OFICINA.bandeja("mesa-partes")}
      etiquetaVolver="Volver a la bandeja"
      titulo="Registrar recepción"
      subtitulo={`Cuando recibes la carpeta física. El expediente nace en ${ESTADO_INICIAL} · ${ESTADOS[ESTADO_INICIAL].nombre}.`}
    />
  );
}

export function PaginaRecepcion({ searchParams }: { searchParams: Parametros }) {
  return (
    <MarcoPagina>
      <Suspense fallback={<CargandoPagina etiqueta="Verificando tu acceso" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </MarcoPagina>
  );
}

async function Contenido({ searchParams }: { searchParams: Parametros }) {
  await exigirRol("mesa-partes");
  const parametros = await searchParams;

  if (parametros.estudiante !== undefined) {
    if (!esUuid(parametros.estudiante)) notFound();
    return <ElegirModulo estudianteId={parametros.estudiante} esNuevo={parametros.nuevo === "1"} />;
  }

  const consulta = typeof parametros.q === "string" ? parametros.q.trim().slice(0, LARGO_MAXIMO_BUSQUEDA) : "";
  const candidatos = await buscarParaRecepcion(consulta);
  return (
    <>
      <Encabezado />
      <PasosRecepcion actual={1} />
      <RecepcionBuscar consulta={consulta} candidatos={candidatos} />
    </>
  );
}

async function ElegirModulo({ estudianteId, esNuevo }: { estudianteId: string; esNuevo: boolean }) {
  const candidato = await obtenerCandidatoRecepcion(estudianteId);
  if (!candidato) notFound();
  const { estudiante, modulos } = candidato;
  const nombre = nombreCompleto(estudiante);

  return (
    <>
      <Encabezado />
      <PasosRecepcion actual={2} />
      {esNuevo && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-ok/30 bg-ok-bg p-4 text-ok">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ok text-white">
            <IconoCheck tamano={14} />
          </span>
          <span className="text-sm">
            <b>Registraste a {nombre}.</b> <span className="text-ink">Ahora elige el módulo de su carpeta.</span>
          </span>
        </div>
      )}
      <section aria-label="Estudiante" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <Avatar nombre={nombre} className="size-10 text-sm" />
        <span className="flex min-w-0 grow flex-col gap-1">
          <span className="truncate text-sm font-semibold">{nombre}</span>
          <span className="font-mono text-[11px] text-muted">
            {estudiante.tipoDocumento} {estudiante.numeroDocumento}
          </span>
          <ChipsModulos modulos={modulos} />
        </span>
        <Link
          href={RUTAS_RECEPCION.buscar}
          className="flex min-h-11 shrink-0 items-center rounded-xl px-2 text-sm font-semibold text-navy hover:bg-navy-tint"
        >
          Cambiar
        </Link>
      </section>
      <section className="rounded-2xl border border-line bg-white">
        <FormularioRecepcion
          estudianteId={estudiante.id}
          modulos={modulos}
          nombresModulo={nombresDeModulos(estudiante.carrera)}
          accion={registrarRecepcionDeOficina}
        />
      </section>
    </>
  );
}
