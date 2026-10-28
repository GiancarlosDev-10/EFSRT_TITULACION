import type { ReactNode } from "react";
import { Logo } from "./iconos";

type Props = {
  /** Bajo el nombre del sistema: el perfil ("Estudiante") o la oficina. */
  subtitulo: string;
  /** A la derecha: campana y "Salir". */
  children?: ReactNode;
};

/**
 * Barra superior oscura, solo en celular (en PC está la barra lateral). Es
 * `sticky`: el panel de la campana se ancla a ella, a todo el ancho.
 */
export function BarraSuperior({ subtitulo, children }: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2.5 bg-ink px-5 py-2.5 text-white lg:hidden">
      <Logo tamano={32} />
      <span className="flex min-w-0 grow flex-col">
        <span className="font-display text-sm font-extrabold">EFSRT Seguimiento</span>
        <span className="truncate text-[11px] text-on-ink-muted">{subtitulo}</span>
      </span>
      {children}
    </header>
  );
}
