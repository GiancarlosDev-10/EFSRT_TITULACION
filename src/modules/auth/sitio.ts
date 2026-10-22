import "server-only";

/**
 * Dirección pública del sistema, fijada por configuración. No se toma de los
 * encabezados de la petición: un `Host` falso podría desviar el retorno del
 * login a otro sitio. Debe figurar en las "Redirect URLs" de Supabase.
 */
export function urlDelSitio(): string {
  return (process.env.URL_DEL_SITIO ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Adonde vuelve el navegador después de Google o del enlace al correo. */
export function urlDeRetorno(): string {
  return `${urlDelSitio()}/auth/callback`;
}
