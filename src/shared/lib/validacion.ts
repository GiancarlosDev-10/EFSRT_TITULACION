// Validación de datos que llegan del navegador (URL, formularios). Las Server
// Actions son endpoints públicos: nada se usa sin pasar por aquí.

const FORMA_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ¿Es un identificador (UUID) bien formado? */
export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && FORMA_DE_UUID.test(valor);
}
