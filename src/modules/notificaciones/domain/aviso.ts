// Redacción del correo que avisa al estudiante de un cambio de estado. Es
// TypeScript puro: recibe los textos ya resueltos (nombre del estado, a quién
// entregar la corrección…) y devuelve asunto, texto plano y HTML. Los textos del
// catálogo son de `tramitacion`; quien arma `DatosAviso` los toma de ahí.
import { PALETA_CORREO as C } from "./paleta-correo";

export type TipoDeEstado = "proceso" | "conforme" | "observacion" | "final";

export type DatosAviso = {
  /** Nombres del estudiante, para el saludo ("Giancarlos"). */
  nombres: string;
  modulo: string;
  /** "Implementación de sistemas de información"; `null` si la carrera no está registrada. */
  nombreModulo: string | null;
  estado: { codigo: string; nombre: string; tipo: TipoDeEstado };
  /** El expediente acaba de nacer (Mesa de Partes recibió la carpeta). */
  apertura: boolean;
  /** Lo que sigue a "Ahora": "está con el Docente Supervisor" o "pasa a Coordinación de Carrera". */
  ahora: string;
  /** Motivo de la observación (obligatorio en observaciones) o nota de la oficina. */
  motivo: string | null;
  /** Solo en observaciones: primer paso y a quién entregar ("al Docente Supervisor"). */
  subsanar: { indicacion: string; entregarA: string } | null;
  /** Solo en el estado final: dónde y cuándo recoger la constancia física. */
  constancia: { lugar: string; ubicacion: string; horario: string; queLlevar: string } | null;
  fecha: Date;
  /** Dirección completa del seguimiento del módulo. */
  enlace: string;
};

export type AvisoRedactado = { asunto: string; texto: string; html: string };

const INSTITUTO = "IESTP Gilda Liliana Ballivián Rosado";

/** "25 oct. 2026, 14:39" en hora de Perú, sea cual sea la zona del servidor. */
function fechaDePeru(fecha: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

/** El motivo lo escribe una oficina: se escapa antes de ponerlo en el HTML. */
function escapar(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const moduloConNombre = ({ modulo, nombreModulo }: DatosAviso) =>
  nombreModulo ? `Módulo ${modulo} (${nombreModulo})` : `Módulo ${modulo}`;

function asunto(datos: DatosAviso): string {
  const { modulo, estado } = datos;
  if (estado.tipo === "observacion") return `Tu expediente del Módulo ${modulo} tiene una observación`;
  if (estado.tipo === "final") return `Tu constancia del Módulo ${modulo} está lista para recoger`;
  if (datos.apertura) return `Recibimos tu expediente del Módulo ${modulo}`;
  return `Tu expediente del Módulo ${modulo}: ${estado.nombre}`;
}

/** Frase principal, sin formato. */
function resumen(datos: DatosAviso): string {
  const { estado } = datos;
  const modulo = moduloConNombre(datos);
  if (estado.tipo === "observacion") return `Tu expediente del ${modulo} tiene una observación: ${estado.nombre}.`;
  if (estado.tipo === "final") return `Tu constancia del ${modulo} está lista para recoger.`;
  if (datos.apertura) return `Mesa de Partes recibió la carpeta de tu ${modulo}. Desde ahora puedes seguirla en el sistema.`;
  return `Tu expediente del ${modulo} avanzó: ${estado.codigo} · ${estado.nombre}. Ahora ${datos.ahora}.`;
}

export function redactarAviso(datos: DatosAviso): AvisoRedactado {
  return { asunto: asunto(datos), texto: textoPlano(datos), html: html(datos) };
}

// ---- Texto plano -------------------------------------------------------------

function textoPlano(datos: DatosAviso): string {
  const { motivo, subsanar, constancia, estado } = datos;
  const partes = [`Hola, ${datos.nombres}:`, resumen(datos)];
  if (motivo) partes.push(`${estado.tipo === "observacion" ? "Motivo" : "Nota de la oficina"}: "${motivo}"`);
  if (subsanar) partes.push(`Qué hacer: ${subsanar.indicacion} Luego entrega tu corrección ${subsanar.entregarA}.`);
  if (constancia) {
    partes.push(
      `Dónde: ${constancia.lugar} (${constancia.ubicacion}).\nHorario: ${constancia.horario}.\nQué llevar: ${constancia.queLlevar}.`,
    );
  }
  partes.push(`Registrado el ${fechaDePeru(datos.fecha)}.`, `Ver mi seguimiento: ${datos.enlace}`, pie());
  return partes.join("\n\n");
}

function pie(): string {
  return `Este correo es automático; no respondas a este mensaje.\n${INSTITUTO} · EFSRT Seguimiento`;
}

// ---- HTML ----------------------------------------------------------------------
// Tablas y estilos en línea: es lo que entienden todos los clientes de correo.

const FUENTE = "font-family:Arial,Helvetica,sans-serif;";

function recuadro(contenido: string, tono: "observacion" | "final" | "neutro"): string {
  const estilo = {
    observacion: `background:${C.warnBg};border:1px solid ${C.warnBorder};color:${C.warnText};`,
    final: `background:${C.okBg};border:1px solid ${C.ok};color:${C.ok};`,
    neutro: `background:${C.bg};border:1px solid ${C.line};color:${C.ink};`,
  }[tono];
  return `<div style="${estilo}border-radius:12px;padding:14px 16px;margin:0 0 16px;font-size:14px;line-height:1.5;">${contenido}</div>`;
}

function html(datos: DatosAviso): string {
  const { estado, motivo, subsanar, constancia } = datos;
  const bloques: string[] = [];

  bloques.push(
    `<p style="margin:0 0 12px;font-size:15px;">Hola, ${escapar(datos.nombres)}:</p>`,
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${escapar(resumen(datos))}</p>`,
  );

  if (estado.tipo === "observacion") {
    const motivoHtml = motivo ? `<b>Motivo:</b> ${escapar(motivo)}` : "";
    const queHacer = subsanar
      ? `<br><br><b>Qué hacer:</b> ${escapar(subsanar.indicacion)} Luego entrega tu corrección ${escapar(subsanar.entregarA)}.`
      : "";
    bloques.push(recuadro(motivoHtml + queHacer, "observacion"));
  } else if (motivo) {
    bloques.push(recuadro(`<b>Nota de la oficina:</b> ${escapar(motivo)}`, "neutro"));
  }

  if (constancia) {
    bloques.push(
      recuadro(
        `<b>Dónde:</b> ${escapar(constancia.lugar)} (${escapar(constancia.ubicacion)})<br>` +
          `<b>Horario:</b> ${escapar(constancia.horario)}<br>` +
          `<b>Qué llevar:</b> ${escapar(constancia.queLlevar)}`,
        "final",
      ),
    );
  }

  bloques.push(
    `<p style="margin:0 0 20px;font-size:13px;color:${C.muted};">Registrado el ${escapar(fechaDePeru(datos.fecha))}.</p>`,
    `<a href="${escapar(datos.enlace)}" style="display:inline-block;background:${C.navy};color:${C.blanco};text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:12px;">Ver mi seguimiento</a>`,
  );

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(asunto(datos))}</title></head>
<body style="margin:0;padding:0;background:${C.bg};${FUENTE}color:${C.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.blanco};border:1px solid ${C.line};border-radius:16px;">
<tr><td style="background:${C.ink};color:${C.blanco};padding:16px 24px;border-radius:16px 16px 0 0;${FUENTE}">
<b style="font-size:16px;">EFSRT Seguimiento</b><br><span style="font-size:12px;color:${C.navyTint};">${INSTITUTO}</span>
</td></tr>
<tr><td style="padding:24px;${FUENTE}">
${bloques.join("\n")}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid ${C.line};font-size:12px;color:${C.muted};${FUENTE}">
Este correo es automático; no respondas a este mensaje.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
