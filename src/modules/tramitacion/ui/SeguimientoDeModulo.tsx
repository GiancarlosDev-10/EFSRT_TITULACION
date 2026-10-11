// Página de seguimiento de un módulo (celular; mockup Tracker.dc.html): pestañas
// por módulo, tarjeta de ubicación con su mini barra de pasos y el tracker.
import Link from "next/link";
import { IconoCarpeta, IconoVolver, TituloSeccion } from "@/shared";
import { MODULOS, type Modulo } from "../domain";
import type { SeguimientoModulo as DatosModulo } from "../application";
import {
  avisosDeObservacion,
  codigosDeObservacion,
  etapaInicial,
  etapasDe,
  moduloInicial,
  pasosDeRecorrido,
  tonoDeExpediente,
  ubicacionDeModulo,
} from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";
import { TarjetaUbicacion } from "./TarjetaUbicacion";
import { TrackerDependencias } from "./TrackerDependencias";

function Pestanas({ elegido }: { elegido: Modulo }) {
  return (
    <nav aria-label="Elegir módulo" className="flex gap-1 rounded-[14px] bg-line p-1">
      {MODULOS.map((modulo) => (
        <Link
          key={modulo}
          href={RUTAS_ALUMNO.seguimiento(modulo)}
          aria-current={modulo === elegido ? "page" : undefined}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-[10px] text-[13px] font-semibold ${
            modulo === elegido ? "bg-white text-ink shadow-sm shadow-ink/15" : "text-text-soft"
          }`}
        >
          Módulo {modulo}
        </Link>
      ))}
    </nav>
  );
}

function SinExpediente() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-pending bg-white px-[22px] py-8 text-center">
      <span className="flex size-[60px] items-center justify-center rounded-full bg-navy-tint text-navy">
        <IconoCarpeta tamano={28} />
      </span>
      <span className="font-display text-lg font-extrabold">Aún no hay expediente</span>
      <span className="text-[13px] leading-relaxed text-text-soft">
        El seguimiento empieza cuando entregas tu carpeta física en Mesa de Partes. Te llegará un correo de confirmación.
      </span>
      <Link
        href={RUTAS_ALUMNO.requisitos}
        className="flex min-h-12 w-full items-center justify-center rounded-[14px] bg-navy text-sm font-semibold text-white hover:bg-navy-hover"
      >
        Ver cómo iniciar el trámite
      </Link>
    </div>
  );
}

type Props = {
  seguimiento: DatosModulo[];
  /** `null`: el predeterminado (el observado o el más reciente). */
  modulo: Modulo | null;
  ahora: Date;
};

export function SeguimientoDeModulo({ seguimiento, modulo, ahora }: Props) {
  const elegido = modulo ?? moduloInicial(seguimiento);
  const datos = seguimiento.find((m) => m.modulo === elegido) ?? seguimiento[0];
  const { expediente } = datos;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={RUTAS_ALUMNO.inicio}
          aria-label="Volver al inicio"
          className="-ml-2.5 flex size-11 items-center justify-center rounded-xl text-ink hover:bg-line"
        >
          <IconoVolver tamano={22} />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold">Seguimiento</h1>
      </div>

      <Pestanas elegido={elegido} />

      {expediente ? (
        <>
          <TarjetaUbicacion
            ubicacion={ubicacionDeModulo(datos, ahora)}
            aviso={avisosDeObservacion([datos], ahora)[0]}
            pasos={pasosDeRecorrido(expediente)}
          />
          {tonoDeExpediente(expediente) === "listo" && (
            <Link
              href={RUTAS_ALUMNO.constancia(elegido)}
              className="flex min-h-[50px] items-center justify-center rounded-2xl bg-ok text-sm font-semibold text-white"
            >
              Dónde y cómo recoger mi constancia
            </Link>
          )}
          <div className="mt-1">
            <TituloSeccion>Recorrido por dependencia</TituloSeccion>
          </div>
          <TrackerDependencias
            etapas={etapasDe(expediente)}
            hayExpediente
            abierta={etapaInicial(expediente)}
            ahora={ahora}
          />
        </>
      ) : (
        <SinExpediente />
      )}

      <p className="rounded-[14px] bg-navy-tint px-3.5 py-3 text-xs leading-relaxed text-navy-hover">
        Los estados <b>{codigosDeObservacion()}</b> son observaciones: el expediente se detiene en esa oficina hasta que
        entregues la corrección. Cada cambio te llega también al correo.
      </p>
    </div>
  );
}
