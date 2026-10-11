import type { SubitemNavegacion } from "@/shared";
import type { SeguimientoModulo } from "../application";
import { PUNTO_SOBRE_OSCURO } from "./estilos";
import { etiquetaDeModulo, moduloInicial, tonoDeExpediente } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

/** Los módulos como sub-ítems de "Mi seguimiento" en la barra lateral (D29). */
export function subitemsDeModulos(seguimiento: SeguimientoModulo[]): SubitemNavegacion[] {
  const inicial = moduloInicial(seguimiento);
  return seguimiento.map((modulo) => {
    const estado = etiquetaDeModulo(modulo);
    return {
      href: RUTAS_ALUMNO.modulo(modulo.modulo),
      etiqueta: `Módulo ${modulo.modulo}: ${estado}`,
      predeterminado: modulo.modulo === inicial,
      contenido: (
        <>
          <span className={`size-2 shrink-0 rounded-full ${PUNTO_SOBRE_OSCURO[tonoDeExpediente(modulo.expediente)]}`} />
          <span className="grow whitespace-nowrap group-data-[contraida=true]/barra:grow-0">
            <span className="group-data-[contraida=true]/barra:sr-only">Módulo </span>
            {modulo.modulo}
          </span>
          <span className="text-[11px] font-normal whitespace-nowrap text-on-ink-muted group-data-[contraida=true]/barra:sr-only">
            {estado}
          </span>
        </>
      ),
    };
  });
}
