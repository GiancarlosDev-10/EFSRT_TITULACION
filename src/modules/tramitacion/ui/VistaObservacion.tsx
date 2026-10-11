// Detalle de una observación (mockup Observacion.dc.html): motivo, quién la
// registró, dónde está la carpeta y la guía de tres pasos (D22).
import Link from "next/link";
import { Avatar, EncabezadoPagina, IconoCheckCirculo, IconoUbicacion, TituloSeccion } from "@/shared";
import { ChipCodigo } from "./ChipCodigo";
import type { DetalleObservacion } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

type Props = {
  detalle: DetalleObservacion;
  nombreModulo?: string;
};

export function VistaObservacion({ detalle, nombreModulo }: Props) {
  const { modulo } = detalle;
  const verRecorrido = (
    <Link
      href={RUTAS_ALUMNO.seguimiento(modulo)}
      className="flex min-h-12 items-center justify-center rounded-[14px] border border-navy text-sm font-semibold text-navy hover:bg-navy-tint"
    >
      Ver todo el recorrido
    </Link>
  );

  return (
    <>
      <EncabezadoPagina
        volverA={RUTAS_ALUMNO.seguimiento(modulo)}
        etiquetaVolver="Volver al seguimiento"
        titulo="Observación"
        subtitulo={`Módulo ${modulo}${nombreModulo ? ` · ${nombreModulo}` : ""}`}
      />

      {!detalle.vigente ? (
        <div className="flex flex-col items-center gap-3 rounded-[22px] border border-line bg-white px-6 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-ok-bg text-ok">
            <IconoCheckCirculo tamano={28} />
          </span>
          <span className="font-display text-lg font-extrabold">Esta observación ya fue subsanada</span>
          <span className="text-[13px] leading-relaxed text-text-soft">
            Tu expediente siguió su recorrido. Revisa en qué oficina está ahora.
          </span>
        </div>
      ) : (
        <>
          <article className="flex flex-col gap-4 rounded-[22px] border-2 border-warn-bright bg-white p-5">
            <div className="flex items-center gap-2">
              <ChipCodigo codigo={detalle.codigo} tono="observado" />
              <span className="text-sm font-semibold">{detalle.nombre}</span>
            </div>
            <blockquote className="font-display text-[17px] leading-snug font-extrabold text-warn-deep">
              “{detalle.motivo}”
            </blockquote>
            <div className="flex items-center gap-3 border-t border-line pt-4">
              <Avatar nombre={detalle.actor} className="size-10 text-[13px]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">Registrado por {detalle.actor}</span>
                <span className="font-mono text-[11px] text-muted">{detalle.registro}</span>
              </div>
            </div>
          </article>

          <div className="flex items-center gap-3 rounded-[18px] bg-navy-tint px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-navy">
              <IconoUbicacion tamano={20} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Tu carpeta está en</span>
              <span className="text-sm font-semibold">{detalle.lugar}</span>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <TituloSeccion>Qué tienes que hacer</TituloSeccion>
            <ol className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4">
              {detalle.pasos.map((paso, i) => (
                <li key={paso} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-[13px] leading-relaxed">{paso}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {verRecorrido}
    </>
  );
}
