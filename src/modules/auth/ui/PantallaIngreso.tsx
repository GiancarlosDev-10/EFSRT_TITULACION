// Pantalla de ingreso (mockups Main.dc.html y PC_Ingreso.dc.html).
// Acceso (D36): Google con la cuenta institucional o con un Gmail registrado por
// Mesa de Partes; para otros correos registrados, un enlace al correo.
import Image from "next/image";
import type { ReactNode } from "react";
import { IconoAlerta, IconoCorreo, IconoHistorial, IconoUbicacion, Logo } from "@/shared";
import { ingresarConGoogle } from "../acciones";
import { FormularioEnlace } from "./FormularioEnlace";

export const DOMINIO_INSTITUCIONAL = "@iestpgildaballivian.edu.pe";

const BENEFICIOS = [
  { icono: <IconoUbicacion />, texto: "La oficina donde está tu carpeta ahora mismo" },
  { icono: <IconoCorreo />, texto: "Un correo apenas te observen algo o avance" },
  { icono: <IconoHistorial />, texto: "El historial de cada paso, con fecha y responsable" },
];

function Aviso({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-warn-border bg-warn-bg p-3.5 text-warn-text">
      <IconoAlerta tamano={18} className="mt-0.5 shrink-0" />
      <span className="text-[13px] leading-relaxed">{children}</span>
    </div>
  );
}

/** Aviso cuando la cuenta con la que se intentó entrar no está habilitada. */
export function AvisoCuentaNoHabilitada() {
  return (
    <Aviso>
      Esta cuenta no está habilitada. Ingresa con tu cuenta <b>{DOMINIO_INSTITUCIONAL}</b> o con el correo que
      registraste en Mesa de Partes al entregar tu carpeta.
    </Aviso>
  );
}

/** Aviso cuando el enlace al correo ya se usó o venció. */
export function AvisoEnlaceVencido() {
  return <Aviso>El enlace venció o ya se usó. Pide uno nuevo con tu correo.</Aviso>;
}

type Props = {
  /** Aviso opcional sobre el botón (p. ej. cuenta no habilitada). */
  aviso?: ReactNode;
  /** Ilustración del panel derecho en PC. */
  vistaPrevia: ReactNode;
};

export function PantallaIngreso({ aviso, vistaPrevia }: Props) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-2">
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 py-10 lg:justify-center">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-ink p-1.5">
            <Logo tamano={36} />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-base font-extrabold">EFSRT Seguimiento</span>
            <span className="text-xs text-muted">IESTP Gilda Liliana Ballivián Rosado</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[28px] leading-tight font-extrabold lg:text-[34px]">
            Tu trámite avanza. Tú lo ves en tiempo real.
          </h1>
          <p className="text-sm leading-relaxed text-text-soft">
            Tu carpeta sigue su recorrido en físico. Aquí ves en qué oficina está, en qué estado y qué te observaron.
          </p>
        </div>

        <ul className="flex flex-col gap-3 lg:hidden">
          {BENEFICIOS.map(({ icono, texto }) => (
            <li key={texto} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-tint text-navy">{icono}</span>
              <span className="text-[13px]">{texto}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          {aviso}
          {/* Estilo del botón según las pautas de marca de Google (logo oficial en public/). */}
          <form action={ingresarConGoogle}>
            <button
              type="submit"
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-pending bg-white text-[15px] font-semibold text-ink shadow-sm shadow-ink/10 hover:bg-bg"
            >
              <Image src="/google.svg" alt="" width={20} height={20} unoptimized />
              Continuar con Google
            </button>
          </form>
          <p className="text-center text-xs leading-relaxed text-muted">
            Con tu cuenta {DOMINIO_INSTITUCIONAL} o el Gmail que registraste en Mesa de Partes
          </p>
          <FormularioEnlace />
        </div>

        <p className="mt-auto text-center text-[11px] text-muted lg:mt-0">
          Tus datos se tratan conforme a la Ley N.° 29733, Ley de Protección de Datos Personales.
        </p>
      </section>

      <aside className="hidden items-center justify-center bg-ink p-10 lg:flex">{vistaPrevia}</aside>
    </main>
  );
}
