// Composiciones de /alumno (D26): el mismo seguimiento se muestra como
// tarjetas en celular y como panel con tracker y mapa en PC.
import type { ReactNode } from "react";
import { TituloSeccion } from "@/shared";
import type { Modulo } from "../domain";
import type { SeguimientoModulo } from "../application";
import { BotonConstancia } from "./BotonConstancia";
import { MapaRecorrido } from "./MapaRecorrido";
import {
  avisosDeObservacion,
  etapaInicial,
  etapasDe,
  moduloInicial,
  ordenParaInicio,
  resumenDeEtapa,
  tonoDeExpediente,
  ubicacionDeModulo,
  ultimosMovimientos,
} from "./presentacion";
import { TarjetaModulo } from "./TarjetaModulo";
import { TarjetaUbicacion } from "./TarjetaUbicacion";
import { TrackerDependencias } from "./TrackerDependencias";
import { UltimosMovimientos } from "./UltimosMovimientos";

type Props = {
  seguimiento: SeguimientoModulo[];
  ahora: Date;
  /** Saludo ya armado por la página. */
  encabezado: ReactNode;
};

type PropsMovil = Props & {
  /** Nombres de los módulos de la carrera; `null` si no se conocen. */
  nombresModulo: Record<Modulo, string> | null;
};

/**
 * Celular: saludo, tarjetas por módulo y últimos movimientos. Un módulo
 * observado va primero y con su tarjeta destacada (D28).
 */
export function SeguimientoMovil({ seguimiento, ahora, encabezado, nombresModulo }: PropsMovil) {
  const avisos = avisosDeObservacion(seguimiento, ahora);
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 lg:hidden">
      {encabezado}
      <section className="flex flex-col gap-3">
        <TituloSeccion>Mis expedientes</TituloSeccion>
        {ordenParaInicio(seguimiento).map((modulo) => (
          <TarjetaModulo
            key={modulo.modulo}
            seguimiento={modulo}
            ahora={ahora}
            aviso={avisos.find((aviso) => aviso.modulo === modulo.modulo)}
            nombre={nombresModulo?.[modulo.modulo]}
          />
        ))}
      </section>
      <UltimosMovimientos movimientos={ultimosMovimientos(seguimiento, ahora)} />
    </div>
  );
}

/**
 * PC: saludo y, debajo, el módulo elegido en la barra lateral (D29): tarjeta de
 * ubicación (con su observación vigente, si la hay), tracker y mapa. Las
 * observaciones de otros módulos se ven en la barra lateral (D28).
 */
export function SeguimientoEscritorio({ seguimiento, ahora, encabezado, modulo }: Props & { modulo: Modulo | null }) {
  const elegido = modulo ?? moduloInicial(seguimiento);
  const seguimientoModulo = seguimiento.find((m) => m.modulo === elegido) ?? seguimiento[0];
  const { expediente } = seguimientoModulo;
  const etapas = etapasDe(expediente);
  const posicion = expediente ? etapas.findIndex((e) => e.dependencia === expediente.ubicacion.dependencia) : null;
  const aviso = avisosDeObservacion([seguimientoModulo], ahora)[0];

  return (
    <div className="hidden flex-col gap-6 lg:flex">
      {encabezado}

      {/* key: al cambiar de módulo se reinician el tracker y la animación del mapa. */}
      <div key={elegido} className="flex items-start gap-6">
        <div className="flex w-[330px] shrink-0 flex-col gap-3.5">
          <TarjetaUbicacion ubicacion={ubicacionDeModulo(seguimientoModulo, ahora)} aviso={aviso} />
          {tonoDeExpediente(expediente) === "listo" && <BotonConstancia modulo={elegido} />}
          <TrackerDependencias
            etapas={etapas}
            hayExpediente={expediente !== null}
            abierta={etapaInicial(expediente)}
            ahora={ahora}
          />
        </div>
        <div className="min-w-0 grow">
          <MapaRecorrido
            etapas={etapas.map((etapa) => ({
              nombre: etapa.nombre,
              situacion: etapa.situacion,
              resumen: resumenDeEtapa(etapa, ahora),
            }))}
            tono={tonoDeExpediente(expediente)}
            posicion={posicion}
          />
        </div>
      </div>
    </div>
  );
}
