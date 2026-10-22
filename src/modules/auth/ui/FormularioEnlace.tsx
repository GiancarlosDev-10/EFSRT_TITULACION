"use client";

// Ingreso con enlace al correo (D36), para correos personales que no son Gmail.
// Plegado por defecto: la mayoría entra con Google.
import { useActionState } from "react";
import { IconoCheckCirculo, IconoCorreo } from "@/shared";
import { enviarEnlace, type EstadoEnlace } from "../acciones";

const INICIAL: EstadoEnlace = { estado: "inicial" };

export function FormularioEnlace() {
  const [resultado, accion, enviando] = useActionState(enviarEnlace, INICIAL);

  if (resultado.estado === "enviado") {
    return (
      <div role="status" className="flex items-start gap-2.5 rounded-2xl border border-line bg-white p-3.5">
        <IconoCheckCirculo tamano={18} className="mt-0.5 shrink-0 text-ok" />
        <p className="text-[13px] leading-relaxed">
          Si <span className="font-mono text-xs font-medium break-all">{resultado.correo}</span> está registrado, te
          llegará un enlace para ingresar. Revisa también tu carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <details className="group rounded-2xl border border-line bg-white" open={resultado.estado === "invalido"}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 px-4 text-[13px] font-semibold text-navy">
        <IconoCorreo tamano={18} />
        ¿Tu correo no es de Gmail? Recibe un enlace
      </summary>
      <form action={accion} className="flex flex-col gap-2.5 border-t border-line p-3.5">
        <label htmlFor="correo-enlace" className="text-xs font-semibold">
          Correo que registraste en Mesa de Partes
        </label>
        <input
          id="correo-enlace"
          name="correo"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          defaultValue={resultado.estado === "invalido" ? resultado.correo : undefined}
          aria-invalid={resultado.estado === "invalido"}
          aria-describedby={resultado.estado === "invalido" ? "correo-enlace-error" : undefined}
          placeholder="nombre@hotmail.com"
          className="min-h-11 rounded-xl border border-pending px-3 font-mono text-sm aria-invalid:border-warn"
        />
        {resultado.estado === "invalido" && (
          <p id="correo-enlace-error" className="text-xs text-warn-text">
            Revisa el correo: debe tener la forma nombre@dominio.com.
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 rounded-xl bg-navy text-sm font-semibold text-white hover:bg-navy-hover disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviarme el enlace"}
        </button>
      </form>
    </details>
  );
}
