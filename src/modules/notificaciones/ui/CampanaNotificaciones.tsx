"use client";
// Campana de notificaciones (D58): botón con el número sin leer y un panel con
// los últimos avisos. Al abrirla se marcan como leídos; mientras está abierta,
// los que eran nuevos se resaltan. Se cierra con la X, con Esc o con un clic
// fuera. Sin tiempo real: si la campana vive en un layout (que no se vuelve a
// dibujar al navegar), pide sus avisos otra vez cuando cambia la dirección.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { IconoCampana, IconoCerrar, capitalizar, diaRelativo, hora } from "@/shared";
import { MAXIMO_AVISOS, type Campana } from "../application/campana";

export type LecturaCampana = { campana: Campana; ahora: Date };

type Props = {
  inicial: LecturaCampana;
  /** Server Action: los avisos de la sesión; `null` si ya no hay sesión. */
  leer: () => Promise<LecturaCampana | null>;
  /** Server Action: marca como leídos los propios hasta ese id. */
  marcar: (hastaId: number) => Promise<boolean>;
  /** Sobre la barra superior oscura de las oficinas (celular). */
  enBarra?: boolean;
};

const momento = (fecha: Date, ahora: Date) => `${capitalizar(diaRelativo(fecha, ahora))} · ${hora(fecha)}`;

/**
 * Las oficinas tienen dos campanas en la página (celular y PC; se ve una según
 * el ancho). La que se abre avisa a la otra con este evento, para que no
 * reaparezca el número al cambiar el ancho de la ventana.
 */
const EVENTO_LEIDOS = "campana:leidos";

/** Los avisos hasta `hasta` quedan leídos (los anteriores a la lista también). */
function leidosHasta(campana: Campana, hasta: number): Campana {
  const avisos = campana.avisos.map((a) => (a.id <= hasta ? { ...a, leido: true } : a));
  return { ...campana, avisos, sinLeer: avisos.filter((a) => !a.leido).length };
}

export function CampanaNotificaciones({ inicial, leer, marcar, enBarra = false }: Props) {
  const [{ campana, ahora }, setLectura] = useState(inicial);
  const [abierta, setAbierta] = useState(false);
  const [nuevos, setNuevos] = useState<ReadonlySet<number>>(new Set());
  const [, iniciar] = useTransition();
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idPanel = useId();
  const ruta = usePathname();
  const rutaInicial = useRef(ruta);

  // Al navegar dentro del mismo layout: vuelve a pedir los avisos (solo la
  // campana visible; en celular y PC hay una cada una).
  useEffect(() => {
    if (ruta === rutaInicial.current) return;
    rutaInicial.current = ruta;
    setAbierta(false);
    if (contenedor.current?.offsetParent === null) return;
    let vigente = true;
    leer().then((lectura) => vigente && lectura && setLectura(lectura));
    return () => {
      vigente = false;
    };
  }, [ruta, leer]);

  function cerrar(devolverFoco = true) {
    setAbierta(false);
    setNuevos(new Set());
    if (devolverFoco) boton.current?.focus();
  }

  function abrir() {
    setNuevos(new Set(campana.avisos.filter((a) => !a.leido).map((a) => a.id)));
    setAbierta(true);
    const hasta = campana.ultimoId;
    if (campana.sinLeer > 0 && hasta !== null) {
      // Todo lo que ya se ve (y lo anterior) queda leído.
      setLectura((l) => ({ ...l, campana: leidosHasta(l.campana, hasta) }));
      window.dispatchEvent(new CustomEvent<number>(EVENTO_LEIDOS, { detail: hasta }));
      iniciar(async () => {
        await marcar(hasta);
      });
    }
  }

  // La otra campana de la página se abrió: lo mismo queda leído aquí.
  useEffect(() => {
    const alLeer = (e: Event) => {
      const hasta = (e as CustomEvent<number>).detail;
      setLectura((l) => ({ ...l, campana: leidosHasta(l.campana, hasta) }));
    };
    window.addEventListener(EVENTO_LEIDOS, alLeer);
    return () => window.removeEventListener(EVENTO_LEIDOS, alLeer);
  }, []);

  // Esc o clic fuera: cierra (Esc devuelve el foco a la campana).
  useEffect(() => {
    if (!abierta) return;
    const ocultar = () => {
      setAbierta(false);
      setNuevos(new Set());
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      ocultar();
      boton.current?.focus();
    };
    const alPulsar = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) ocultar();
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alPulsar);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alPulsar);
    };
  }, [abierta]);

  const { sinLeer, avisos } = campana;
  const etiqueta = sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : "Notificaciones";

  return (
    // En celular el panel se ancla al encabezado (a todo el ancho); en PC, a la campana.
    <div ref={contenedor} className="lg:relative">
      <button
        ref={boton}
        type="button"
        onClick={() => (abierta ? cerrar() : abrir())}
        aria-expanded={abierta}
        aria-controls={idPanel}
        aria-label={etiqueta}
        className={`relative flex size-11 items-center justify-center rounded-[14px] border ${
          enBarra
            ? "border-ink-line bg-ink-raised text-white hover:bg-ink-active"
            : "border-line bg-white text-ink hover:bg-bg"
        }`}
      >
        <IconoCampana tamano={20} />
        {sinLeer > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn px-1 font-mono text-[10px] font-semibold text-white"
          >
            {sinLeer > 99 ? "99+" : sinLeer}
          </span>
        )}
      </button>

      {abierta && (
        <div
          id={idPanel}
          role="region"
          aria-label="Notificaciones"
          className={`absolute top-full z-30 mt-2 flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-xl lg:inset-x-auto lg:right-0 lg:w-[360px] ${
            enBarra ? "inset-x-3" : "inset-x-0"
          }`}
        >
          <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="font-display text-[15px] font-extrabold">Notificaciones</h2>
            <button
              type="button"
              onClick={() => cerrar()}
              aria-label="Cerrar notificaciones"
              className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-bg"
            >
              <IconoCerrar tamano={18} />
            </button>
          </div>

          {avisos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Aún no tienes notificaciones.</p>
          ) : (
            <ul className="max-h-[min(420px,60dvh)] divide-y divide-line overflow-y-auto">
              {avisos.map((aviso) => {
                const nuevo = nuevos.has(aviso.id);
                return (
                  <li key={aviso.id}>
                    <Link
                      href={aviso.enlace}
                      onClick={() => cerrar(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-bg ${nuevo ? "bg-navy-tint/40" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${nuevo ? "bg-navy" : "bg-transparent"}`}
                      />
                      <span className="flex min-w-0 grow flex-col gap-0.5">
                        <span className={`text-[13px] leading-snug ${nuevo ? "font-semibold" : "font-medium"}`}>
                          {aviso.titulo}
                          {nuevo && <span className="sr-only"> (nuevo)</span>}
                        </span>
                        <span className="truncate text-xs text-muted">{aviso.detalle}</span>
                        <span className="font-mono text-[11px] text-muted">{momento(aviso.fecha, ahora)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {avisos.length >= MAXIMO_AVISOS && (
            <p className="border-t border-line px-4 py-2.5 text-[11px] text-muted">Se muestran las últimas {MAXIMO_AVISOS}.</p>
          )}
        </div>
      )}
    </div>
  );
}
