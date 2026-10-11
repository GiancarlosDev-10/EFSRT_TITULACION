import Link from "next/link";
import { IconoVolver } from "./iconos";

type Props = {
  /** Ruta del botón para volver. */
  volverA: string;
  /** Texto accesible del botón para volver. */
  etiquetaVolver: string;
  titulo: string;
  subtitulo?: string;
};

/** Encabezado de las páginas internas: botón para volver, título y subtítulo. */
export function EncabezadoPagina({ volverA, etiquetaVolver, titulo, subtitulo }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={volverA}
        aria-label={etiquetaVolver}
        className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-line"
      >
        <IconoVolver tamano={22} />
      </Link>
      <div className="flex min-w-0 flex-col">
        <h1 className="font-display text-[22px] leading-tight font-extrabold">{titulo}</h1>
        {subtitulo && <span className="text-xs text-muted">{subtitulo}</span>}
      </div>
    </div>
  );
}
