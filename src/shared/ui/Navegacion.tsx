"use client";

// Navegación principal: lateral en PC, inferior en celular. Es de cliente solo
// para marcar el enlace de la página actual (aria-current).
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

/** Opción anidada bajo un ítem (solo en la navegación lateral). */
export type SubitemNavegacion = {
  /** Puede llevar parámetros, p. ej. "/alumno?modulo=II". */
  href: string;
  /** Nombre para el tooltip y los lectores de pantalla. */
  etiqueta: string;
  contenido: ReactNode;
  /** Activo cuando la URL no trae parámetros (la opción por defecto). */
  predeterminado?: boolean;
};

export type ItemNavegacion = {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  /** Activo solo en esa ruta exacta (p. ej. el inicio de la sección). */
  exacto?: boolean;
  subitems?: SubitemNavegacion[];
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

/** Ruta y parámetros actuales; `null` mientras no se conocen. */
type Ubicacion = { ruta: string; busqueda: string } | null;

function estaActivo(ubicacion: Ubicacion, { href, exacto }: ItemNavegacion): boolean {
  if (!ubicacion) return false;
  const { ruta } = ubicacion;
  return exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
}

function subitemActivo(ubicacion: Ubicacion, { href, predeterminado }: SubitemNavegacion): boolean {
  if (!ubicacion) return false;
  const [ruta, busqueda = ""] = href.split("?");
  if (ubicacion.ruta !== ruta) return false;
  return ubicacion.busqueda === busqueda || (ubicacion.busqueda === "" && predeterminado === true);
}

type Props = { items: ItemNavegacion[]; className?: string };

function Lista({ items, className = "", variante, ubicacion }: Props & { variante: Variante; ubicacion: Ubicacion }) {
  const estilos = ESTILOS[variante];
  return (
    <nav aria-label="Principal" className={`${estilos.nav} ${className}`}>
      {items.map((item) => {
        const activo = estaActivo(ubicacion, item);
        return (
          <div key={item.href} className={estilos.item}>
            <Link
              href={item.href}
              aria-current={activo ? "page" : undefined}
              title={item.etiqueta}
              className={`${estilos.enlace} ${activo ? estilos.activo : estilos.inactivo}`}
            >
              {item.icono}
              <span className={estilos.texto}>{item.etiqueta}</span>
            </Link>
            {variante === "lateral" &&
              item.subitems?.map((subitem) => {
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
              })}
          </div>
        );
      })}
    </nav>
  );
}

function ListaConUbicacion(props: Props & { variante: Variante }) {
  const ruta = usePathname();
  const busqueda = useSearchParams().toString();
  return <Lista {...props} ubicacion={{ ruta, busqueda }} />;
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
