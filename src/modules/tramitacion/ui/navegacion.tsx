import type { SubitemNavegacion } from "@/shared";
import type { Modulo } from "../domain";
import type { SeguimientoModulo } from "../application";
import { PUNTO_SOBRE_OSCURO } from "./estilos";
import { constanciasListas, etiquetaDeModulo, moduloInicial, tonoDeExpediente, type TonoExpediente } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

/** Punto de color, "Módulo I" y su estado; con la barra contraída queda solo "I". */
function contenidoDeSubitem(modulo: Modulo, tono: TonoExpediente, estado: string) {
  return (
    <>
      <span className={`size-2 shrink-0 rounded-full ${PUNTO_SOBRE_OSCURO[tono]}`} />
      <span className="grow whitespace-nowrap group-data-[contraida=true]/barra:grow-0">
        <span className="group-data-[contraida=true]/barra:sr-only">Módulo </span>
        {modulo}
      </span>
      <span className="text-[11px] font-normal whitespace-nowrap text-on-ink-muted group-data-[contraida=true]/barra:sr-only">
        {estado}
      </span>
    </>
  );
}

/** Los módulos como sub-ítems de "Mi seguimiento" en la barra lateral (D29). */
export function subitemsDeModulos(seguimiento: SeguimientoModulo[]): SubitemNavegacion[] {
  const inicial = moduloInicial(seguimiento);
  return seguimiento.map((datos) => {
    const estado = etiquetaDeModulo(datos);
    return {
      href: RUTAS_ALUMNO.seguimiento(datos.modulo),
      etiqueta: `Módulo ${datos.modulo}: ${estado}`,
      // Sin módulo en la ruta (inicio o pestaña Seguimiento) se muestra el predeterminado.
      predeterminadoEn: datos.modulo === inicial ? [RUTAS_ALUMNO.inicio, RUTAS_ALUMNO.seguimientos] : undefined,
      contenido: contenidoDeSubitem(datos.modulo, tonoDeExpediente(datos.expediente), estado),
    };
  });
}

/** Las constancias listas como sub-ítems de "Mis constancias" (D35). Vacío si no hay ninguna. */
export function subitemsDeConstancias(seguimiento: SeguimientoModulo[]): SubitemNavegacion[] {
  return constanciasListas(seguimiento).map(({ modulo }) => ({
    href: RUTAS_ALUMNO.constancia(modulo),
    etiqueta: `Constancia del Módulo ${modulo}: lista para recoger`,
    contenido: contenidoDeSubitem(modulo, "listo", "Lista para recoger"),
  }));
}
