import { PILDORA_SOBRE_OSCURO } from "./estilos";
import type { Ubicacion } from "./presentacion";

/** Tarjeta oscura "Tu expediente está en…". */
export function TarjetaUbicacion({ ubicacion }: { ubicacion: Ubicacion }) {
  const { rotulo, lugar, pildora, desde, tono } = ubicacion;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-ink p-5 text-white">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-on-ink-muted uppercase">{rotulo}</span>
      <span className="font-display text-2xl leading-tight font-extrabold">{lugar}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={`rounded-full px-[11px] py-[5px] text-xs font-semibold ${PILDORA_SOBRE_OSCURO[tono]}`}>
          {pildora}
        </span>
        <span className="text-xs text-on-ink">{desde}</span>
      </div>
    </div>
  );
}
