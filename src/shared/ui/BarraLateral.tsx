import type { ReactNode } from "react";
import { Logo } from "./iconos";

type Props = {
  /** Navegación principal. */
  children: ReactNode;
  /** Contenido al pie (p. ej. la tarjeta del usuario). */
  pie?: ReactNode;
};

/** Barra lateral oscura de PC. En celular no se muestra. */
export function BarraLateral({ children, pie }: Props) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col gap-7 bg-ink px-[18px] py-7 text-white lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <Logo />
        <div className="flex flex-col gap-px">
          <span className="font-display text-base font-extrabold">EFSRT Seguimiento</span>
          <span className="text-[11px] text-on-ink-muted">IESTP Gilda L. Ballivián Rosado</span>
        </div>
      </div>
      {children}
      {pie && <div className="mt-auto">{pie}</div>}
    </aside>
  );
}
