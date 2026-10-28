// Íconos SVG de trazo (CLAUDE.md: sin emojis). Son decorativos: quien los usa
// pone el texto visible o el aria-label en el botón o enlace.
import type { ReactNode } from "react";

type PropsIcono = {
  tamano?: number;
  grosor?: number;
  className?: string;
};

function Icono({ tamano = 20, grosor = 2, className, children }: PropsIcono & { children: ReactNode }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconoUbicacion(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icono>
  );
}

export function IconoAlerta(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </Icono>
  );
}

export function IconoExclamacion(props: PropsIcono) {
  return (
    <Icono grosor={2.5} {...props}>
      <path d="M12 7v6" />
      <path d="M12 17h.01" />
    </Icono>
  );
}

export function IconoCheck(props: PropsIcono) {
  return (
    <Icono grosor={3} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icono>
  );
}

export function IconoChevronAbajo(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icono>
  );
}

export function IconoChevronDerecha(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icono>
  );
}

export function IconoVolver(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Icono>
  );
}

export function IconoCampana(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icono>
  );
}

export function IconoCerrar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icono>
  );
}

export function IconoCarpeta(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Icono>
  );
}

export function IconoCheckCirculo(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </Icono>
  );
}

export function IconoReloj(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icono>
  );
}

export function IconoIdentificacion(props: PropsIcono) {
  return (
    <Icono {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 10h4" />
      <path d="M14 14h4" />
    </Icono>
  );
}

export function IconoCorreo(props: PropsIcono) {
  return (
    <Icono {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </Icono>
  );
}

export function IconoHistorial(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </Icono>
  );
}

export function IconoInicio(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Icono>
  );
}

export function IconoRequisitos(props: PropsIcono) {
  return (
    <Icono {...props}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </Icono>
  );
}

export function IconoConstancia(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
    </Icono>
  );
}

export function IconoSalir(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Icono>
  );
}

export function IconoBandeja(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Icono>
  );
}

export function IconoBuscar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Icono>
  );
}

export function IconoCambiar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </Icono>
  );
}

export function IconoReproducir({ tamano = 14, className }: PropsIcono) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className ?? ""}`}>
      <path d="M7 4v16l13-8z" />
    </svg>
  );
}

export function IconoPausa({ tamano = 14, className }: PropsIcono) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className ?? ""}`}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

/** Logo del sistema: engranaje con marcador de ubicación. */
export function Logo({ tamano = 40 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        className="fill-white"
        d="M20.48 10.55 L22.93 10.79 L22.93 13.21 L20.48 13.45 L19.71 15.80 L21.56 17.45 L20.14 19.40 L18.00 18.16 L16.00 19.61 L16.53 22.03 L14.23 22.77 L13.24 20.51 L10.76 20.51 L9.77 22.77 L7.47 22.03 L8.00 19.61 L6.00 18.16 L3.86 19.40 L2.44 17.45 L4.29 15.80 L3.52 13.45 L1.07 13.21 L1.07 10.79 L3.52 10.55 L4.29 8.20 L2.44 6.55 L3.86 4.60 L6.00 5.84 L8.00 4.39 L7.47 1.97 L9.77 1.23 L10.76 3.49 L13.24 3.49 L14.23 1.23 L16.53 1.97 L16.00 4.39 L18.00 5.84 L20.14 4.60 L21.56 6.55 L19.71 8.20 Z"
      />
      <circle cx="12" cy="12" r="6.4" className="fill-navy" />
      <path className="fill-white" d="M12 7.9a2.7 2.7 0 0 0-2.7 2.7c0 2.1 2.7 4.6 2.7 4.6s2.7-2.5 2.7-4.6A2.7 2.7 0 0 0 12 7.9z" />
      <circle cx="12" cy="10.6" r="0.95" className="fill-navy" />
    </svg>
  );
}
