import type { ReactNode } from "react";

const ANCHO = {
  /** Columna de lectura, centrada (páginas informativas). */
  lectura: "max-w-lg lg:max-w-2xl",
  /** Columna centrada en celular; más ancha en PC para dos columnas. */
  amplio: "max-w-lg lg:max-w-5xl",
  /** Como `amplio`, con más espacio en PC (detalle de un expediente en las oficinas). */
  extenso: "max-w-lg lg:max-w-6xl",
  /** Sin límite: el contenido decide su ancho (p. ej. el panel de PC). */
  completo: "",
};

type Props = { children: ReactNode; ancho?: keyof typeof ANCHO };

/** Contenedor de las páginas (estudiante y oficinas). */
export function MarcoPagina({ children, ancho = "lectura" }: Props) {
  return (
    <main className="px-5 pt-5 pb-6 lg:px-10 lg:pt-8 lg:pb-8">
      <div className={`mx-auto flex w-full flex-col gap-4 lg:gap-6 ${ANCHO[ancho]}`}>{children}</div>
    </main>
  );
}
