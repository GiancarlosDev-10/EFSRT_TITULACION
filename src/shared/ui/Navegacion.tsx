"use client";

// Navegación principal: lateral en PC, inferior en celular. Es de cliente solo
// para marcar el enlace de la página actual (aria-current).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export type ItemNavegacion = {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  /** Activo solo en esa ruta exacta (p. ej. el inicio de la sección). */
  exacto?: boolean;
};

type Variante = "lateral" | "inferior";

const ESTILOS: Record<Variante, { nav: string; enlace: string; activo: string; inactivo: string }> = {
  lateral: {
    nav: "flex flex-col gap-1",
    enlace: "flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-sm",
    activo: "bg-ink-active font-semibold text-white",
    inactivo: "font-medium text-on-ink hover:bg-ink-raised",
  },
  inferior: {
    nav: "sticky bottom-0 flex border-t border-line bg-white px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom),1.25rem)]",
    enlace: "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px]",
    activo: "font-semibold text-navy",
    inactivo: "font-medium text-muted",
  },
};

function estaActivo(ruta: string | null, { href, exacto }: ItemNavegacion): boolean {
  if (ruta === null) return false;
  return exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
}

type Props = { items: ItemNavegacion[]; className?: string };

function Lista({ items, className = "", variante, ruta }: Props & { variante: Variante; ruta: string | null }) {
  const estilos = ESTILOS[variante];
  return (
    <nav aria-label="Principal" className={`${estilos.nav} ${className}`}>
      {items.map((item) => {
        const activo = estaActivo(ruta, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`${estilos.enlace} ${activo ? estilos.activo : estilos.inactivo}`}
          >
            {item.icono}
            {item.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}

function ListaConRuta(props: Props & { variante: Variante }) {
  return <Lista {...props} ruta={usePathname()} />;
}

// En rutas con parámetros dinámicos la ruta solo se conoce al recibir la
// petición; mientras tanto se muestra la misma lista sin enlace activo.
function Navegacion(props: Props & { variante: Variante }) {
  return (
    <Suspense fallback={<Lista {...props} ruta={null} />}>
      <ListaConRuta {...props} />
    </Suspense>
  );
}

export function NavegacionLateral(props: Props) {
  return <Navegacion {...props} variante="lateral" />;
}

export function NavegacionInferior(props: Props) {
  return <Navegacion {...props} variante="inferior" />;
}
