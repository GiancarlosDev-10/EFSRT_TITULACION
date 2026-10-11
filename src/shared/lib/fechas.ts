// Fechas para la interfaz: español de Perú y hora de Lima, sin importar la
// zona horaria del servidor o del navegador.

const ZONA_HORARIA = "America/Lima";

const formatoDia = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", timeZone: ZONA_HORARIA });
const formatoHora = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA_HORARIA,
});
const formatoCalendario = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ZONA_HORARIA,
});

/** Día calendario en Lima, como número de días desde 1970 (para comparar fechas). */
function diaEnLima(fecha: Date): number {
  const [anio, mes, dia] = formatoCalendario.format(fecha).split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia) / 86_400_000;
}

function anioEnLima(fecha: Date): string {
  return formatoCalendario.format(fecha).slice(0, 4);
}

/** "15 set." — Intl devuelve "15-set.", así que se arma por partes. */
export function fechaCorta(fecha: Date): string {
  const partes = formatoDia.formatToParts(fecha);
  const dia = partes.find((p) => p.type === "day")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  return `${dia} ${mes}`;
}

/** "09:40" */
export function hora(fecha: Date): string {
  return formatoHora.format(fecha);
}

/** Días calendario completos entre dos fechas, en hora de Lima. */
export function diasEntre(desde: Date, hasta: Date): number {
  return diaEnLima(hasta) - diaEnLima(desde);
}

/** "hoy", "ayer", "15 set." o "15 set. 2025" si es de otro año. */
export function diaRelativo(fecha: Date, ahora: Date): string {
  const dias = diasEntre(fecha, ahora);
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  const anio = anioEnLima(fecha) === anioEnLima(ahora) ? "" : ` ${anioEnLima(fecha)}`;
  return `${fechaCorta(fecha)}${anio}`;
}

/** "hoy", "hace 1 día", "hace 3 días". */
export function haceDias(desde: Date, ahora: Date): string {
  const dias = diasEntre(desde, ahora);
  if (dias <= 0) return "hoy";
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
