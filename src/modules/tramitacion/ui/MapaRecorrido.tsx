"use client";

// Mapa isométrico ilustrativo del recorrido (PC). Es de cliente por la
// animación "Ver recorrido"; la geometría y los colores vienen de mapa.ts.
import { useEffect, useRef, useState } from "react";
import { IconoReproducir } from "@/shared";
import type { SituacionEtapa } from "../application";
import {
  ALTO,
  ANCHO,
  ARBOLES,
  CARAS_EDIFICIOS,
  COLORES_EDIFICIO,
  COLORES_ESCENA,
  IDS_EDIFICIOS,
  SUELO,
  enPorcentaje,
  estadoDeEdificio,
  techoDe,
  tramos,
  type EstadoEdificio,
  type IdEdificio,
} from "./mapa";
import type { TonoExpediente } from "./presentacion";

const PASO_MS = 1100;

const ETIQUETA: Record<EstadoEdificio | "inicio", string> = {
  pendiente: "border border-line bg-white text-text-soft",
  actual: "border border-navy bg-navy text-white",
  conforme: "border border-ok-soft bg-white text-ok",
  observado: "border border-warn bg-warn text-white",
  listo: "border border-ok bg-ok text-white",
  externo: "border border-dashed border-pending bg-bg text-muted",
  inicio: "border border-navy bg-navy text-white",
};

// Clases completas: Tailwind no detecta nombres armados con plantillas (`bg-${color}`).
const MARCADOR = {
  navy: { fondo: "bg-navy", relleno: "fill-navy" },
  ok: { fondo: "bg-ok", relleno: "fill-ok" },
  warn: { fondo: "bg-warn", relleno: "fill-warn" },
};

const LEYENDA = [
  { texto: "Conforme", color: COLORES_EDIFICIO.conforme.derecha },
  { texto: "Observado", color: COLORES_EDIFICIO.observado.derecha },
  { texto: "Pendiente", color: COLORES_EDIFICIO.pendiente.derecha },
];

type Props = {
  etapas: { nombre: string; situacion: SituacionEtapa; resumen: string }[];
  tono: TonoExpediente;
  /** Etapa donde está el expediente; `null` si aún no hay expediente. */
  posicion: number | null;
};

export function MapaRecorrido({ etapas, tono, posicion }: Props) {
  const [paso, setPaso] = useState<number | null>(null);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  const detener = () => {
    temporizadores.current.forEach(clearTimeout);
    temporizadores.current = [];
  };
  useEffect(() => detener, []);

  const verRecorrido = () => {
    if (posicion === null) return;
    detener();
    setPaso(0);
    for (let i = 1; i <= posicion; i++) {
      temporizadores.current.push(setTimeout(() => setPaso(i), i * PASO_MS));
    }
    temporizadores.current.push(setTimeout(() => setPaso(null), (posicion + 1) * PASO_MS));
  };

  const situaciones = etapas.map((etapa) => etapa.situacion);
  const listo = tono === "listo";
  const estadoDe = (id: IdEdificio) => estadoDeEdificio(id, situaciones, posicion, listo);
  const marcador = paso ?? posicion;
  const animando = paso !== null;

  const colorMarcador = MARCADOR[animando ? "navy" : listo ? "ok" : tono === "observado" ? "warn" : "navy"];
  const textoMarcador =
    marcador === null
      ? ""
      : animando
        ? `Paso ${marcador + 1} · ${etapas[marcador].resumen}`
        : listo
          ? "Recoge aquí tu constancia"
          : "Tu expediente está aquí";

  return (
    <section
      aria-label="Mapa del recorrido"
      className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-[18px]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="grow font-display text-[17px] font-extrabold">Mapa del recorrido</h2>
        {LEYENDA.map(({ texto, color }) => (
          <span key={texto} className="flex items-center gap-1.5 text-[11px] text-text-soft">
            <span className="size-2.5 rounded-[3px]" style={{ background: color }} />
            {texto}
          </span>
        ))}
        {posicion !== null && posicion > 0 && (
          <button
            type="button"
            onClick={verRecorrido}
            className="flex min-h-9 items-center gap-1.5 rounded-[10px] border border-pending bg-white px-3 text-xs font-semibold text-navy hover:bg-navy-tint"
          >
            <IconoReproducir />
            Ver recorrido
          </button>
        )}
      </div>

      <div className="relative mx-auto aspect-[620/500] w-full max-w-[620px]">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} aria-hidden="true" className="absolute inset-0 size-full">
          <polygon points={SUELO.frente} style={{ fill: COLORES_ESCENA.sueloFrente }} />
          <polygon points={SUELO.derecha} style={{ fill: COLORES_ESCENA.sueloDerecha }} />
          <polygon points={SUELO.techo} style={{ fill: COLORES_ESCENA.sueloTecho, stroke: COLORES_ESCENA.sueloBorde }} />
          <polygon points={SUELO.plaza} style={{ fill: COLORES_ESCENA.plaza }} />

          {tramos(situaciones).map((tramo, i) => (
            <polyline
              key={i}
              points={tramo.puntos}
              fill="none"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={tramo.recorrido ? undefined : "2 10"}
              style={{ stroke: tramo.recorrido ? COLORES_ESCENA.caminoCompletado : COLORES_ESCENA.caminoPendiente }}
            />
          ))}

          {ARBOLES.map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 1.5} y={y - 14} width={3} height={14} rx={1.5} style={{ fill: COLORES_ESCENA.tronco }} />
              <circle cx={x} cy={y - 20} r={10} style={{ fill: COLORES_ESCENA.copa }} />
            </g>
          ))}

          {CARAS_EDIFICIOS.map((caras) => {
            const colores = COLORES_EDIFICIO[estadoDe(caras.id)];
            const borde = { stroke: "color-mix(in oklab, var(--color-ink) 18%, transparent)", strokeWidth: 1 };
            return (
              <g key={caras.id}>
                <polygon points={caras.izquierda} style={{ fill: colores.izquierda, ...borde }} />
                <polygon points={caras.derecha} style={{ fill: colores.derecha, ...borde }} />
                <polygon points={caras.techo} style={{ fill: colores.techo, ...borde }} />
                <polygon points={caras.ventanaIzquierda} style={{ fill: colores.ventana }} />
                <polygon points={caras.ventanaDerecha} style={{ fill: colores.ventana }} />
                <polygon points={caras.puerta} style={{ fill: colores.puerta }} />
              </g>
            );
          })}
        </svg>

        {/* Etiquetas sobre los techos; el edificio con el marcador no lleva etiqueta. */}
        {IDS_EDIFICIOS.filter((id) => id !== marcador).map((id) => {
          const inicio = id === 0 && posicion === null;
          const nombre =
            id === "tesoreria"
              ? "Tesorería · fuera del sistema"
              : inicio
                ? `${etapas[0].nombre} · aquí empieza`
                : etapas[id].nombre;
          return (
            <div
              key={id}
              style={enPorcentaje(techoDe(id, 0.15))}
              className={`absolute -translate-x-1/2 -translate-y-[calc(100%+4px)] rounded-[10px] px-2.5 py-[5px] text-[11px] font-semibold whitespace-nowrap shadow-md shadow-ink/10 ${ETIQUETA[inicio ? "inicio" : estadoDe(id)]}`}
            >
              {nombre}
            </div>
          );
        })}

        {marcador !== null && (
          <>
            <div
              style={enPorcentaje(techoDe(marcador))}
              className={`absolute hidden size-[26px] rounded-full transition-[left,top] duration-900 ease-in-out motion-safe:block motion-safe:animate-pulso ${colorMarcador.fondo}`}
            />
            <div
              style={enPorcentaje(techoDe(marcador))}
              className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1 transition-[left,top] duration-900 ease-in-out motion-safe:animate-flotar motion-reduce:transition-none"
            >
              <span
                aria-live="polite"
                className="flex flex-col items-center gap-px rounded-xl bg-ink px-3.5 py-[7px] whitespace-nowrap text-white shadow-lg shadow-ink/25"
              >
                <span className="text-[13px] font-semibold">{etapas[marcador].nombre}</span>
                <span className="text-[11px] text-on-ink">{textoMarcador}</span>
              </span>
              <svg width="34" height="44" viewBox="0 0 24 31" aria-hidden="true">
                <path
                  d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 31 12 31s12-10.6 12-19.3C24 5.2 18.6 0 12 0z"
                  className={colorMarcador.relleno}
                />
                <circle cx="12" cy="11.5" r="4.6" className="fill-white" />
              </svg>
            </div>
          </>
        )}

        {posicion === null && (
          <div className="absolute top-[18px] left-1/2 max-w-[380px] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-center text-[13px] leading-snug text-white">
            Aún no hay expediente. El recorrido empezará en <b>Mesa de Partes</b> cuando entregues tu carpeta.
          </div>
        )}
      </div>

      <p className="text-xs leading-normal text-muted">
        El mapa es ilustrativo: muestra en qué oficina está tu carpeta física según lo que registra cada área.
      </p>
    </section>
  );
}
