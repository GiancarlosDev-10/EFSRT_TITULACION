/* eslint-disable no-restricted-syntax -- Los clientes de correo no leen
   variables CSS ni el tema de Tailwind: el HTML del correo necesita los colores
   escritos. Son los mismos de src/app/globals.css y solo se usan aquí. */

/** Paleta del proyecto (CLAUDE.md, Diseño) para el HTML de los correos. */
export const PALETA_CORREO = {
  navy: "#14246B",
  ink: "#0B1236",
  navyTint: "#E8EBF6",
  bg: "#F3F4F8",
  line: "#E2E6EE",
  muted: "#586074",
  ok: "#17704A",
  okBg: "#E1F3EA",
  warn: "#A64B00",
  warnText: "#6B3400",
  warnBg: "#FDEBD3",
  warnBorder: "#F2C88F",
  blanco: "#FFFFFF",
} as const;
