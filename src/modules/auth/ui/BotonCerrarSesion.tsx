"use client";
// Cerrar sesión: pide confirmación en un <dialog> nativo (atrapa el foco, cierra
// con Esc) y luego envía el formulario con la Server Action.
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { IconoSalir } from "@/shared";
import { cerrarSesion } from "../acciones";

type Props = {
  /** "barra": solo ícono sobre la barra lateral oscura · "texto": ícono y texto sobre fondo claro. */
  variante?: "barra" | "texto";
};

export function BotonCerrarSesion({ variante = "texto" }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const abrir = () => dialogo.current?.showModal();
  const cerrar = () => dialogo.current?.close();

  return (
    <>
      {variante === "barra" ? (
        <button
          type="button"
          onClick={abrir}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex size-11 items-center justify-center rounded-xl text-on-ink hover:bg-ink-active hover:text-white"
        >
          <IconoSalir tamano={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={abrir}
          className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-[13px] font-semibold text-navy hover:bg-navy-tint"
        >
          <IconoSalir tamano={18} />
          Salir
        </button>
      )}

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-cerrar-sesion"
        // Clic en el fondo oscuro (fuera de la tarjeta) = cancelar.
        onClick={(evento) => evento.target === evento.currentTarget && cerrar()}
        className="m-auto w-[calc(100%-32px)] max-w-sm rounded-[18px] bg-white p-0 text-ink shadow-xl backdrop:bg-ink/50"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h2 id="titulo-cerrar-sesion" className="font-display text-lg font-bold">
              ¿Seguro que quieres salir?
            </h2>
            <p className="text-sm text-muted">Tendrás que volver a ingresar para ver tu información.</p>
          </div>
          <form action={cerrarSesion} className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrar}
              autoFocus
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-navy hover:bg-navy-tint"
            >
              Cancelar
            </button>
            <BotonConfirmar />
          </form>
        </div>
      </dialog>
    </>
  );
}

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover disabled:opacity-60"
    >
      {pending ? "Saliendo…" : "Sí, salir"}
    </button>
  );
}
