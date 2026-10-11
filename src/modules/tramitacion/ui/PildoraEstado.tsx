import { PILDORA } from "./estilos";
import type { TonoExpediente } from "./presentacion";

export function PildoraEstado({ texto, tono }: { texto: string; tono: TonoExpediente }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${PILDORA[tono]}`}>
      {texto}
    </span>
  );
}
