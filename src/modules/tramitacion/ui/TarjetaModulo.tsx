import Link from "next/link";
import { IconoAlerta, IconoChevronDerecha, IconoUbicacion } from "@/shared";
import type { SeguimientoModulo } from "../application";
import { SEGMENTO } from "./estilos";
import { PildoraEstado } from "./PildoraEstado";
import { etiquetaDeModulo, progresoDeExpediente, tonoDeExpediente, type AvisoObservacion } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

type Props = {
  seguimiento: SeguimientoModulo;
  ahora: Date;
  /** Observación vigente del módulo, si la hay: la tarjeta se destaca. */
  aviso?: AvisoObservacion;
  /** Nombre del módulo en la carrera del estudiante, si se conoce. */
  nombre?: string;
};

/** Tarjeta de un módulo en "Mis expedientes" (celular). */
export function TarjetaModulo({ seguimiento, ahora, aviso, nombre }: Props) {
  const { modulo, expediente } = seguimiento;
  const tono = tonoDeExpediente(expediente);
  const encabezado = (
    <div className="flex items-start gap-2.5">
      {nombre ? (
        <span className="flex min-w-0 grow flex-col gap-px">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">Módulo {modulo}</span>
          <span className="font-display text-[15px] leading-snug font-bold">{nombre}</span>
        </span>
      ) : (
        <span className="grow font-display text-[15px] font-bold">Módulo {modulo}</span>
      )}
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
    <Link
      href={destino}
      className={`flex flex-col gap-3 rounded-[20px] bg-white p-4 ${
        aviso ? "border-2 border-warn-bright" : "border border-line hover:border-pending"
      }`}
    >
      {encabezado}
      {aviso ? (
        // Observación vigente (D28): reemplaza al aviso global del inicio.
        <div className="flex flex-col gap-2 rounded-xl bg-warn-bg px-3 py-2.5 text-warn-on-soft">
          <span className="flex items-start gap-2 text-[13px] font-semibold text-warn-deep">
            <IconoAlerta tamano={16} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">“{aviso.motivo}”</span>
          </span>
          <span className="text-xs font-semibold">{aviso.entrega}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl bg-bg px-3 py-2.5">
          <IconoUbicacion tamano={18} className={tono === "listo" ? "text-ok" : "text-navy"} />
          <span className="text-[13px]">
            <span className="text-muted">{progreso.ubicacion.prefijo}</span>{" "}
            <b className="font-semibold">{progreso.ubicacion.lugar}</b>
          </span>
        </div>
      )}
      <div className="flex gap-1" aria-hidden="true">
        {progreso.segmentos.map((situacion, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${SEGMENTO[situacion]}`} />
        ))}
      </div>
      <span className="text-xs text-muted">{progreso.texto}</span>
    </Link>
  );
}
