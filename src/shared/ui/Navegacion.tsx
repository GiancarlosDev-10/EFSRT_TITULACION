"use client";

// Navegación principal: lateral en PC, inferior en celular. Es de cliente solo
// para marcar el enlace de la página actual (aria-current).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { IconoChevronAbajo as IconoChevron } from "./iconos";

/** Opción anidada bajo un ítem (solo en la navegación lateral). */
export type SubitemNavegacion = {
  href: string;
  /** Nombre para el tooltip y los lectores de pantalla. */
  etiqueta: string;
  contenido: ReactNode;
  /** Rutas donde esta opción se muestra activa por defecto (p. ej. el inicio). */
  predeterminadoEn?: readonly string[];
};

export type ItemNavegacion = {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  /** Activo solo en esa ruta exacta (p. ej. el inicio de la sección). */
  exacto?: boolean;
  subitems?: SubitemNavegacion[];
  /** Los sub-ítems se pliegan; se abre solo si alguno está activo (solo navegación lateral). */
  desplegable?: boolean;
};

type Variante = "lateral" | "inferior";

type Estilos = { nav: string; item: string; enlace: string; texto: string; activo: string; inactivo: string };

// La variante lateral se adapta a la barra contraída (ver BarraLateral).
const ESTILOS: Record<Variante, Estilos> = {
  lateral: {
    nav: "flex flex-col gap-1",
    item: "flex flex-col gap-0.5",
    enlace:
      "flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-sm group-data-[contraida=true]/barra:justify-center group-data-[contraida=true]/barra:px-0",
    texto: "whitespace-nowrap group-data-[contraida=true]/barra:sr-only",
    activo: "bg-ink-active font-semibold text-white",
    inactivo: "font-medium text-on-ink hover:bg-ink-raised",
  },
  inferior: {
    nav: "sticky bottom-0 flex justify-center border-t border-line bg-white px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom),1.25rem)]",
    item: "flex max-w-40 flex-1",
    enlace: "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px]",
    texto: "",
    activo: "font-semibold text-navy",
    inactivo: "font-medium text-muted",
  },
};

/** Ruta actual; `null` mientras no se conoce. */
type Ubicacion = string | null;

function subitemActivo(ruta: Ubicacion, { href, predeterminadoEn = [] }: SubitemNavegacion): boolean {
  return ruta !== null && (ruta === href || predeterminadoEn.includes(ruta));
}

/** Un ítem está activo en su ruta (o bajo ella, si no es exacto) o si lo está alguno de sus sub-ítems. */
function estaActivo(ruta: Ubicacion, { href, exacto, subitems = [] }: ItemNavegacion): boolean {
  if (ruta === null) return false;
  const propio = exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
  return propio || subitems.some((subitem) => subitemActivo(ruta, subitem));
}

type Props = { items: ItemNavegacion[]; className?: string };

function Lista({ items, className = "", variante, ubicacion }: Props & { variante: Variante; ubicacion: Ubicacion }) {
  const estilos = ESTILOS[variante];
  return (
    <nav aria-label="Principal" className={`${estilos.nav} ${className}`}>
      {items.map((item) => {
        const activo = estaActivo(ubicacion, item);
        const contenido = (
          <>
            {item.icono}
            <span className={estilos.texto}>{item.etiqueta}</span>
          </>
        );
        const subitems = variante === "lateral" && (item.subitems ?? []).map((subitem) => {
          const subactivo = subitemActivo(ubicacion, subitem);
          return (
            <Link
              key={subitem.href}
              href={subitem.href}
              aria-current={subactivo ? "page" : undefined}
              title={subitem.etiqueta}
              className={`ml-6 flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-[13px] group-data-[contraida=true]/barra:ml-0 group-data-[contraida=true]/barra:justify-center group-data-[contraida=true]/barra:px-0 ${
                subactivo ? "bg-ink-raised font-semibold text-white" : "text-on-ink hover:bg-ink-raised"
              }`}
            >
              {subitem.contenido}
            </Link>
          );
        });

        // Desplegable: el ítem es un botón que pliega sus sub-ítems (<details> nativo).
        if (variante === "lateral" && item.desplegable) {
          return (
            <details key={item.href} open={activo} className={`group/desplegable ${estilos.item}`}>
              <summary
                title={item.etiqueta}
                className={`${estilos.enlace} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${activo ? estilos.activo : estilos.inactivo}`}
              >
                {contenido}
                <IconoChevron className="ml-auto shrink-0 transition-transform group-open/desplegable:rotate-180 group-data-[contraida=true]/barra:hidden" />
              </summary>
              <div className="mt-0.5 flex flex-col gap-0.5">{subitems}</div>
            </details>
          );
        }

        return (
          <div key={item.href} className={estilos.item}>
            <Link
              href={item.href}
              aria-current={activo ? "page" : undefined}
              title={item.etiqueta}
              className={`${estilos.enlace} ${activo ? estilos.activo : estilos.inactivo}`}
            >
              {contenido}
            </Link>
            {subitems}
          </div>
        );
      })}
    </nav>
  );
}

function ListaConUbicacion(props: Props & { variante: Variante }) {
  return <Lista {...props} ubicacion={usePathname()} />;
}

// En rutas con parámetros dinámicos la ubicación solo se conoce al recibir la
// petición; mientras tanto se muestra la misma lista sin enlace activo.
function Navegacion(props: Props & { variante: Variante }) {
  return (
    <Suspense fallback={<Lista {...props} ubicacion={null} />}>
      <ListaConUbicacion {...props} />
    </Suspense>
  );
}

export function NavegacionLateral(props: Props) {
  return <Navegacion {...props} variante="lateral" />;
}

export function NavegacionInferior(props: Props) {
  return <Navegacion {...props} variante="inferior" />;
}
