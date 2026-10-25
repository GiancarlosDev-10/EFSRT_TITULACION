"use client";

// Panel "¿Qué registras?" del detalle de un expediente (mockup Oficinas.html).
// El botón nunca se desactiva: al pulsarlo se marca lo que falta y el foco va
// al primer campo pendiente. La Server Action vuelve a validar todo (capa 2) y
// la base, otra vez (capa 3); esta validación solo ahorra un viaje al servidor.
import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { LONGITUD_MAXIMA_MOTIVO, type CodigoEstado } from "../domain";
import { AlertaServidor, MensajeError } from "./avisos-formulario";
import { ChipCodigo } from "./ChipCodigo";
import type { OpcionAccion } from "./presentacion-oficina";

export type EstadoPanelAccion = {
  /** Mensaje del servidor si no se pudo registrar. */
  error: string | null;
  /** Otra persona cambió el expediente: se ofrece recargar. */
  conflicto: boolean;
};

export type DocenteParaElegir = { id: string; nombre: string; enSupervision: number };

type Props = {
  expedienteId: string;
  /** Estado que se ve en pantalla: el servidor lo compara con el actual (conflicto). */
  estado: CodigoEstado;
  opciones: OpcionAccion[];
  docentes: DocenteParaElegir[];
  nombreEstudiante: string;
  accion: (estado: EstadoPanelAccion, datos: FormData) => Promise<EstadoPanelAccion>;
};

type Errores = Partial<Record<"hacia" | "docente" | "motivo", string>>;

const INICIAL: EstadoPanelAccion = { error: null, conflicto: false };

export function PanelAccion({ expedienteId, estado, opciones, docentes, nombreEstudiante, accion }: Props) {
  const [respuesta, enviar, enviando] = useActionState(accion, INICIAL);
  const [hacia, setHacia] = useState<CodigoEstado | null>(opciones.length === 1 ? opciones[0].codigo : null);
  const [docente, setDocente] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const campoHacia = useRef<HTMLInputElement>(null);
  const campoDocente = useRef<HTMLSelectElement>(null);
  const campoMotivo = useRef<HTMLTextAreaElement>(null);

  const elegida = opciones.find((opcion) => opcion.codigo === hacia) ?? null;

  function validar(evento: FormEvent<HTMLFormElement>) {
    // Se envía a mano: con `action={…}`, React vacía el formulario tras cada
    // envío y, si el servidor rechaza, los campos quedarían en blanco mientras
    // el estado aún recuerda lo elegido.
    evento.preventDefault();
    const nuevos: Errores = {};
    if (!elegida) nuevos.hacia = "Elige qué registras.";
    else {
      if (elegida.exigeDocente && !docente) nuevos.docente = "Elige al Docente Supervisor.";
      if (elegida.observacion && !motivo.trim()) nuevos.motivo = "Escribe qué debe corregir el estudiante.";
    }
    setErrores(nuevos);
    const campos = { hacia: campoHacia, docente: campoDocente, motivo: campoMotivo };
    const primero = (["hacia", "docente", "motivo"] as const).find((campo) => nuevos[campo]);
    if (primero) {
      campos[primero].current?.focus();
      return;
    }
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={validar} noValidate className="flex flex-col gap-4 p-5">
      <input type="hidden" name="expedienteId" value={expedienteId} />
      <input type="hidden" name="desde" value={estado} />

      <AlertaServidor {...respuesta} />

      <fieldset className="flex flex-col gap-2" aria-describedby={errores.hacia ? "error-hacia" : undefined}>
        <legend className="mb-2 font-display text-base font-extrabold">¿Qué registras?</legend>
        {opciones.map((opcion, i) => {
          const marcada = opcion.codigo === hacia;
          const borde = marcada
            ? opcion.observacion
              ? "border-warn bg-warn-bg/50"
              : "border-navy bg-navy-tint/50"
            : errores.hacia
              ? "border-warn"
              : "border-line hover:bg-bg";
          return (
            <label key={opcion.codigo} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${borde}`}>
              <input
                ref={i === 0 ? campoHacia : undefined}
                type="radio"
                name="hacia"
                value={opcion.codigo}
                checked={marcada}
                onChange={() => setHacia(opcion.codigo)}
                className="mt-1 size-4 shrink-0 accent-navy"
              />
              <span className="flex flex-col gap-1">
                <span className="flex items-start gap-2">
                  <ChipCodigo codigo={opcion.codigo} tono={opcion.tono} />
                  <span className="text-sm leading-snug font-semibold">{opcion.nombre}</span>
                </span>
                <span className="text-xs leading-normal text-muted">{opcion.ayuda}</span>
              </span>
            </label>
          );
        })}
        <MensajeError id="error-hacia" texto={errores.hacia} />
      </fieldset>

      {elegida?.exigeDocente && (
        <label htmlFor="docente" className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Docente Supervisor</span>
          <select
            ref={campoDocente}
            id="docente"
            name="docenteId"
            value={docente}
            onChange={(evento) => setDocente(evento.target.value)}
            aria-invalid={errores.docente ? true : undefined}
            aria-describedby={errores.docente ? "error-docente" : undefined}
            className={`min-h-11 rounded-xl border bg-white px-3 text-sm focus:border-navy ${errores.docente ? "border-warn" : "border-line"}`}
          >
            <option value="">Elige un docente</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} · {d.enSupervision} en supervisión
              </option>
            ))}
          </select>
          <MensajeError id="error-docente" texto={errores.docente} />
        </label>
      )}

      {elegida && (
        <label htmlFor="motivo" className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold">
              {elegida.observacion ? "Motivo de la observación (obligatorio)" : "Nota (opcional)"}
            </span>
            <span className={`font-mono text-[11px] ${motivo.length >= LONGITUD_MAXIMA_MOTIVO ? "text-warn" : "text-muted"}`}>
              {motivo.length}/{LONGITUD_MAXIMA_MOTIVO}
            </span>
          </span>
          <textarea
            ref={campoMotivo}
            id="motivo"
            name="motivo"
            rows={3}
            maxLength={LONGITUD_MAXIMA_MOTIVO}
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder={elegida.observacion ? "Qué debe corregir el estudiante. Lo leerá tal cual." : "Algo que el estudiante deba saber."}
            aria-invalid={errores.motivo ? true : undefined}
            aria-describedby={errores.motivo ? "error-motivo" : undefined}
            className={`resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm leading-normal placeholder:text-muted/70 focus:border-navy ${
              errores.motivo ? "border-warn" : "border-line"
            }`}
          />
          <MensajeError id="error-motivo" texto={errores.motivo} />
        </label>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Registrando…" : elegida ? `Registrar ${elegida.codigo} · ${elegida.nombreBreve}` : "Registrar"}
      </button>
      <p className="text-[11px] leading-normal text-muted">
        Quedará registrado a tu nombre, con la fecha y hora de hoy, y no se puede editar ni borrar. {nombreEstudiante} verá
        el cambio en su seguimiento.
      </p>
    </form>
  );
}
