// Constancia lista para recoger (mockup Constancia.dc.html). La constancia se
// recoge en físico: aquí solo se informa dónde, cuándo y qué llevar.
import Link from "next/link";
import type { ReactNode } from "react";
import {
  EncabezadoPagina,
  IconoCheck,
  IconoCheckCirculo,
  IconoIdentificacion,
  IconoReloj,
  IconoUbicacion,
  TituloSeccion,
} from "@/shared";
import type { Modulo } from "../domain";
import type { SeguimientoModulo } from "../application";
import { INSTITUCION } from "./contenido";
import { resumenDeConstancia } from "./presentacion";
import { RUTAS_ALUMNO } from "./rutas";

const subtituloDe = (modulo: Modulo, nombre?: string) => `Módulo ${modulo}${nombre ? ` · ${nombre}` : ""}`;

function Dato({ icono, rotulo, children }: { icono: ReactNode; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 text-navy">{icono}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">{rotulo}</span>
        {children}
      </div>
    </div>
  );
}

type Props = { datos: SeguimientoModulo; nombreModulo?: string };

export function VistaConstancia({ datos, nombreModulo }: Props) {
  const { modulo, expediente } = datos;
  const resumen = expediente && resumenDeConstancia(expediente);
  const { bienestar } = INSTITUCION;
  const verHistorial = (
    <Link
      href={RUTAS_ALUMNO.seguimiento(modulo)}
      className="flex min-h-12 items-center justify-center rounded-[14px] border border-navy text-sm font-semibold text-navy hover:bg-navy-tint"
    >
      Ver el historial completo
    </Link>
  );

  return (
    <>
      <EncabezadoPagina
        volverA={RUTAS_ALUMNO.inicio}
        etiquetaVolver="Volver al inicio"
        titulo="Tu constancia"
        subtitulo={subtituloDe(modulo, nombreModulo)}
      />

      {!resumen ? (
        <>
          <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-pending bg-white px-6 py-8 text-center">
            <span className="font-display text-lg font-extrabold">Tu constancia aún no está lista</span>
            <span className="text-[13px] leading-relaxed text-text-soft">
              Estará lista cuando Bienestar y Empleabilidad registre el visto bueno final. Te avisaremos por correo.
            </span>
          </div>
          {verHistorial}
        </>
      ) : (
        // En PC, dos columnas: qué hacer para recogerla | cómo fue el recorrido.
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 rounded-[22px] border border-ok-soft bg-ok-bg px-6 py-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-ok text-white">
                <IconoCheckCirculo tamano={28} />
              </span>
              <span className="font-display text-xl font-extrabold text-ok">Lista para recoger</span>
              <span className="text-[13px] leading-relaxed text-ok-on-soft">{resumen.vistoBueno}</span>
            </div>

            <section className="flex flex-col divide-y divide-line rounded-[20px] border border-line bg-white p-4">
              <Dato icono={<IconoUbicacion />} rotulo="Dónde">
                <span className="text-sm font-semibold">{bienestar.nombre}</span>
                <span className="text-[13px] text-text-soft">{bienestar.ubicacion}</span>
              </Dato>
              <Dato icono={<IconoReloj />} rotulo="Horario">
                <span className="text-[13px]">{bienestar.horario}</span>
              </Dato>
              <Dato icono={<IconoIdentificacion />} rotulo="Qué llevar">
                <span className="text-sm font-semibold">{bienestar.queLlevar}</span>
              </Dato>
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-3">
              <TituloSeccion>Recorrido de tu expediente</TituloSeccion>
              <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4">
                <ol className="flex flex-col gap-2.5">
                  {resumen.tramos.map((tramo) => (
                    <li key={tramo.nombre} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                        <IconoCheck tamano={13} />
                      </span>
                      <span className="grow text-[13px] font-semibold">{tramo.nombre}</span>
                      <span className="font-mono text-[11px] text-muted">{tramo.periodo}</span>
                    </li>
                  ))}
                </ol>
                <span className="border-t border-line pt-3 text-xs text-text-soft">
                  Desde la recepción hasta la constancia: <b className="font-semibold text-ink">{resumen.dias} días</b>.
                </span>
              </div>
            </section>
            {verHistorial}
          </div>
        </div>
      )}
    </>
  );
}
