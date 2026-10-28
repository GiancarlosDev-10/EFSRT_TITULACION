// Bandeja de una oficina (mockup Oficinas.html): pestañas y buscador por la URL
// (?vista=…&q=…), así funciona sin JavaScript (D26). Celular: tarjetas. PC: tabla.
import Link from "next/link";
import type { ReactNode } from "react";
import { IconoAlerta, IconoBuscar, IconoChevronDerecha, IconoReloj } from "@/shared";
import { DEPENDENCIAS, ESTADOS, MODULOS, dondeEsta, type Dependencia, type Modulo } from "../domain";
import type { Bandeja, FilaBandeja, FilaEstudiante } from "../application";
import { momento } from "./presentacion";
import {
  UBICACION_DE,
  diasDeEspera,
  nombreParaSaludo,
  registraObservaciones,
  tonoDeEstado,
  type VistaBandeja,
} from "./presentacion-oficina";
import { ChipCodigo } from "./ChipCodigo";
import { RUTAS_OFICINA } from "./rutas";

type Props = {
  dependencia: Dependencia;
  bandeja: Bandeja;
  vista: VistaBandeja;
  consulta: string;
  nombreUsuario: string;
  ahora: Date;
  /** Botón principal junto al título (p. ej. "Registrar recepción"). */
  accion?: ReactNode;
};

const SUBTITULO: Partial<Record<Dependencia, string>> = {
  docente: "Solo ves a los estudiantes que Coordinación te asignó.",
};

const VACIO: Record<VistaBandeja, string> = {
  atender: "No tienes expedientes por atender.",
  observados: "Ningún expediente espera una corrección del estudiante.",
  estudiantes: "Aún no hay estudiantes con expediente.",
};

export function BandejaOficina({ dependencia, bandeja, vista, consulta, nombreUsuario, ahora, accion }: Props) {
  // `corto`: etiqueta para celular cuando el nombre completo no entra en un tercio del ancho.
  const pestanas: { vista: VistaBandeja; texto: string; corto?: string; cantidad: number }[] = [
    { vista: "atender", texto: "Por atender", cantidad: bandeja.porAtender.length },
    ...(registraObservaciones(dependencia)
      ? [{ vista: "observados" as const, texto: "Observados", cantidad: bandeja.observados.length }]
      : []),
    {
      vista: "estudiantes",
      texto: dependencia === "docente" ? "Tus estudiantes" : "Estudiantes",
      corto: dependencia === "docente" ? "Estudiantes" : undefined,
      cantidad: bandeja.estudiantes.length,
    },
  ];
  const filas = vista === "observados" ? bandeja.observados : bandeja.porAtender;
  const vacia = vista === "estudiantes" ? bandeja.estudiantes.length === 0 : filas.length === 0;
  const enlaceDe = (destino: VistaBandeja) => {
    const parametros = new URLSearchParams({ vista: destino, ...(consulta ? { q: consulta } : {}) });
    return `${RUTAS_OFICINA.bandeja(dependencia)}?${parametros}`;
  };

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted">Hola, {nombreParaSaludo(nombreUsuario)}</span>
          <h1 className="font-display text-[26px] leading-tight font-extrabold lg:text-[30px]">Bandeja</h1>
          <span className="text-xs text-muted">{SUBTITULO[dependencia] ?? DEPENDENCIAS[dependencia].nombre}</span>
        </div>
        {accion}
      </div>

      <div className="flex flex-col gap-3">
        <form role="search" action={RUTAS_OFICINA.bandeja(dependencia)} className="relative flex items-center">
          <input type="hidden" name="vista" value={vista} />
          <span className="pointer-events-none absolute left-3.5 text-muted">
            <IconoBuscar tamano={18} />
          </span>
          <label htmlFor="buscar-bandeja" className="sr-only">
            Buscar estudiante
          </label>
          <input
            id="buscar-bandeja"
            type="search"
            name="q"
            defaultValue={consulta}
            enterKeyHint="search"
            placeholder="Buscar por DNI, carné o nombre"
            className="min-h-11 w-full rounded-xl border border-line bg-white pr-3.5 pl-10 text-sm placeholder:text-muted/70 focus:border-navy"
          />
        </form>

        {/* Celular: columnas iguales al ancho del buscador, número debajo. PC: fila de píldoras. */}
        <nav aria-label="Filtrar expedientes" className="grid auto-cols-fr grid-flow-col gap-1.5 lg:flex">
          {pestanas.map((pestana) => {
            const activa = pestana.vista === vista;
            return (
              <Link
                key={pestana.vista}
                href={enlaceDe(pestana.vista)}
                aria-current={activa ? "page" : undefined}
                className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 text-center text-xs leading-tight font-semibold lg:shrink-0 lg:flex-row lg:gap-2 lg:px-3.5 lg:py-0 lg:text-[13px] lg:leading-normal ${
                  activa ? "bg-ink text-white" : "border border-line bg-white text-text-soft hover:bg-bg"
                }`}
              >
                {pestana.corto ? (
                  <>
                    <span aria-hidden="true" className="lg:hidden">
                      {pestana.corto}
                    </span>
                    <span className="sr-only lg:not-sr-only">{pestana.texto}</span>
                  </>
                ) : (
                  pestana.texto
                )}
                <span className={`rounded-full px-1.5 font-mono text-[11px] ${activa ? "bg-ink-active" : "bg-neutral-bg"}`}>
                  {pestana.cantidad}
                </span>
              </Link>
            );
          })}
        </nav>
        {consulta && (
          <p className="text-xs text-muted">
            Resultados para «{consulta}» ·{" "}
            <Link href={`${RUTAS_OFICINA.bandeja(dependencia)}?vista=${vista}`} className="font-semibold text-navy underline">
              Ver todos
            </Link>
          </p>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        {vacia ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            {consulta ? "Ningún estudiante coincide con la búsqueda." : VACIO[vista]}
          </p>
        ) : vista === "estudiantes" ? (
          <TablaEstudiantes dependencia={dependencia} filas={bandeja.estudiantes} ahora={ahora} />
        ) : (
          <ListaExpedientes dependencia={dependencia} filas={filas} ahora={ahora} />
        )}
      </section>
    </>
  );
}

// ---- Por atender / Observados: una fila por expediente ---------------------

const COLUMNAS = "lg:grid-cols-[minmax(0,2fr)_70px_minmax(0,2.4fr)_minmax(0,1.2fr)_130px_20px]";

function ListaExpedientes({ dependencia, filas, ahora }: { dependencia: Dependencia; filas: FilaBandeja[]; ahora: Date }) {
  return (
    <>
      <div
        className={`hidden gap-4 border-b border-line px-5 py-3 text-[11px] font-semibold tracking-wide text-muted uppercase lg:grid ${COLUMNAS}`}
      >
        <span>Estudiante</span>
        <span>Módulo</span>
        <span>Estado</span>
        <span>Docente</span>
        <span>Último cambio</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {filas.map((fila) => (
          <li key={fila.expedienteId}>
            <FilaExpediente dependencia={dependencia} fila={fila} ahora={ahora} />
          </li>
        ))}
      </ul>
    </>
  );
}

function FilaExpediente({ dependencia, fila, ahora }: { dependencia: Dependencia; fila: FilaBandeja; ahora: Date }) {
  const espera = diasDeEspera(fila.ultimoCambio, ahora);
  return (
    <Link
      href={RUTAS_OFICINA.expediente(dependencia, fila.expedienteId)}
      className={`flex flex-col gap-2 px-5 py-4 hover:bg-bg lg:grid lg:items-center lg:gap-4 lg:py-3.5 ${COLUMNAS}`}
    >
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{fila.estudiante.nombre}</span>
          <span className="font-mono text-[11px] text-muted">{fila.estudiante.documento}</span>
        </span>
        <IconoChevronDerecha tamano={18} className="shrink-0 text-muted lg:hidden" />
      </span>
      <span className="hidden text-sm lg:block">{fila.modulo}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-start gap-2">
          <ChipCodigo codigo={fila.estado} tono={tonoDeEstado(fila.estado)} />
          <span className="text-[13px] leading-snug font-medium">{ESTADOS[fila.estado].nombre}</span>
        </span>
        {fila.docenteDesactivado && (
          <span className="inline-flex w-fit items-center gap-1 rounded-md bg-warn-bg px-1.5 py-0.5 text-[11px] font-semibold text-warn-text">
            <IconoAlerta tamano={13} />
            Docente desactivado · cámbialo
          </span>
        )}
      </span>
      <span className="hidden truncate text-[13px] text-text-soft lg:block">{fila.docente?.nombre ?? "—"}</span>
      <span className="flex items-center justify-between gap-2 lg:flex-col lg:items-start lg:gap-0.5">
        <span className="font-mono text-[11px] text-muted">
          <span className="lg:hidden">Módulo {fila.modulo} · </span>
          {momento(fila.ultimoCambio, ahora)}
        </span>
        {espera !== null && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warn">
            <IconoReloj tamano={13} />
            {espera} días
          </span>
        )}
      </span>
      <IconoChevronDerecha tamano={18} className="hidden text-muted lg:block" />
    </Link>
  );
}

// ---- Estudiantes: una fila por estudiante, una celda por módulo --------------

const COLUMNAS_ESTUDIANTES = "lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]";
/** Docente: estudiante y, en una sola columna, sus casillas (cada una de un tercio, como en las otras oficinas). */
const COLUMNAS_DOCENTE = "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,3fr)]";

function TablaEstudiantes({ dependencia, filas, ahora }: { dependencia: Dependencia; filas: FilaEstudiante[]; ahora: Date }) {
  // El docente solo ve sus expedientes (RLS): una celda por módulo dejaría huecos
  // que no sabría leer ("¿no existe o no es mío?"). Ve solo las casillas de los suyos.
  const soloSuyos = dependencia === "docente";
  const columnas = soloSuyos ? COLUMNAS_DOCENTE : COLUMNAS_ESTUDIANTES;
  return (
    <>
      <div
        className={`hidden gap-3 border-b border-line px-5 py-3 text-[11px] font-semibold tracking-wide text-muted uppercase lg:grid ${columnas}`}
      >
        <span>Estudiante</span>
        {soloSuyos ? <span>Tus expedientes</span> : MODULOS.map((modulo) => <span key={modulo}>Módulo {modulo}</span>)}
      </div>
      <ul className="divide-y divide-line">
        {filas.map(({ estudiante, modulos }) => (
          <li key={estudiante.id} className={`flex flex-col gap-3 px-5 py-4 lg:grid lg:items-center lg:gap-3 lg:py-3 ${columnas}`}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">{estudiante.nombre}</span>
              <span className="font-mono text-[11px] text-muted">{estudiante.documento}</span>
            </span>
            {soloSuyos ? (
              <span className="grid grid-cols-3 gap-2 lg:flex lg:flex-wrap">
                {MODULOS.filter((modulo) => modulos[modulo]).map((modulo) => (
                  <CeldaModulo
                    key={modulo}
                    dependencia={dependencia}
                    modulo={modulo}
                    fila={modulos[modulo]}
                    ahora={ahora}
                    sinColumnas
                  />
                ))}
              </span>
            ) : (
              <span className="grid grid-cols-3 gap-2 lg:contents">
                {MODULOS.map((modulo) => (
                  <CeldaModulo key={modulo} dependencia={dependencia} modulo={modulo} fila={modulos[modulo]} ahora={ahora} />
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

const BORDE_CELDA = {
  observado: "border-warn-border bg-warn-bg/40",
  conforme: "border-ok/30 bg-ok-bg/40",
  normal: "border-line bg-white",
};

function CeldaModulo({
  dependencia,
  modulo,
  fila,
  ahora,
  sinColumnas = false,
}: {
  dependencia: Dependencia;
  modulo: Modulo;
  fila: FilaBandeja | null;
  ahora: Date;
  /** Fuera de las columnas "Módulo I/II/III" (docente): de un tercio del ancho y con el módulo escrito en PC. */
  sinColumnas?: boolean;
}) {
  const base = `flex min-h-14 flex-col items-stretch gap-1 rounded-xl border px-2.5 py-2 text-left lg:min-h-11 lg:flex-row lg:items-center lg:gap-2 lg:px-3 ${
    sinColumnas ? "lg:w-[calc((100%-1rem)/3)]" : ""
  }`;
  const rotulo = (
    <span className="font-mono text-[10px] font-semibold whitespace-nowrap text-muted lg:hidden">Mód. {modulo}</span>
  );

  if (!fila) {
    // (El docente no usa esta tabla: él no sabe si existen los módulos que no son suyos.)
    return (
      <span className={`${base} border-dashed border-line text-xs text-muted`}>
        {rotulo}
        <span aria-hidden="true" className="lg:hidden">
          —
        </span>
        <span className="sr-only lg:not-sr-only">Sin expediente</span>
      </span>
    );
  }

  const { tipo, etiqueta, nombre } = ESTADOS[fila.estado];
  const borde = tipo === "observacion" ? BORDE_CELDA.observado : tipo === "final" ? BORDE_CELDA.conforme : BORDE_CELDA.normal;
  // Dónde está para mostrarlo (D56): en 03 ya está en Coordinación.
  const lugar = dondeEsta(fila.estado);
  const dato = tipo === "final" ? momento(fila.ultimoCambio, ahora) : DEPENDENCIAS[lugar].nombreCorto;
  const detalle = sinColumnas ? `Mód. ${modulo} · ${dato}` : dato;
  return (
    <Link
      href={RUTAS_OFICINA.expediente(dependencia, fila.expedienteId)}
      aria-label={`Módulo ${modulo}: ${nombre}, ${UBICACION_DE[lugar]}`}
      className={`${base} hover:border-navy ${borde}`}
    >
      <span className="flex items-center justify-between gap-1 lg:contents">
        {rotulo}
        <ChipCodigo codigo={fila.estado} tono={tonoDeEstado(fila.estado)} />
      </span>
      <span className="flex min-w-0 flex-col lg:grow">
        <span className="text-xs leading-tight font-semibold lg:truncate lg:text-[13px]">{etiqueta}</span>
        <span className="hidden truncate text-[11px] text-muted lg:block">{detalle}</span>
      </span>
      <IconoChevronDerecha tamano={16} className="hidden text-muted lg:block" />
    </Link>
  );
}
