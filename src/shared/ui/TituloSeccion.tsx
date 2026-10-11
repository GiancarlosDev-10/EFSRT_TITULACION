import type { ReactNode } from "react";

/**
 * Título de una sección de tarjetas. El `px-1` compensa ópticamente las esquinas
 * redondeadas de las tarjetas, para que título y contenido se vean alineados.
 */
export function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="px-1 font-display text-[17px] font-extrabold">{children}</h2>;
}
