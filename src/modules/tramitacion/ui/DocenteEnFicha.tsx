"use client";

// Docente Supervisor en la ficha, con "Cambiar" para Coordinación (D53): el
// formulario se abre en un <dialog> nativo (atrapa el foco, cierra con Esc y
// devuelve el foco al botón), como la confirmación de cerrar sesión. El estado
// del expediente no cambia; el cambio queda en el historial. Como en
// PanelAccion, los botones no se desactivan: al pulsar se marca lo que falta.
// La Server Action vuelve a validar todo (capa 2) y la base, otra vez (capa 3).
import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { IconoAlerta, IconoCambiar } from "@/shared";
import { LONGITUD_MAXIMA_MOTIVO, type DocenteAsignado } from "../domain";
import { AlertaServidor, MensajeError } from "./avisos-formulario";
import type { DocenteParaElegir, EstadoPanelAccion } from "./PanelAccion";

type Props = {
  expedienteId: string;
  /** Docente vigente que se ve en pantalla: el servidor lo compara con el actual (conflicto). */
  docente: DocenteAsignado;
  desactivado: boolean;
  /** Docentes activos; el vigente se quita de la lista. */
  docentes: DocenteParaElegir[];
  accion: (estado: EstadoPanelAccion, datos: FormData) => Promise<EstadoPanelAccion>;
};

type Errores = Partial<Record<"docente" | "motivo", string>>;

const INICIAL: EstadoPanelAccion = { error: null, conflicto: false };

export function DocenteEnFicha({ expedienteId, docente, desactivado, docentes, accion }: Props) {
  const [respuesta, enviar, enviando] = useActionState(accion, INICIAL);
  const [nuevo, setNuevo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  // El error del servidor es del último envío: al volver a abrir, no se muestra.
  const [verRespuesta, setVerRespuesta] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const campoDocente = useRef<HTMLSelectElement>(null);
  const campoMotivo = useRef<HTMLTextAreaElement>(null);

  const opciones = docentes.filter((d) => d.id !== docente.id);

  const abrir = () => dialogo.current?.showModal();
  const cerrar = () => dialogo.current?.close();

  // También al cerrar con Esc: el formulario vuelve a empezar de cero.
  function alCerrar() {
    setNuevo("");
    setMotivo("");
    setErrores({});
    setVerRespuesta(false);
  }

  function validar(evento: FormEvent<HTMLFormElement>) {
    // Se envía a mano: con `action={…}`, React vacía el formulario tras cada
    // envío y, si el servidor rechaza, la lista quedaría en blanco mientras el
    // estado aún recuerda al docente elegido.
    evento.preventDefault();
    const nuevos: Errores = {};
    if (!nuevo) nuevos.docente = "Elige al nuevo docente.";
    if (!motivo.trim()) nuevos.motivo = "Escribe por qué cambias al docente.";
    setErrores(nuevos);
    if (nuevos.docente || nuevos.motivo) {
      (nuevos.docente ? campoDocente : campoMotivo).current?.focus();
      return;
    }
    setVerRespuesta(true);
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <>
      {docente.nombre}
      {desactivado && (
        <span className="inline-flex items-center gap-1 rounded-md bg-warn-bg px-1.5 py-0.5 text-[11px] font-semibold text-warn-text">
          <IconoAlerta tamano={13} />
          Desactivado
        </span>
      )}
      {/* Se ve de 28 px para no empujar el nombre; el `before` invisible lleva el área táctil a 44 px. */}
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        className="relative inline-flex h-7 items-center gap-1 rounded-lg border border-navy/15 bg-navy-tint px-2.5 text-xs font-semibold text-navy before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] hover:border-navy hover:bg-navy hover:text-white"
      >
        <IconoCambiar tamano={14} />
        Cambiar
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-cambio-docente"
        onClose={alCerrar}
        // Clic en el fondo oscuro (fuera de la tarjeta) = cancelar.
        onClick={(evento) => evento.target === evento.currentTarget && cerrar()}
        className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-lg overflow-y-auto rounded-[18px] bg-white p-0 font-normal break-normal text-ink shadow-xl backdrop:bg-ink/50"
      >
        <form onSubmit={validar} noValidate className="flex flex-col gap-4 p-6">
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <input type="hidden" name="docenteAnteriorId" value={docente.id} />

          <div className="flex flex-col gap-1">
            <h2 id="titulo-cambio-docente" className="font-display text-lg font-bold">
              Cambiar Docente Supervisor
            </h2>
            <p className="text-sm leading-normal text-muted">
              Por ejemplo, si el docente renunció. El estado del expediente no cambia; el cambio queda en el historial.
            </p>
          </div>

          <div className="flex flex-col gap-0.5 rounded-xl bg-bg px-3.5 py-2.5">
            <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">Docente actual</span>
            <span className="text-sm font-semibold">{docente.nombre}</span>
          </div>

          {verRespuesta && <AlertaServidor {...respuesta} />}

          <label htmlFor="nuevo-docente" className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Nuevo Docente Supervisor</span>
            <select
              ref={campoDocente}
              id="nuevo-docente"
              name="docenteId"
              value={nuevo}
              onChange={(evento) => setNuevo(evento.target.value)}
              aria-invalid={errores.docente ? true : undefined}
              aria-describedby={errores.docente ? "error-nuevo-docente" : undefined}
              className={`min-h-11 rounded-xl border bg-white px-3 text-sm focus:border-navy ${errores.docente ? "border-warn" : "border-line"}`}
            >
              <option value="">{opciones.length > 0 ? "Elige un docente" : "No hay otro docente habilitado"}</option>
              {opciones.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} · {d.enSupervision} en supervisión
                </option>
              ))}
            </select>
            <MensajeError id="error-nuevo-docente" texto={errores.docente} />
          </label>

          <label htmlFor="motivo-cambio-docente" className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold">Motivo (obligatorio)</span>
              <span className={`font-mono text-[11px] ${motivo.length >= LONGITUD_MAXIMA_MOTIVO ? "text-warn" : "text-muted"}`}>
                {motivo.length}/{LONGITUD_MAXIMA_MOTIVO}
              </span>
            </span>
            <textarea
              ref={campoMotivo}
              id="motivo-cambio-docente"
              name="motivo"
              rows={3}
              maxLength={LONGITUD_MAXIMA_MOTIVO}
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Por ejemplo: renuncia del docente."
              aria-invalid={errores.motivo ? true : undefined}
              aria-describedby={errores.motivo ? "error-motivo-cambio-docente" : undefined}
              className={`resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm leading-normal placeholder:text-muted/70 focus:border-navy ${
                errores.motivo ? "border-warn" : "border-line"
              }`}
            />
            <MensajeError id="error-motivo-cambio-docente" texto={errores.motivo} />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrar}
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-navy hover:bg-navy-tint"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="min-h-11 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover disabled:cursor-wait disabled:opacity-70"
            >
              {enviando ? "Guardando…" : "Guardar cambio"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
