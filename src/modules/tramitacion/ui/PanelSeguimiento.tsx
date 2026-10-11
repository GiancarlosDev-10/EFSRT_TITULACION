"use client";

// Panel de PC: selector de módulo + el contenido del módulo elegido. Los
// paneles llegan ya dibujados desde el servidor; aquí solo se elige cuál mostrar.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconoChevronAbajo } from "@/shared";
import type { Modulo } from "../domain";
import { PUNTO } from "./estilos";
import { PildoraEstado } from "./PildoraEstado";
import type { TonoExpediente } from "./presentacion";

export type OpcionModulo = { modulo: Modulo; etiqueta: string; tono: TonoExpediente };

type Props = {
  opciones: OpcionModulo[];
  inicial: Modulo;
  paneles: Record<Modulo, { columna: ReactNode; mapa: ReactNode }>;
};

export function PanelSeguimiento({ opciones, inicial, paneles }: Props) {
  const [seleccionado, setSeleccionado] = useState(inicial);
  return (
    <div className="flex items-start gap-6">
      <div className="flex w-[420px] shrink-0 flex-col gap-3.5">
        <SelectorModulo opciones={opciones} seleccionado={seleccionado} alElegir={setSeleccionado} />
        {paneles[seleccionado].columna}
      </div>
      <div className="min-w-0 grow">{paneles[seleccionado].mapa}</div>
    </div>
  );
}

type PropsSelector = {
  opciones: OpcionModulo[];
  seleccionado: Modulo;
  alElegir: (modulo: Modulo) => void;
};

function SelectorModulo({ opciones, seleccionado, alElegir }: PropsSelector) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const actual = opciones.find((opcion) => opcion.modulo === seleccionado) ?? opciones[0];

  // Cierra al hacer clic fuera o con Escape (devolviendo el foco al botón).
  useEffect(() => {
    if (!abierto) return;
    const alPresionarFuera = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", alPresionarFuera);
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.removeEventListener("pointerdown", alPresionarFuera);
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-controls="opciones-modulo"
        className="flex min-h-[62px] w-full items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-2.5 text-left"
      >
        <span className={`size-2.5 shrink-0 rounded-full ${PUNTO[actual.tono]}`} />
        <span className="flex min-w-0 grow flex-col gap-px">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">Expediente</span>
          <span className="text-[15px] font-semibold">Módulo {actual.modulo}</span>
        </span>
        <PildoraEstado texto={actual.etiqueta} tono={actual.tono} />
        <IconoChevronAbajo tamano={18} className={`shrink-0 text-muted transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <ul
          id="opciones-modulo"
          aria-label="Elegir módulo"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 flex flex-col gap-0.5 rounded-2xl border border-line bg-white p-1.5 shadow-xl shadow-ink/15"
        >
          {opciones.map((opcion) => (
            <li key={opcion.modulo}>
              <button
                type="button"
                aria-pressed={opcion.modulo === seleccionado}
                onClick={() => {
                  alElegir(opcion.modulo);
                  setAbierto(false);
                  boton.current?.focus();
                }}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${
                  opcion.modulo === seleccionado ? "bg-navy-tint" : "hover:bg-bg"
                }`}
              >
                <span className={`size-2.5 shrink-0 rounded-full ${PUNTO[opcion.tono]}`} />
                <span className="grow text-sm font-semibold">Módulo {opcion.modulo}</span>
                <span className="text-[11px] font-semibold text-muted">{opcion.etiqueta}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
