import Link from "next/link";
import { IconoAlerta, IconoChevronDerecha } from "@/shared";
import type { AvisoObservacion as DatosAviso } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

/** Aviso de una observación vigente (D22): el motivo de la oficina va primero. */
export function AvisoObservacion({ aviso }: { aviso: DatosAviso }) {
  return (
    <Link
      href={RUTAS_ALUMNO.observacion(aviso.expedienteId)}
      className="flex flex-col gap-2 rounded-[20px] border border-warn-border bg-warn-bg p-4 text-warn-on-soft hover:border-warn-bright lg:flex-row lg:items-center lg:gap-4 lg:rounded-2xl lg:px-[18px] lg:py-3.5"
    >
      <div className="flex grow flex-col gap-2 lg:gap-1">
        <div className="flex items-center gap-2">
          <IconoAlerta tamano={18} className="shrink-0" />
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase">
            Tienes una observación · Módulo {aviso.modulo}
          </span>
        </div>
        <blockquote className="font-display text-lg leading-snug font-extrabold text-warn-deep lg:text-base">
          “{aviso.motivo}”
        </blockquote>
        <span className="text-[13px] font-semibold">{aviso.entrega}</span>
        <span className="font-mono text-[11px] text-warn-text">{aviso.observado}</span>
      </div>
      <span className="flex items-center gap-1 text-[13px] font-semibold whitespace-nowrap text-warn-deep">
        Ver qué tengo que hacer <IconoChevronDerecha tamano={16} />
      </span>
    </Link>
  );
}
