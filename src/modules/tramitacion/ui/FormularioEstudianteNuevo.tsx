"use client";

// Alta de un estudiante en su primera carpeta (mockup Oficinas.html). Valida con
// las mismas reglas del dominio que usará el servidor (validarDatosEstudiante):
// así los mensajes coinciden. El servidor y la base vuelven a validar.
import Link from "next/link";
import { startTransition, useActionState, useRef, useState, type FormEvent, type ReactNode } from "react";
import { IconoAlerta } from "@/shared";
import { DOMINIO_INSTITUCIONAL, validarDatosEstudiante, type DatosEstudiante, type TipoDocumento } from "../domain";
import { MENSAJES_DATOS_ESTUDIANTE } from "../application/mensajes";
import { RUTAS_RECEPCION } from "./rutas";

type Campo = keyof DatosEstudiante;

export type EstadoAltaEstudiante = {
  /** Error que no es de un campo (p. ej. documento ya registrado). */
  error: string | null;
  /** Mensaje por campo, si el servidor rechazó alguno. */
  campos: Partial<Record<Campo, string>>;
};

type Props = {
  carreras: { id: string; nombre: string }[];
  accion: (estado: EstadoAltaEstudiante, datos: FormData) => Promise<EstadoAltaEstudiante>;
};

const INICIAL: EstadoAltaEstudiante = { error: null, campos: {} };
const ORDEN: Campo[] = ["tipoDocumento", "numeroDocumento", "nombres", "apellidos", "carrera", "correoInstitucional", "correoPersonal"];

export function FormularioEstudianteNuevo({ carreras, accion }: Props) {
  const [respuesta, enviar, enviando] = useActionState(accion, INICIAL);
  const [valores, setValores] = useState<Record<Campo, string>>({
    tipoDocumento: "DNI",
    numeroDocumento: "",
    nombres: "",
    apellidos: "",
    carrera: carreras.length === 1 ? carreras[0].id : "",
    correoInstitucional: "",
    correoPersonal: "",
  });
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const formulario = useRef<HTMLFormElement>(null);

  // Los del navegador mandan; si no hay, los que devolvió el servidor.
  const mensajes = Object.keys(errores).length > 0 ? errores : respuesta.campos;
  const cambiar = (campo: Campo) => (valor: string) => setValores((previos) => ({ ...previos, [campo]: valor }));

  function validar(evento: FormEvent<HTMLFormElement>) {
    // Se envía a mano: con `action={…}`, React vacía el formulario tras cada
    // envío y, si el servidor rechaza (p. ej. documento repetido), los campos
    // quedarían en blanco mientras el estado aún tiene lo escrito.
    evento.preventDefault();
    const resultado = validarDatosEstudiante(valores);
    const nuevos: Partial<Record<Campo, string>> = {};
    if (!resultado.ok) {
      for (const [campo, codigo] of Object.entries(resultado.error) as [Campo, keyof typeof MENSAJES_DATOS_ESTUDIANTE][]) {
        nuevos[campo] = MENSAJES_DATOS_ESTUDIANTE[codigo];
      }
    }
    setErrores(nuevos);
    const primero = ORDEN.find((campo) => nuevos[campo]);
    if (primero) {
      formulario.current?.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
      return;
    }
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  const tipo = valores.tipoDocumento as TipoDocumento;
  return (
    <form ref={formulario} onSubmit={validar} noValidate className="flex flex-col">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-base font-extrabold">Estudiante nuevo</h2>
          <span className="text-xs text-muted">Con estos datos podrá entrar al sistema y seguir su trámite.</span>
        </div>

        {respuesta.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warn-border bg-warn-bg p-3.5 text-[13px] text-warn-text">
            <IconoAlerta tamano={18} className="mt-0.5 shrink-0 text-warn" />
            {respuesta.error}
          </div>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold">Documento de identidad</legend>
          <div className="flex gap-1 rounded-xl bg-neutral-bg p-1">
            {(
              [
                ["DNI", "DNI"],
                ["CE", "Carné de extranjería"],
              ] as const
            ).map(([valor, texto]) => (
              <label
                key={valor}
                className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg text-[13px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy ${
                  tipo === valor ? "bg-white text-ink shadow-sm" : "text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="tipoDocumento"
                  value={valor}
                  checked={tipo === valor}
                  onChange={() => cambiar("tipoDocumento")(valor)}
                  className="sr-only"
                />
                {texto}
              </label>
            ))}
          </div>
        </fieldset>

        <Campo id="numeroDocumento" etiqueta="Número" error={mensajes.numeroDocumento}>
          <input
            id="numeroDocumento"
            name="numeroDocumento"
            inputMode={tipo === "DNI" ? "numeric" : "text"}
            autoComplete="off"
            value={valores.numeroDocumento}
            onChange={(e) => cambiar("numeroDocumento")(e.target.value)}
            placeholder={tipo === "DNI" ? "8 dígitos" : "Hasta 12 caracteres"}
            {...atributosDeError("numeroDocumento", mensajes.numeroDocumento)}
            className={claseDeCampo(mensajes.numeroDocumento, "font-mono")}
          />
        </Campo>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Campo id="nombres" etiqueta="Nombres" error={mensajes.nombres}>
            <input
              id="nombres"
              name="nombres"
              autoComplete="off"
              value={valores.nombres}
              onChange={(e) => cambiar("nombres")(e.target.value)}
              {...atributosDeError("nombres", mensajes.nombres)}
              className={claseDeCampo(mensajes.nombres)}
            />
          </Campo>
          <Campo id="apellidos" etiqueta="Apellidos" error={mensajes.apellidos}>
            <input
              id="apellidos"
              name="apellidos"
              autoComplete="off"
              value={valores.apellidos}
              onChange={(e) => cambiar("apellidos")(e.target.value)}
              {...atributosDeError("apellidos", mensajes.apellidos)}
              className={claseDeCampo(mensajes.apellidos)}
            />
          </Campo>
        </div>

        <Campo id="carrera" etiqueta="Carrera" error={mensajes.carrera}>
          <select
            id="carrera"
            name="carrera"
            value={valores.carrera}
            onChange={(e) => cambiar("carrera")(e.target.value)}
            {...atributosDeError("carrera", mensajes.carrera)}
            className={claseDeCampo(mensajes.carrera)}
          >
            {carreras.length !== 1 && <option value="">Elige la carrera</option>}
            {carreras.map((carrera) => (
              <option key={carrera.id} value={carrera.id}>
                {carrera.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="correoInstitucional" etiqueta="Correo institucional" error={mensajes.correoInstitucional}>
          <input
            id="correoInstitucional"
            name="correoInstitucional"
            type="email"
            autoComplete="off"
            value={valores.correoInstitucional}
            onChange={(e) => cambiar("correoInstitucional")(e.target.value)}
            placeholder={`usuario${DOMINIO_INSTITUCIONAL}`}
            {...atributosDeError("correoInstitucional", mensajes.correoInstitucional)}
            className={claseDeCampo(mensajes.correoInstitucional, "font-mono")}
          />
        </Campo>

        <Campo
          id="correoPersonal"
          etiqueta="Correo personal"
          error={mensajes.correoPersonal}
          ayuda="Al menos uno de los dos. Pide el personal si ya egresó o no usa su cuenta institucional."
        >
          <input
            id="correoPersonal"
            name="correoPersonal"
            type="email"
            autoComplete="off"
            value={valores.correoPersonal}
            onChange={(e) => cambiar("correoPersonal")(e.target.value)}
            placeholder="nombre@gmail.com"
            {...atributosDeError("correoPersonal", mensajes.correoPersonal)}
            className={claseDeCampo(mensajes.correoPersonal, "font-mono")}
          />
        </Campo>
      </div>

      <div className="flex gap-2 border-t border-line p-5">
        <Link
          href={RUTAS_RECEPCION.buscar}
          className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:bg-bg"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="flex min-h-11 grow items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover disabled:cursor-wait disabled:opacity-70"
        >
          {enviando ? "Guardando…" : "Guardar y continuar"}
        </button>
      </div>
    </form>
  );
}

function atributosDeError(id: string, error?: string) {
  return error ? { "aria-invalid": true, "aria-describedby": `error-${id}` } : {};
}

function claseDeCampo(error: string | undefined, extra = "") {
  return `min-h-11 rounded-xl border bg-white px-3.5 text-sm placeholder:text-muted/70 focus:border-navy ${extra} ${
    error ? "border-warn" : "border-line"
  }`;
}

function Campo({ id, etiqueta, error, ayuda, children }: { id: string; etiqueta: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <span id={`error-${id}`} className="flex items-center gap-1 text-xs font-semibold text-warn">
          <IconoAlerta tamano={13} className="shrink-0" />
          {error}
        </span>
      ) : (
        ayuda && <span className="text-xs text-muted">{ayuda}</span>
      )}
    </div>
  );
}
