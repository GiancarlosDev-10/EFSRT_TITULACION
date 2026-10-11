"use client";

// Barra lateral oscura de PC, colapsable a solo íconos. La preferencia se
// guarda en el navegador. Los hijos se adaptan con la variante
// `group-data-[contraida=true]/barra:` (p. ej. ocultando textos con sr-only).
import { useSyncExternalStore, type ReactNode } from "react";
import { IconoChevronDerecha, Logo } from "./iconos";

const CLAVE = "efsrt:barra-contraida";
const EVENTO = "efsrt:barra-contraida";

function leerPreferencia(): boolean {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

function guardarPreferencia(contraida: boolean) {
  try {
    localStorage.setItem(CLAVE, contraida ? "1" : "0");
  } catch {
    // Sin almacenamiento (modo privado): la preferencia dura solo esta visita.
  }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

type Props = {
  /** Navegación principal. */
  children: ReactNode;
  /** Contenido al pie (p. ej. la tarjeta del usuario). */
  pie?: ReactNode;
};

export function BarraLateral({ children, pie }: Props) {
  // En el servidor siempre se dibuja abierta; en el navegador se aplica la preferencia.
  const contraida = useSyncExternalStore(suscribir, leerPreferencia, () => false);

  return (
    <aside
      data-contraida={contraida}
      className={`group/barra sticky top-0 hidden h-dvh shrink-0 flex-col gap-7 bg-ink py-7 text-white transition-[width] duration-200 lg:flex ${
        contraida ? "w-[84px] px-3" : "w-[300px] px-[18px]"
      }`}
    >
      <div className="flex items-center gap-2.5 px-2 group-data-[contraida=true]/barra:justify-center group-data-[contraida=true]/barra:px-0">
        <Logo />
        <div className="flex flex-col gap-px whitespace-nowrap group-data-[contraida=true]/barra:sr-only">
          <span className="font-display text-base font-extrabold">EFSRT Seguimiento</span>
          <span className="text-[11px] text-on-ink-muted">IESTP Gilda L. Ballivián Rosado</span>
        </div>
      </div>

      {/* Botón sobre el borde derecho, a la altura del logo. Se ve como un círculo
          de 28 px, pero el área clicable es de 44 px (accesibilidad). */}
      <button
        type="button"
        onClick={() => guardarPreferencia(!contraida)}
        aria-expanded={!contraida}
        aria-label={contraida ? "Expandir menú" : "Contraer menú"}
        title={contraida ? "Expandir menú" : "Contraer menú"}
        className="group/boton absolute top-[34px] -right-[22px] z-10 flex size-11 items-center justify-center"
      >
        <span className="flex size-7 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md shadow-ink/20 group-hover/boton:bg-navy-tint">
          <IconoChevronDerecha
            tamano={16}
            className="rotate-180 transition-transform group-data-[contraida=true]/barra:rotate-0"
          />
        </span>
      </button>

      {children}

      {pie && <div className="mt-auto">{pie}</div>}
    </aside>
  );
}
