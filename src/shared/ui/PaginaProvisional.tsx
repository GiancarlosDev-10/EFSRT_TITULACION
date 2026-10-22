import type { ReactNode } from "react";

type Props = {
  perfil: string;
  ruta: string;
  /** Contenido extra bajo el título (p. ej. quién ingresó). */
  children?: ReactNode;
};

/** Marcador temporal para las pantallas que aún no se construyen. */
export function PaginaProvisional({ perfil, ruta, children }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-2 px-4 py-10">
      <p className="font-mono text-sm font-medium text-muted">{ruta}</p>
      <h1 className="font-display text-3xl font-bold text-navy">{perfil}</h1>
      <p className="text-muted">Pantalla en construcción.</p>
      {children}
    </main>
  );
}
