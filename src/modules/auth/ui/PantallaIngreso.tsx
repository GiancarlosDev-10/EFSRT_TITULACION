// Pantalla de ingreso (mockups Main.dc.html y PC_Ingreso.dc.html).
// TODO(auth): el botón llevará al flujo de Google OAuth; por ahora navega al destino.
import Link from "next/link";
import type { ReactNode } from "react";
import { IconoAlerta, IconoCorreo, IconoHistorial, IconoIngresar, IconoUbicacion, Logo } from "@/shared";

export const DOMINIO_INSTITUCIONAL = "@iestpgildaballivian.edu.pe";

const BENEFICIOS = [
  { icono: <IconoUbicacion />, texto: "La oficina donde está tu carpeta ahora mismo" },
  { icono: <IconoCorreo />, texto: "Un correo apenas te observen algo o avance" },
  { icono: <IconoHistorial />, texto: "El historial de cada paso, con fecha y responsable" },
];

/** Aviso cuando alguien intenta ingresar con una cuenta que no es institucional. */
export function AvisoDominio() {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-warn-border bg-warn-bg p-3.5 text-warn-text">
      <IconoAlerta tamano={18} className="mt-0.5 shrink-0" />
      <span className="text-[13px] leading-relaxed">
        Solo se aceptan cuentas <b>{DOMINIO_INSTITUCIONAL}</b>. Si no tienes la tuya, solicítala en tu coordinación.
      </span>
    </div>
  );
}

type Props = {
  /** A dónde lleva el botón mientras no haya login real. */
  destino: string;
  /** Aviso opcional sobre el botón (p. ej. dominio no permitido). */
  aviso?: ReactNode;
  /** Ilustración del panel derecho en PC. */
  vistaPrevia: ReactNode;
};

export function PantallaIngreso({ destino, aviso, vistaPrevia }: Props) {
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
          <Link
            href={destino}
            className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-navy text-[15px] font-semibold text-white hover:bg-navy-hover"
          >
            <IconoIngresar />
            Ingresar con Google institucional
          </Link>
          <p className="text-center font-mono text-[11px] text-muted">Usa tu cuenta {DOMINIO_INSTITUCIONAL}</p>
        </div>

        <p className="mt-auto text-center text-[11px] text-muted lg:mt-0">
          Tus datos se tratan conforme a la Ley N.° 29733, Ley de Protección de Datos Personales.
        </p>
      </section>

      <aside className="hidden items-center justify-center bg-ink p-10 lg:flex">{vistaPrevia}</aside>
    </main>
  );
}
