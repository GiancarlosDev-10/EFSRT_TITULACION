"use client";

// Recepción, paso 2 (mockup Oficinas.html): elegir el módulo de la carpeta.
// Los módulos con expediente aparecen bloqueados. Como el panel de acción, el
// botón nunca se desactiva: valida al pulsar y lleva el foco a lo que falta.
import { startTransition, useActionState, useRef, useState, type FormEvent } from "react";
import { IconoAlerta } from "@/shared";
import { ESTADO_INICIAL, ESTADOS, LONGITUD_MAXIMA_MOTIVO, MODULOS, type Modulo } from "../domain";
import type { CandidatoRecepcion } from "../application";
import { ChipCodigo } from "./ChipCodigo";
import type { EstadoPanelAccion } from "./PanelAccion";
import { tonoDeEstado } from "./presentacion-oficina";

type Props = {
  estudianteId: string;
  modulos: CandidatoRecepcion["modulos"];
  nombresModulo: Record<Modulo, string> | null;
  accion: (estado: EstadoPanelAccion, datos: FormData) => Promise<EstadoPanelAccion>;
};

const INICIAL: EstadoPanelAccion = { error: null, conflicto: false };

export function FormularioRecepcion({ estudianteId, modulos, nombresModulo, accion }: Props) {
  const [respuesta, enviar, enviando] = useActionState(accion, INICIAL);
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [nota, setNota] = useState("");
  const [falta, setFalta] = useState(false);
  const primerLibre = useRef<HTMLInputElement>(null);
  const libres = MODULOS.filter((m) => modulos[m] === null);

  if (libres.length === 0) {
    return (
      <p className="p-5 text-sm text-muted">
        Este estudiante ya tiene expediente en los tres módulos. Búscalo en la bandeja para ver en qué estado está cada uno.
      </p>
    );
  }

  function validar(evento: FormEvent<HTMLFormElement>) {
    // Se envía a mano: con `action={…}`, React vacía el formulario tras cada
    // envío y, si el servidor rechaza, lo elegido se vería en blanco.
    evento.preventDefault();
    setFalta(modulo === null);
    if (modulo === null) {
      primerLibre.current?.focus();
      return;
    }
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={validar} noValidate className="flex flex-col gap-4 p-5">
      <input type="hidden" name="estudianteId" value={estudianteId} />

      {respuesta.error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warn-border bg-warn-bg p-3.5 text-[13px] text-warn-text">
          <IconoAlerta tamano={18} className="mt-0.5 shrink-0 text-warn" />
          {respuesta.error}
        </div>
      )}

      <fieldset className="flex flex-col gap-2" aria-describedby={falta ? "error-modulo" : undefined}>
        <legend className="mb-2 font-display text-base font-extrabold">¿De qué módulo es la carpeta?</legend>
        {MODULOS.map((m) => {
          const expediente = modulos[m];
          const nombre = nombresModulo?.[m];
          if (expediente) {
            return (
              <div key={m} className="flex min-h-11 items-start gap-3 rounded-xl border border-line bg-bg p-3.5 text-muted">
                <input type="radio" disabled aria-label={`Módulo ${m}: ya tiene expediente`} className="mt-1 size-4 shrink-0" />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Módulo {m}</span>
                  <span className="flex items-start gap-2 text-xs">
                    Ya tiene expediente:
                    <ChipCodigo codigo={expediente.estado} tono={tonoDeEstado(expediente.estado)} />
                    {ESTADOS[expediente.estado].nombre}
                  </span>
                </span>
              </div>
            );
          }
          const marcado = modulo === m;
          return (
            <label
              key={m}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${
                marcado ? "border-navy bg-navy-tint/50" : falta ? "border-warn" : "border-line hover:bg-bg"
              }`}
            >
              <input
                ref={m === libres[0] ? primerLibre : undefined}
                type="radio"
                name="modulo"
                value={m}
                checked={marcado}
                onChange={() => setModulo(m)}
                className="mt-1 size-4 shrink-0 accent-navy"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Módulo {m}</span>
                {nombre && <span className="text-xs text-muted">{nombre}</span>}
              </span>
            </label>
          );
        })}
        {falta && (
          <span id="error-modulo" className="flex items-center gap-1 text-xs font-semibold text-warn">
            <IconoAlerta tamano={13} className="shrink-0" />
            Elige el módulo de la carpeta.
          </span>
        )}
      </fieldset>

      <label htmlFor="nota" className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold">Nota (opcional)</span>
          <span className={`font-mono text-[11px] ${nota.length >= LONGITUD_MAXIMA_MOTIVO ? "text-warn" : "text-muted"}`}>
            {nota.length}/{LONGITUD_MAXIMA_MOTIVO}
          </span>
        </span>
        <textarea
          id="nota"
          name="nota"
          rows={3}
          maxLength={LONGITUD_MAXIMA_MOTIVO}
          value={nota}
          onChange={(evento) => setNota(evento.target.value)}
          placeholder="Por ejemplo: entregó la carpeta sin la copia del DNI."
          className="resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm leading-normal placeholder:text-muted/70 focus:border-navy"
        />
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? "Registrando…" : "Registrar recepción"}
      </button>
      <p className="text-[11px] leading-normal text-muted">
        El expediente nace en {ESTADO_INICIAL} · {ESTADOS[ESTADO_INICIAL].nombre}. Después revisarás el pago desde el expediente.
      </p>
    </form>
  );
}
