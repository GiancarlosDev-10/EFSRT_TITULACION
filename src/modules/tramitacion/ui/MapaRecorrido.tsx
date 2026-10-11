"use client";

// Mapa isométrico ilustrativo del recorrido (PC). Es de cliente por la
// animación "Ver recorrido"; la geometría y los colores vienen de mapa.ts.
// Los edificios se identifican con números (los mismos del tracker) y una
// lista al pie, para que ninguna etiqueta se superponga (D27).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { IconoPausa, IconoReproducir } from "@/shared";
import type { SituacionEtapa } from "../application";
import {
  ALTO,
  ANCHO,
  ARBOLES,
  CARAS_EDIFICIOS,
  COLORES_EDIFICIO,
  COLORES_ESCENA,
  IDS_EDIFICIOS,
  RECORTE_SUPERIOR,
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

const INSIGNIA: Record<EstadoEdificio | "inicio", string> = {
  pendiente: "border border-pending bg-white text-text-soft",
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

const simbolo = (id: IdEdificio) => (id === "tesoreria" ? "T" : String(id + 1));

function Pin({ relleno, tamano = 44 }: { relleno: string; tamano?: number }) {
  return (
    <svg width={(tamano * 24) / 31} height={tamano} viewBox="0 0 24 31" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 31 12 31s12-10.6 12-19.3C24 5.2 18.6 0 12 0z" className={relleno} />
      <circle cx="12" cy="11.5" r="4.6" className="fill-white" />
    </svg>
  );
}

type PropsInsignia = {
  id: IdEdificio;
  estilo: string;
  pequena?: boolean;
  className?: string;
  style?: CSSProperties;
};

function Insignia({ id, estilo, pequena = false, className = "", style }: PropsInsignia) {
  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${pequena ? "size-5 text-[10px]" : "size-6 text-[11px]"} ${estilo} ${className}`}
    >
      {simbolo(id)}
    </span>
  );
}

type Props = {
  etapas: { nombre: string; situacion: SituacionEtapa; resumen: string }[];
  tono: TonoExpediente;
  /** Etapa donde está el expediente; `null` si aún no hay expediente. */
  posicion: number | null;
};

export function MapaRecorrido({ etapas, tono, posicion }: Props) {
  const [paso, setPaso] = useState<number | null>(null);
  const [pausado, setPausado] = useState(false);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  const detener = () => {
    temporizadores.current.forEach(clearTimeout);
    temporizadores.current = [];
  };
  useEffect(() => detener, []);

  /** Recorre las etapas desde `inicio` hasta la actual y luego vuelve al reposo. */
  const reproducirDesde = (inicio: number) => {
    if (posicion === null) return;
    detener();
    setPausado(false);
    if (inicio > posicion) {
      setPaso(null);
      return;
    }
    setPaso(inicio);
    for (let i = inicio + 1; i <= posicion; i++) {
      temporizadores.current.push(setTimeout(() => setPaso(i), (i - inicio) * PASO_MS));
    }
    temporizadores.current.push(setTimeout(() => setPaso(null), (posicion - inicio + 1) * PASO_MS));
  };

  const pausar = () => {
    detener();
    setPausado(true);
  };

  // Un solo botón: Ver recorrido → Pausar → Continuar → … → Ver recorrido.
  const boton =
    paso === null
      ? { texto: "Ver recorrido", icono: <IconoReproducir />, accion: () => reproducirDesde(0) }
      : pausado
        ? { texto: "Continuar", icono: <IconoReproducir />, accion: () => reproducirDesde(paso + 1) }
        : { texto: "Pausar", icono: <IconoPausa />, accion: pausar };

  const situaciones = etapas.map((etapa) => etapa.situacion);
  const listo = tono === "listo";
  const estadoDe = (id: IdEdificio) => estadoDeEdificio(id, situaciones, posicion, listo);
  const estiloDe = (id: IdEdificio) => INSIGNIA[id === 0 && posicion === null ? "inicio" : estadoDe(id)];
  const nombreDe = (id: IdEdificio) =>
    id === "tesoreria"
      ? "Tesorería"
      : id === 0 && posicion === null
        ? `${etapas[0].nombre} · aquí empieza`
        : etapas[id].nombre;

  const marcador = paso ?? posicion;
  const colorMarcador = MARCADOR[paso !== null ? "navy" : listo ? "ok" : tono === "observado" ? "warn" : "navy"];
  // Cartel bajo el mapa: siempre dice dónde está el pin.
  const mensaje =
    paso !== null
      ? `Paso ${paso + 1} de ${etapas.length} · ${etapas[paso].nombre} · ${etapas[paso].resumen}${pausado ? " · En pausa" : ""}`
      : posicion === null
        ? "Aún no hay expediente: el recorrido empezará en Mesa de Partes cuando entregues tu carpeta."
        : `${listo ? "Recoge tu constancia en" : "Tu expediente está en"} ${etapas[posicion].nombre} · ${etapas[posicion].resumen}`;

  return (
    <section
      aria-label="Mapa del recorrido"
      className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-[18px]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="grow font-display text-[17px] font-extrabold">Mapa del recorrido</h2>
        {posicion !== null && (
          <span className="flex items-center gap-1.5 text-[11px] text-text-soft">
            <Pin relleno={colorMarcador.relleno} tamano={13} />
            Tu expediente
          </span>
        )}
        {LEYENDA.map(({ texto, color }) => (
          <span key={texto} className="flex items-center gap-1.5 text-[11px] text-text-soft">
            <span className="size-2.5 rounded-[3px]" style={{ background: color }} />
            {texto}
          </span>
        ))}
        {posicion !== null && posicion > 0 && (
          <button
            type="button"
            onClick={boton.accion}
            className="flex min-h-9 items-center gap-1.5 rounded-[10px] border border-pending bg-white px-3 text-xs font-semibold text-navy hover:bg-navy-tint"
          >
            {boton.icono}
            {boton.texto}
          </button>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-[620px]" style={{ aspectRatio: `${ANCHO} / ${ALTO}` }}>
        <svg
          viewBox={`0 ${RECORTE_SUPERIOR} ${ANCHO} ${ALTO}`}
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible"
        >
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

        {marcador !== null && (
          <div
            style={enPorcentaje(techoDe(marcador))}
            className={`absolute hidden size-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left,top] duration-900 ease-in-out motion-safe:block motion-safe:animate-pulso ${colorMarcador.fondo}`}
          />
        )}

        {/* Número de cada edificio, en el centro del techo. */}
        {IDS_EDIFICIOS.map((id) => (
          <Insignia
            key={id}
            id={id}
            estilo={estiloDe(id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 shadow-md shadow-ink/15"
            style={enPorcentaje(techoDe(id))}
          />
        ))}

        {/* El pin flota sobre el número del edificio actual. */}
        {marcador !== null && (
          <div
            style={enPorcentaje(techoDe(marcador))}
            className="absolute -translate-x-1/2 -translate-y-[calc(100%+12px)] transition-[left,top] duration-900 ease-in-out motion-safe:animate-flotar motion-reduce:transition-none"
          >
            <Pin relleno={colorMarcador.relleno} />
          </div>
        )}
      </div>

      {/* Paso de "Ver recorrido" o aviso de "sin expediente": espacio propio y
          reservado bajo el mapa, para no tapar el dibujo ni cambiar el alto. */}
      <div aria-live="polite" className="flex min-h-9 items-center justify-center">
        {mensaje && (
          <span className="rounded-xl bg-ink px-3.5 py-2 text-center text-xs font-semibold text-white">{mensaje}</span>
        )}
      </div>

      <ol aria-label="Oficinas del mapa" className="flex flex-wrap gap-x-3 gap-y-2">
        {IDS_EDIFICIOS.map((id) => (
          <li key={id} className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-text-soft">
            <Insignia id={id} estilo={estiloDe(id)} pequena />
            <span className={id === marcador ? "font-semibold text-ink" : ""}>{nombreDe(id)}</span>
          </li>
        ))}
      </ol>

      <p className="text-xs leading-normal text-muted">
        El mapa es ilustrativo: muestra en qué oficina está tu carpeta física según lo que registra cada área.
        Tesorería (T) participa en el trámite, pero no registra en el sistema.
      </p>
    </section>
  );
}
