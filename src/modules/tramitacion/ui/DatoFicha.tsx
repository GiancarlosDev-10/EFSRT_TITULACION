import type { ReactNode } from "react";

/**
 * Un dato de la ficha del estudiante (etiqueta arriba, valor abajo); va dentro
 * de un `<dl>`. El texto parte entre palabras; solo lo que no tiene espacios
 * (un correo) se corta donde haga falta para no desbordar.
 */
export function DatoFicha({ etiqueta, children, mono = false }: { etiqueta: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">{etiqueta}</dt>
      <dd
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-snug [overflow-wrap:anywhere] ${mono ? "font-mono text-xs" : ""}`}
      >
        {children || <span className="text-muted">—</span>}
      </dd>
    </div>
  );
}
