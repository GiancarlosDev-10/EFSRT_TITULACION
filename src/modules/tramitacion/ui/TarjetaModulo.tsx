import Link from "next/link";
import { IconoChevronDerecha, IconoUbicacion } from "@/shared";
import type { SeguimientoModulo } from "../application";
import { SEGMENTO } from "./estilos";
import { PildoraEstado } from "./PildoraEstado";
import { etiquetaDeModulo, progresoDeExpediente, tonoDeExpediente } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

/** Tarjeta de un módulo en "Mis expedientes" (celular). */
export function TarjetaModulo({ seguimiento, ahora }: { seguimiento: SeguimientoModulo; ahora: Date }) {
  const { modulo, expediente } = seguimiento;
  const tono = tonoDeExpediente(expediente);
  const encabezado = (
    <div className="flex items-start gap-2.5">
      <span className="grow font-display text-[15px] font-bold">Módulo {modulo}</span>
      <PildoraEstado texto={etiquetaDeModulo(seguimiento)} tono={tono} />
    </div>
  );

  if (!expediente) {
    return (
      <Link
        href={RUTAS_ALUMNO.requisitos}
        className="flex flex-col gap-2.5 rounded-[20px] border border-dashed border-pending bg-white p-4"
      >
        {encabezado}
        <span className="text-[13px] leading-normal text-text-soft">
          Aparecerá aquí cuando Mesa de Partes reciba tu carpeta.
        </span>
        <span className="flex items-center gap-1 text-[13px] font-semibold text-navy">
          Cómo iniciar el trámite <IconoChevronDerecha tamano={16} />
        </span>
      </Link>
    );
  }

  const progreso = progresoDeExpediente(expediente, ahora);
  const destino = tono === "listo" ? RUTAS_ALUMNO.constancia(modulo) : RUTAS_ALUMNO.seguimiento(modulo);
  return (
    <Link href={destino} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4 hover:border-pending">
      {encabezado}
      <div className="flex items-center gap-2.5 rounded-xl bg-bg px-3 py-2.5">
        <IconoUbicacion tamano={18} className={tono === "listo" ? "text-ok" : "text-navy"} />
        <span className="text-[13px]">
          <span className="text-muted">{progreso.ubicacion.prefijo}</span>{" "}
          <b className="font-semibold">{progreso.ubicacion.lugar}</b>
        </span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {progreso.segmentos.map((situacion, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${SEGMENTO[situacion]}`} />
        ))}
      </div>
      <span className="text-xs text-muted">{progreso.texto}</span>
    </Link>
  );
}
