import type { CodigoEstado } from "../domain";
import { CHIP_EVENTO } from "./estilos";
import type { TonoEvento } from "./presentacion";

/** Código de estado (01…10) en tipografía de trazabilidad. */
export function ChipCodigo({ codigo, tono }: { codigo: CodigoEstado; tono: TonoEvento }) {
  return (
    <span className={`h-fit rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${CHIP_EVENTO[tono]}`}>
      {codigo}
    </span>
  );
}
