import type { ReactNode } from "react";
import { Avatar } from "./Avatar";

type Props = {
  nombre: string;
  correo: string;
  /** Texto bajo el saludo en PC. */
  subtitulo: string;
  /** Botón a la derecha, solo en celular (en PC va en la barra lateral). */
  accionMovil?: ReactNode;
};

/** "Hola, Giancarlos": en celular con avatar y correo; en PC con un subtítulo. */
export function Saludo({ nombre, correo, subtitulo, accionMovil }: Props) {
  const [primerNombre] = nombre.split(" ");
  return (
    <header className="flex items-center gap-3">
      <Avatar nombre={nombre} className="size-11 text-[15px] lg:hidden" />
      <div className="flex min-w-0 grow flex-col gap-px lg:gap-0.5">
        <h1 className="font-display text-xl font-extrabold lg:text-[26px]">Hola, {primerNombre}</h1>
        <span className="truncate font-mono text-[11px] text-muted lg:hidden">{correo}</span>
        <span className="hidden text-[13px] text-muted lg:block">{subtitulo}</span>
      </div>
      {accionMovil && <div className="shrink-0 lg:hidden">{accionMovil}</div>}
    </header>
  );
}
