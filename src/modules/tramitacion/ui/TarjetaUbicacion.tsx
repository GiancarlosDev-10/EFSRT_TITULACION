import Link from "next/link";
import { IconoAlerta, IconoChevronDerecha } from "@/shared";
import type { SituacionEtapa } from "../application";
import { PILDORA_SOBRE_OSCURO } from "./estilos";
import type { AvisoObservacion, PasoRecorrido, Ubicacion } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

const PUNTO_PASO: Record<SituacionEtapa, string> = {
  completada: "bg-ok-bright",
  actual: "bg-on-ink",
  observada: "bg-warn-bright ring-4 ring-warn-bright/30",
  pendiente: "border-2 border-on-ink-muted/60",
};

/** Mini barra de cuatro pasos sobre la tarjeta oscura (celular). */
function PasosRecorrido({ pasos }: { pasos: PasoRecorrido[] }) {
  return (
    <ol aria-label="Recorrido" className="flex items-start">
      {pasos.map((paso, i) => {
        const siguiente = pasos[i + 1];
        const tramoRecorrido = paso.situacion === "completada" && siguiente?.situacion !== "pendiente";
        return (
          <li key={paso.nombre} className="relative flex flex-1 flex-col items-center gap-1.5">
            {siguiente && (
              <span
                aria-hidden="true"
                className={`absolute top-[9px] left-1/2 h-0.5 w-full ${tramoRecorrido ? "bg-ok-bright" : "bg-ink-line"}`}
              />
            )}
            <span className={`relative size-5 rounded-full ${PUNTO_PASO[paso.situacion]}`} />
            <span
              className={`text-center text-[10px] leading-tight ${paso.actual ? "font-semibold text-white" : "text-on-ink-muted"}`}
            >
              {paso.nombre}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Props = {
  ubicacion: Ubicacion;
  /** La observación vigente del módulo se muestra dentro de la tarjeta (D28). */
  aviso?: AvisoObservacion;
  /** Mini barra de pasos (página de seguimiento en celular). */
  pasos?: PasoRecorrido[];
};

/** Tarjeta oscura "Tu expediente está en…". */
export function TarjetaUbicacion({ ubicacion, aviso, pasos }: Props) {
  const { rotulo, lugar, pildora, desde, tono } = ubicacion;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-ink p-5 text-white">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-on-ink-muted uppercase">{rotulo}</span>
      <span className="font-display text-[22px] leading-tight font-extrabold">{lugar}</span>
      <div className="flex flex-col items-start gap-2">
        <span className={`rounded-full px-[11px] py-[5px] text-xs font-semibold ${PILDORA_SOBRE_OSCURO[tono]}`}>
          {pildora}
        </span>
        <span className="text-xs text-on-ink">{desde}</span>
      </div>

      {pasos && <PasosRecorrido pasos={pasos} />}

      {aviso && (
        <Link
          href={RUTAS_ALUMNO.observacion(aviso.expedienteId)}
          className="mt-1 flex flex-col gap-2.5 rounded-2xl bg-warn-soft p-3.5 text-warn-on-soft hover:bg-warn-bg"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
            <IconoAlerta tamano={14} className="shrink-0" />
            Tienes una observación
          </span>
          <blockquote className="font-display text-[15px] leading-snug font-extrabold text-warn-deep">
            “{aviso.motivo}”
          </blockquote>
          {/* A quién entregar y desde cuándo: un solo grupo. */}
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold">{aviso.entrega}</span>
            <span className="font-mono text-[11px] text-warn-text">{aviso.observado}</span>
          </span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-warn-deep">
            Ver qué tengo que hacer <IconoChevronDerecha tamano={16} />
          </span>
        </Link>
      )}
    </div>
  );
}
