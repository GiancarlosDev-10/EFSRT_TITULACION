// Piezas comunes de los formularios de las oficinas: el error bajo un campo y
// el aviso cuando el servidor no pudo registrar (con "Recargar" si hubo conflicto).
import { IconoAlerta } from "@/shared";

export function MensajeError({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <span id={id} className="flex items-center gap-1 text-xs font-semibold text-warn">
      <IconoAlerta tamano={13} className="shrink-0" />
      {texto}
    </span>
  );
}

export function AlertaServidor({ error, conflicto }: { error: string | null; conflicto: boolean }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warn-border bg-warn-bg p-3.5 text-warn-text">
      <IconoAlerta tamano={18} className="mt-0.5 shrink-0 text-warn" />
      <div className="flex flex-col gap-1.5 text-[13px] leading-normal">
        <span>{error}</span>
        {conflicto && (
          // Enlace normal: recarga la página con el estado actual.
          <a href="" className="w-fit font-semibold text-navy underline">
            Recargar
          </a>
        )}
      </div>
    </div>
  );
}
