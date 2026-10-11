/**
 * Resultado de una operación que puede fallar por una regla de negocio.
 * El dominio devuelve los errores en vez de lanzarlos, así TypeScript obliga
 * a quien llama a revisar `ok` antes de usar el valor.
 */
export type Resultado<T, E> = { ok: true; valor: T } | { ok: false; error: E };

export function exito<T>(valor: T): { ok: true; valor: T } {
  return { ok: true, valor };
}

export function fallo<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}
